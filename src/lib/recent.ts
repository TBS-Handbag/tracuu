import { norm } from './text';

const KEY = 'tracuu.recent';

export function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch { return []; }
}

export function saveRecent(v: string) {
  try { localStorage.setItem(KEY, JSON.stringify([v, ...getRecent().filter(x => norm(x) !== norm(v))].slice(0, 8))); } catch {}
}
