'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IMG_SRC, SOURCES, type Source } from '@/lib/config';
import { pruneCache } from '@/lib/csv';
import { loadError, loadImages, loadSheet, type Sheet } from '@/lib/sheets';

export interface TabState { sheet?: Sheet; error?: string; pending?: boolean }

/** Loads every non-lazy tab on mount; lazy tabs load on want(). */
export function useSheets() {
  const [tabs, setTabs] = useState<Record<string, TabState>>({});
  const [images, setImages] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [retry, setRetry] = useState<string | null>(null);
  const wanted = useRef(new Set<string>());
  const inFlight = useRef(new Map<string, Promise<void>>());

  const patch = (key: string, p: TabState) => setTabs(t => ({ ...t, [key]: { ...t[key], ...p } }));

  // A tab already being fetched (e.g. a lazy tab when Reload is hit) shares that fetch instead of starting a second one.
  const loadOne = useCallback((src: Source, force?: boolean) => {
    const running = inFlight.current.get(src.key);
    if (running) return running;
    patch(src.key, { pending: true });
    const p = loadSheet(src, { force, onStale: sheet => patch(src.key, { sheet }), onRetry: (a, n) => setRetry(`Đang thử lại ${src.name} (${a}/${n})…`) })
      .then(sheet => patch(src.key, { sheet, error: undefined, pending: false }))
      .catch(e => patch(src.key, { error: loadError(e), pending: false })) // keep the previous data, if any: stale beats nothing
      .finally(() => { inFlight.current.delete(src.key); setRetry(null); });
    inFlight.current.set(src.key, p);
    return p;
  }, []);

  const reload = useCallback(async (force?: boolean) => {
    const list = SOURCES.filter(s => !s.lazy || wanted.current.has(s.key));
    let loaded = 0;
    setLoading(true);
    setProgress({ loaded, total: list.length });
    loadImages(force, setImages).then(setImages).catch(() => {}); // images are a nice-to-have: without them the lookup still works
    await Promise.all(list.map(src => loadOne(src, force).then(() => {
      setProgress({ loaded: ++loaded, total: list.length });
    })));
    setLoading(false);
  }, [loadOne]);

  /** Fetch a lazy tab the first time a query needs it; it then stays in the reload cycle. */
  const want = useCallback((src: Source) => {
    if (wanted.current.has(src.key)) return;
    wanted.current.add(src.key);
    loadOne(src);
  }, [loadOne]);

  useEffect(() => {
    reload();
    pruneCache([...SOURCES, IMG_SRC]);
  }, [reload]);

  return { tabs, images, loading, progress, retry, reload, want };
}
