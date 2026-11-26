'use client';

import { statusOf, splitMatch, type Hit } from '@/lib/search';
import type { Sheet } from '@/lib/sheets';
import { clean, colName, driveThumb, driveView } from '@/lib/text';

interface Props {
  sheet: Sheet;
  hit: Hit;
  q: string;
  image?: string;
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
}

/** One matching row: code, name and status in the summary; every non-empty column when expanded. */
export default function HitRow({ sheet, hit: { row, k, id }, q, image, open, onToggle }: Props) {
  const [tone, label] = statusOf(sheet, row);
  const name = sheet.nameIdx !== undefined ? clean(row[sheet.nameIdx] || '') : '';
  const meta = sheet.metaIdx.filter(i => clean(row[i] || ''));
  const pin = sheet.pinIdx;
  const order = [...pin, ...row.map((_, i) => i).filter(i => !pin.includes(i))];
  const code = clean(row[k]);
  const [before, match, after] = splitMatch(code, q);

  return (
    <details className={`hit ${tone}`} open={open} onToggle={e => { if (e.currentTarget.open !== open) onToggle(id, e.currentTarget.open); }}>{/* equal = React set it (auto-open), not the user */}
      <summary>
        {/* the typed part is already known: show it at full ink, the rest of the code dimmer */}
        <span className="code">
          {before}{match && <mark>{match}</mark>}{after}
          {image && <img className="thumb" src={driveThumb(image, 160)} alt="" loading="lazy" decoding="async" />}
        </span>
        <span className="body">
          {name && <span className="name">{name}</span>}
          <span className="meta">{meta.map(i => <span key={i}>{sheet.headers[i]}: <b>{clean(row[i])}</b></span>)}</span>
        </span>
        <span className="status">{label}</span>
        <span className="chev" aria-hidden="true" />
      </summary>
      {image && (
        <a className="photo" href={driveView(image)} target="_blank" rel="noopener">
          <img src={driveThumb(image, 600)} alt={`Ảnh ${code}`} loading="lazy" decoding="async" />
        </a>
      )}
      <dl>
        {order.map(i => {
          const v = (row[i] || '').trim();
          return v && v !== '-' && (
            <div key={i} className={pin.includes(i) ? 'key' : undefined}>
              <dt>{sheet.headers[i] || 'Cột ' + colName(i)}</dt><dd>{v}</dd>
            </div>
          );
        })}
      </dl>
    </details>
  );
}
