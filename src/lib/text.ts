export const clean = (h: string) => h.replace(/\s+/g, ' ').trim();
export const norm = (s: string | undefined) => String(s || '').trim().toUpperCase();

/** 0 -> "A", 26 -> "AA" */
export const colName = (i: number) => {
  let s = '';
  for (i++; i; i = (i - 1) / 26 | 0) s = String.fromCharCode(65 + (i - 1) % 26) + s;
  return s;
};

export const sheetUrl = (id: string, gid: string) => `https://docs.google.com/spreadsheets/d/${id}/edit#gid=${gid}`;
export const driveThumb = (id: string, w: number) => `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${w}`;
export const driveView = (id: string) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
