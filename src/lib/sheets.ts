import Papa from 'papaparse';
import { COLS, IMG_SRC, type Source } from './config';
import { fetchCSV } from './csv';
import { clean, colName, norm } from './text';

/** A parsed tab: headers plus the column indexes the UI needs. */
export interface Sheet {
  src: Source;
  gid: string;            // current gid (may differ from src.gid after a lookup)
  at: number;             // when the data was fetched
  headers: string[];
  rows: string[][];
  keyIdx: number[];
  nameIdx?: number;
  metaIdx: number[];
  statusIdx: number[];
  lateIdx?: number;
  shortIdx?: number;
  skuIdx?: number;
  pinIdx: number[];
}

export async function loadSheet(src: Source, opts: Parameters<typeof fetchCSV>[1]): Promise<Sheet> {
  const { text, at, gid } = await fetchCSV(src, opts);
  const rows = Papa.parse<string[]>(text).data;
  const hr = rows.slice(0, 5).findIndex(r => r.some(h => src.keys.includes(clean(h))));
  if (hr < 0) throw new Error('không thấy cột ' + src.keys.join('/'));
  const headers = rows[hr].map((x, i) => clean(x) || 'Cột ' + colName(i));
  const all = (list: string[]) => list.map(k => headers.indexOf(k)).filter(i => i >= 0);
  return {
    src, gid, at, headers, rows: rows.slice(hr + 1),
    keyIdx: all(src.keys), nameIdx: all(COLS.name)[0], metaIdx: all(src.meta || COLS.meta),
    statusIdx: all(COLS.status), lateIdx: all(COLS.late)[0], shortIdx: all([src.short || COLS.short])[0], skuIdx: all(COLS.sku)[0],
    pinIdx: all(COLS.pinned[src.group] || []),
  };
}

/** STYLE (upper case, no extension) -> Drive file id */
export async function loadImages(force?: boolean): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  const rows = Papa.parse<string[]>((await fetchCSV(IMG_SRC, { force })).text).data;
  const h = rows.slice(0, 10).find(r => r.includes('Tên')) || [];
  const starts = h.flatMap((x, i) => x === 'Tên' && h[i + 1] === 'ID Tập' ? [i] : []);
  for (const r of rows) for (const i of starts) {
    const name = norm(r[i]).replace(/\.\w+$/, ''), id = (r[i + 1] || '').trim();
    if (name && /^[\w-]{20,}$/.test(id)) images.set(name, id); // skips the "Tên"/"ID Tập" header cells
  }
  return images;
}

/** User-facing message for a failed tab. */
export const loadError = (e: unknown) =>
  e instanceof TypeError ? 'Google chặn tạm hoặc sheet không còn chia sẻ công khai' : e instanceof Error ? e.message : String(e);
