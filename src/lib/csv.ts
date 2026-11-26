// Fetching sheet tabs as CSV, with a short IndexedDB cache and retries.

const RETRY_WAIT = [3000, 8000, 15000], CACHE_MS = 3 * 60 * 1000, MAX_CONCURRENT = 3;

interface Tab { id: string; gid: string; tab?: string; range?: string }

// Cap simultaneous docs.google.com fetches app-wide; cache hits and retry backoffs don't hold a slot.
let inFlight = 0;
const waitQueue: (() => void)[] = [];
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_CONCURRENT) await new Promise<void>(r => waitQueue.push(r));
  else inFlight++;
  try { return await fn(); }
  finally {
    const next = waitQueue.shift();
    if (next) next(); else inFlight--;
  }
}

// IndexedDB, not localStorage: the sheets are ~5MB of text, which fills localStorage's quota and breaks recent searches.
const idb = <T>(mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  const open = indexedDB.open('tracuu', 1);
  open.onupgradeneeded = () => open.result.createObjectStore('csv');
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const db = open.result;
    try { // a throw in this callback would otherwise leave the promise pending forever
      const tx = db.transaction('csv', mode);
      tx.oncomplete = tx.onabort = () => db.close(); // an open connection would block a future version upgrade
      const req = op(tx.objectStore('csv'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { db.close(); reject(e); }
  };
});

// By tab name when there is one: survives the tab being recreated with a new gid.
const cacheKey = (t: Tab) => `${t.id}.${t.tab || t.gid}`;

/** Drop cached tabs no longer in use; put() overwrites the rest, so the cache stays at one copy per tab. */
export const pruneCache = (tabs: Tab[]) => idb('readonly', s => s.getAllKeys()).then(keys => {
  const keep = new Set(tabs.map(cacheKey));
  keys.filter(k => !keep.has(String(k))).forEach(k => idb('readwrite', s => s.delete(k)).catch(() => {}));
}).catch(() => {});

/** htmlview lists every tab as {name: "CHITIET", pageUrl: "...", gid: "386902746"}. */
async function lookupGid(t: Tab): Promise<string | undefined> {
  try {
    const html = await withSlot(async () => (await fetch(`https://docs.google.com/spreadsheets/d/${t.id}/htmlview`, { cache: 'no-store' })).text());
    const gid = html.match(new RegExp(`name: "${t.tab}", pageUrl: "[^"]*", gid: "(\\d+)"`))?.[1];
    return gid && gid !== t.gid ? gid : undefined;
  } catch { return undefined; }
}

export interface Fetched { text: string; at: number; gid: string }

// Google's 429 usually comes without CORS headers, so it surfaces as a network TypeError, not res.status.
export async function fetchCSV(t: Tab, opts: { force?: boolean; onRetry?: (attempt: number, of: number) => void } = {}): Promise<Fetched> {
  const key = cacheKey(t);
  let gid = t.gid;
  try {
    const c = await idb<{ at: number; text: string; gid?: string } | undefined>('readonly', s => s.get(key));
    if (c?.gid) gid = c.gid; // even when stale: the last gid that worked beats the hardcoded one for recreated tabs
    const age = c ? Date.now() - c.at : -1;
    if (c && !opts.force && age >= 0 && age < CACHE_MS) return { text: c.text, at: c.at, gid }; // age < 0: clock moved back since caching, don't trust it
  } catch {} // no IndexedDB (private mode, blocked storage): just fetch

  let relooked = false;
  for (let attempt = 0; ; attempt++) {
    let err: unknown, retryable = true;
    try {
      const r = await withSlot(async () => {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${t.id}/export?format=csv&gid=${gid}${t.range ? '&range=' + t.range : ''}`, { cache: 'no-store' });
        return res.ok ? { ok: true as const, text: await res.text() } : { ok: false as const, status: res.status };
      });
      if (r.ok) {
        const at = Date.now();
        idb('readwrite', s => s.put({ at, text: r.text, gid }, key)).catch(() => {}); // caching is best-effort, don't wait on it
        return { text: r.text, at, gid };
      }
      if (r.status === 400 && t.tab && !relooked) { // 400 = no tab with this gid
        relooked = true;
        const found = await lookupGid({ ...t, gid });
        if (found) { gid = found; attempt--; continue; }
      }
      err = new Error('HTTP ' + r.status);
      retryable = r.status === 429 || r.status >= 500; // other 4xx (sheet made private, deleted) won't fix itself
    } catch (e) { err = e; } // network error, incl. a 429 hidden by missing CORS headers
    if (!retryable || attempt >= RETRY_WAIT.length) throw err;
    opts.onRetry?.(attempt + 1, RETRY_WAIT.length);
    await new Promise(r => setTimeout(r, RETRY_WAIT[attempt] * (0.8 + Math.random() * 0.4))); // jitter so the office doesn't retry in lockstep
  }
}
