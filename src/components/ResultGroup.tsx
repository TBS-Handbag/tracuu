'use client';

import { PAGE } from '@/lib/config';
import { imageOf, type Link, type SheetHits } from '@/lib/search';
import { sheetUrl } from '@/lib/text';
import HitRow from './HitRow';

interface Props {
  result: SheetHits;
  link?: Link;
  q: string;
  limit: number;
  images: Map<string, string>;
  isOpen: (id: string) => boolean;
  onToggle: (id: string, open: boolean) => void;
  onMore: () => void;
}

/** One sheet = one block; rows inside read like a lookup list. */
export default function ResultGroup({ result: { sheet, hits }, link, q, limit, images, isOpen, onToggle, onMore }: Props) {
  const rest = hits.length - limit;
  const fails = hits.filter(h => h.fail).length;
  return (
    <section className="grp">
      <h2>
        {sheet.src.name}<span className="n">{hits.length} dòng</span>
        {fails > 0 && <span className="n-fail">{fails} {sheet.shortIdx !== undefined ? 'thiếu' : 'reject'}</span>}
        <a href={sheetUrl(sheet.src.id, sheet.gid)} target="_blank" rel="noopener">Mở sheet ↗</a>
      </h2>
      {hits.slice(0, limit).map(h => (
        <HitRow key={h.id} sheet={sheet} link={link} hit={h} q={q} image={imageOf(images, sheet, h.row, h.k)} open={isOpen(h.id)} onToggle={onToggle} />
      ))}
      {rest > 0 && <button type="button" className="more" onClick={onMore}>Xem thêm {Math.min(PAGE, rest)} dòng (còn {rest})</button>}
    </section>
  );
}
