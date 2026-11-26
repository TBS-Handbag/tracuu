import { FAIL, PASS } from './config';
import type { Sheet } from './sheets';
import { clean, norm } from './text';

export type Tone = 'pass' | 'fail' | 'wait' | '';

export interface Hit { row: string[]; k: number; id: string; exact: boolean; pass: boolean; fail: boolean }
export interface SheetHits { sheet: Sheet; hits: Hit[]; pass: boolean }

export function statusOf(s: Sheet, row: string[]): [Tone, string] {
  if (s.shortIdx !== undefined) {
    const t = clean(row[s.shortIdx] || '');
    // "-", "0", "(0,00)" and positive surplus values mean nothing missing; only negative non-zero ("(x)" or "-x") is a shortfall
    return /^[(-]/.test(t) && /[1-9]/.test(t) ? ['fail', `${s.headers[s.shortIdx]} ${t}`] : ['pass', 'Đủ'];
  }
  const late = s.lateIdx !== undefined && /^late$/i.test(clean(row[s.lateIdx] || '')) ? ', trễ' : '';
  for (const i of s.statusIdx) {
    const t = clean(row[i] || '');
    if (!t || t === '-' || t.length > 20) continue; // long free-text notes are not a status
    return [FAIL.test(t) ? 'fail' : PASS.test(t) ? 'pass' : 'wait', t + late];
  }
  return [late ? 'wait' : '', late ? 'Trễ' : ''];
}

export function imageOf(images: Map<string, string>, s: Sheet, row: string[], k: number) {
  for (const v of [row[k], s.skuIdx !== undefined ? row[s.skuIdx] : '']) {
    const t = norm(v);
    if (t && images.has(t)) return images.get(t);
    const base = t.split('-')[0];
    if (base.length >= 4 && images.has(base)) return images.get(base); // >= 4: CM# like "W-VB31624" must not match an image named "W"
  }
}

/** `q` must already be norm()-ed. Sheets and rows with an approved status come first. */
export function search(sheets: Sheet[], q: string): SheetHits[] {
  return sheets.filter(s => !s.src.attach).map(sheet => {
    const hits: Hit[] = [];
    sheet.rows.forEach((row, i) => {
      const k = sheet.keyIdx.find(c => sheet.src.prefix?.includes(sheet.headers[c]) ? norm(row[c]).startsWith(q) : norm(row[c]).includes(q));
      if (k !== undefined) {
        const tone = statusOf(sheet, row)[0];
        hits.push({ row, k, id: sheet.src.key + ':' + i, exact: norm(row[k]) === q, pass: tone === 'pass', fail: tone === 'fail' });
      }
    });
    hits.sort((a, b) => sheet.shortIdx !== undefined
      ? +b.fail - +a.fail || +b.exact - +a.exact
      : +b.exact - +a.exact || +b.pass - +a.pass); // shortfall rows first for Cân đối, exact then approved otherwise
    return { sheet, hits, pass: hits.some(h => h.pass) };
  }).filter(x => x.hits.length)
    .sort((a, b) => +b.pass - +a.pass); // stable, so SOURCES order stays otherwise
}

/** An attached tab (src.attach) indexed by its `keys`, for the rows of the source it attaches to. */
export interface Link { sheet: Sheet; rows: Map<string, string[][]> }

const joinKey = (row: string[], idx: number[]) => idx.map(i => norm(row[i])).join('|');

// Keyed by Sheet object: a tab's Sheet is only replaced when its data is refetched, so other tabs loading don't re-index ~40k rows.
const indexed = new WeakMap<Sheet, Map<string, string[][]>>();
function groupBy(sheet: Sheet, idx: number[]) {
  let m = indexed.get(sheet);
  if (!m) {
    m = new Map();
    for (const r of sheet.rows) {
      if (!idx.every(i => norm(r[i]))) continue;
      const k = joinKey(r, idx);
      const list = m.get(k);
      if (list) list.push(r); else m.set(k, [r]);
    }
    indexed.set(sheet, m);
  }
  return m;
}

/** parent source key -> its attached tab */
export function linkIndex(sheets: Sheet[]): Map<string, Link> {
  const links = new Map<string, Link>();
  for (const sheet of sheets) {
    if (!sheet.src.attach || sheet.keyIdx.length !== sheet.src.keys.length) continue; // a missing key column would join on the wrong values
    links.set(sheet.src.attach.to, { sheet, rows: groupBy(sheet, sheet.keyIdx) });
  }
  return links;
}

/** Rows of `link` matching `row` of `parent`, and how many parent rows share them; none when `parent` lacks a join column. */
export function linkedRows(link: Link, parent: Sheet, row: string[]): { rows: string[][]; shared: number } {
  const on = link.sheet.src.attach!.on.map(h => parent.headers.indexOf(h));
  if (on.includes(-1)) return { rows: [], shared: 0 };
  const k = joinKey(row, on);
  return { rows: link.rows.get(k) || [], shared: groupBy(parent, on).get(k)?.length || 0 };
}

/** Splits `text` around the first match of `q`, for <mark>. */
export function splitMatch(text: string, q: string): [string, string, string] {
  const i = norm(text).indexOf(q);
  return i < 0 ? [text, '', ''] : [text.slice(0, i), text.slice(i, i + q.length), text.slice(i + q.length)];
}
