import { FAIL, PASS } from './config';
import type { Sheet } from './sheets';
import { clean, norm } from './text';

export type Tone = 'pass' | 'fail' | 'wait' | '';

export interface Hit { row: string[]; k: number; id: string; exact: boolean; pass: boolean }
export interface SheetHits { sheet: Sheet; hits: Hit[]; pass: boolean }

export function statusOf(s: Sheet, row: string[]): [Tone, string] {
  if (s.shortIdx !== undefined) {
    const t = clean(row[s.shortIdx] || '');
    return !t || t === '-' ? ['pass', 'Đủ'] : ['fail', 'Thiếu ' + t];
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
  return sheets.map(sheet => {
    const hits: Hit[] = [];
    sheet.rows.forEach((row, i) => {
      const k = sheet.keyIdx.find(c => sheet.src.prefix ? norm(row[c]).startsWith(q) : norm(row[c]).includes(q));
      if (k !== undefined) hits.push({ row, k, id: sheet.src.key + ':' + i, exact: norm(row[k]) === q, pass: statusOf(sheet, row)[0] === 'pass' });
    });
    hits.sort((a, b) => +b.exact - +a.exact || +b.pass - +a.pass); // approved rows first, so they're on the first page
    return { sheet, hits, pass: hits.some(h => h.pass) };
  }).filter(x => x.hits.length)
    .sort((a, b) => +b.pass - +a.pass); // stable, so SOURCES order stays otherwise
}

/** Splits `text` around the first match of `q`, for <mark>. */
export function splitMatch(text: string, q: string): [string, string, string] {
  const i = norm(text).indexOf(q);
  return i < 0 ? [text, '', ''] : [text.slice(0, i), text.slice(i, i + q.length), text.slice(i + q.length)];
}
