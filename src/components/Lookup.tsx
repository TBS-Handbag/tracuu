'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSheets } from '@/hooks/useSheets';
import { GROUPS, PAGE, SOURCES, isCm, isOrderNo } from '@/lib/config';
import { getRecent, saveRecent } from '@/lib/recent';
import { linkIndex, search } from '@/lib/search';
import type { Sheet } from '@/lib/sheets';
import { norm } from '@/lib/text';
import GroupFilters, { type GroupFilter } from './GroupFilters';
import ResultGroup from './ResultGroup';
import SearchBar from './SearchBar';

// ?q= keeps the search in the link, so it can be shared or bookmarked.
const syncUrl = (raw: string) => {
  const url = new URL(location.href), v = raw.trim();
  if (v) url.searchParams.set('q', v); else url.searchParams.delete('q');
  history.replaceState(null, '', url);
};
const time = (t: number) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function Lookup() {
  const { tabs, images, loading, progress, retry, reload, want } = useSheets();
  const [raw, setRaw] = useState('');       // what's in the box
  const [q, setQ] = useState('');           // norm()-ed, debounced: what we search for
  const [group, setGroup] = useState<GroupFilter>('all');
  const [shown, setShown] = useState<Record<string, number>>({}); // sheet key -> rows shown
  const [recent, setRecent] = useState<string[]>([]);
  const [, rerender] = useState(0);
  const opened = useRef(new Map<string, boolean>()); // row id -> open/closed as the user left it
  const inputRef = useRef<HTMLInputElement>(null);

  const latest = useRef({ total: 0, loading: true });
  const recentTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Typing debounces the search; picking a recent code or clearing applies at once.
  const type = (v: string) => {
    setRaw(v); setShown({}); opened.current.clear();
    // Remember codes the user typed that actually found something, once they stop typing.
    clearTimeout(recentTimer.current);
    recentTimer.current = setTimeout(() => {
      if (norm(v).length >= 3 && latest.current.total && !latest.current.loading) saveRecent(v.trim());
    }, 1500);
  };
  const setQuery = useCallback((v: string) => { setRaw(v); setQ(norm(v)); syncUrl(v); setShown({}); opened.current.clear(); }, []);

  useEffect(() => { setQuery(new URL(location.href).searchParams.get('q') || ''); }, [setQuery]);
  useEffect(() => {
    const t = setTimeout(() => { setQ(norm(raw)); syncUrl(raw); }, 150);
    return () => clearTimeout(t);
  }, [raw]);
  useEffect(() => {
    if (!isOrderNo(q) && !isCm(q)) return;
    const lazy = SOURCES.filter(s => s.lazy), own = isOrderNo(q) ? lazy.filter(s => s.so && q.startsWith(s.so)) : [];
    (own.length ? own : lazy).forEach(want); // a prefix no tab claims yet: fetch them all rather than miss rows
  }, [q, want]);
  useEffect(() => { if (q.length < 2) setRecent(getRecent()); }, [q]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) { e.preventDefault(); inputRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const sheets = useMemo(() => SOURCES.flatMap(s => tabs[s.key]?.sheet || []) as Sheet[], [tabs]);
  const results = useMemo(() => q.length >= 2 ? search(sheets, q) : [], [sheets, q]);
  const links = useMemo(() => linkIndex(sheets), [sheets]);
  const total = results.reduce((n, x) => n + x.hits.length, 0);

  latest.current = { total, loading };

  const inGroup = (g: string) => group === 'all' || g === group;
  const visible = results.filter(x => inGroup(x.sheet.src.group));
  const visibleTotal = visible.reduce((n, x) => n + x.hits.length, 0);
  const failed = SOURCES.filter(s => tabs[s.key]?.error && inGroup(s.group));
  const lazyBusy = SOURCES.filter(s => s.lazy && tabs[s.key]?.pending && inGroup(s.group));
  const counts = q.length >= 2
    ? Object.fromEntries(GROUPS.map(([g]) => [g, results.filter(x => g === 'all' || x.sheet.src.group === g).reduce((n, x) => n + x.hits.length, 0)])) as Record<GroupFilter, number>
    : null;

  const sync = retry || (loading
    ? `Đang tải ${progress.loaded}/${progress.total} bảng…`
    : `${sheets.reduce((n, s) => s.src.attach ? n : n + s.rows.length, 0).toLocaleString('vi-VN')} dòng, cập nhật ${time(Math.min(...sheets.map(s => s.at), Date.now()))}`); // oldest tab, so cached data doesn't look fresher than it is

  const isOpen = (id: string) => opened.current.get(id) ?? visibleTotal === 1; // a single hit opens by itself
  const onToggle = (id: string, open: boolean) => { opened.current.set(id, open); rerender(n => n + 1); };

  return (
    <>
      <div className="top"><div className="wrap">
        <div className="brand">
          <h1>Tra mẫu</h1>
          <div className="sync">
            <span aria-live="polite">{sync}</span>
            <button type="button" disabled={loading} onClick={() => reload(true)}>Tải lại</button>{/* manual reload skips the cache */}
          </div>
        </div>
        <SearchBar value={raw} inputRef={inputRef} onChange={type} onClear={() => setQuery('')} />
        <GroupFilters value={group} counts={counts} onChange={setGroup} />
      </div></div>

      <main className="wrap" aria-live="polite">
        {failed.length > 0 && <p className="warn">Không tải được {failed.map(s => s.name).join(', ')}, kết quả có thể thiếu. Bấm Tải lại để thử lại.</p>}
        {q.length < 2 ? (
          <>
            <p className="note">Gõ mã style (vd. CDT65, 28464), mã vật tư CM# (vd. H-VB30373) hoặc số phiếu Sales Order (vd. 3220082980). Gõ một phần mã cũng được.</p>
            {recent.length > 0 && (
              <div className="recent">
                <p>Tra gần đây</p>
                {recent.map(r => <button key={r} type="button" onClick={() => { setQuery(r); inputRef.current?.focus(); }}>{r}</button>)}
              </div>
            )}
          </>
        ) : (
          <>
            {visible.length > 0 && loading && <p className="note">Đang tải {progress.loaded}/{progress.total} bảng, kết quả có thể chưa đủ.</p>}
            {visible.length > 0 && !loading && lazyBusy.length > 0 && <p className="note">Đang tải {lazyBusy.map(s => s.name).join(', ')}, kết quả có thể chưa đủ.</p>}
            {!visible.length && (loading || lazyBusy.length
              ? <p className="note">Đang tải dữ liệu, chờ chút…</p>
              : <p className="note">Không có mã nào chứa “{raw.trim()}”{group !== 'all' ? ' trong nhóm này. Thử chọn Tất cả.' : '. Kiểm tra lại mã, hoặc gõ ngắn hơn.'}</p>)}
            {visible.map(r => (
              <ResultGroup
                key={r.sheet.src.key} result={r} link={links.get(r.sheet.src.key)} q={q} limit={shown[r.sheet.src.key] || PAGE} images={images} isOpen={isOpen} onToggle={onToggle}
                onMore={() => setShown(s => ({ ...s, [r.sheet.src.key]: (s[r.sheet.src.key] || PAGE) + PAGE }))}
              />
            ))}
          </>
        )}
      </main>
    </>
  );
}
