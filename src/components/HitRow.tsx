'use client';

import { Fragment } from 'react';
import { COLS } from '@/lib/config';
import { linkedRows, statusOf, splitMatch, type Hit, type Link } from '@/lib/search';
import type { Sheet } from '@/lib/sheets';
import { clean, colName, driveThumb, driveView } from '@/lib/text';

interface Props {
  sheet: Sheet;
  link?: Link;
  hit: Hit;
  q: string;
  image?: string;
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
}

/** One matching row: code, name and status in the summary; every non-empty column when expanded. */
export default function HitRow({ sheet, link, hit: { row, k, id }, q, image, open, onToggle }: Props) {
  const [tone, label] = statusOf(sheet, row);
  const name = sheet.nameIdx !== undefined ? clean(row[sheet.nameIdx] || '') : '';
  const meta = sheet.metaIdx.filter(i => i !== k && clean(row[i] || '')).slice(0, 2); // the matched column is already shown as the code
  const pin = sheet.pinIdx;
  const order = [...pin, ...row.map((_, i) => i).filter(i => !pin.includes(i))];
  const code = clean(row[k]);
  const [before, match, after] = splitMatch(code, q);
  // A short material shows what is on its way (boss's rule: only when short)
  const { rows: transit, shared } = link && tone === 'fail' ? linkedRows(link, sheet, row) : { rows: [], shared: 0 };
  const tCols = link ? COLS.transit.map(h => link.sheet.headers.indexOf(h)).filter(i => i >= 0) : [];
  const tKey = new Set(link ? COLS.transitKey.map(h => link.sheet.headers.indexOf(h)).filter(i => i >= 0) : []);
  // Date of each in-transit row, labelled with its real column: CH-KS often leaves Delivery Date blank but fills Ngày eta
  const tDate = ['Delivery Date', 'Ngày eta'].map(h => link?.sheet.headers.indexOf(h) ?? -1).filter(i => i >= 0);
  const dates = [...new Set(transit.flatMap(r => {
    const i = tDate.find(i => clean(r[i] || ''));
    return i === undefined ? [] : [`${link!.sheet.headers[i]}\t${clean(r[i])}`];
  }))].map(s => s.split('\t'));

  return (
    <details className={`hit ${tone}`} open={open} onToggle={e => { if (e.currentTarget.open !== open) onToggle(id, e.currentTarget.open); }}>{/* equal = React set it (auto-open), not the user */}
      <summary>
        {/* the typed part is already known: show it at full ink, the rest of the code dimmer */}
        <span className="code">
          {before}{match && <mark>{match}</mark>}{after}
          {image && <img className="thumb" src={driveThumb(image, 400)} alt="" loading="lazy" decoding="async" onError={e => { e.currentTarget.hidden = true; }} />}
        </span>
        <span className="body">
          {name && <span className="name">{name}</span>}
          <span className="meta">
            {meta.map(i => <span key={i}>{sheet.headers[i]}: <b>{clean(row[i])}</b></span>)}
            {dates.map(([h, v]) => <span key={h + v} className="transit-tag">{h}: <b>{v}</b></span>)}
          </span>
        </span>
        <span className="status">{label}</span>
        <span className="chev" aria-hidden="true" />
      </summary>
      <div className={image ? 'detail has-photo' : 'detail'}>
        {image && (
          <a className="photo" href={driveView(image)} target="_blank" rel="noopener">
            <img src={driveThumb(image, 400)} alt={`Ảnh ${code}`} loading="lazy" decoding="async" />
          </a>
        )}
        <div className="fields">
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
          {transit.map((r, j) => (
            <Fragment key={j}>
              <p className="transit">
                {link!.sheet.src.name}{transit.length > 1 ? ` (${j + 1}/${transit.length})` : ''}
                {/* the sheets have nothing finer than SO + CM#, so say these rows are not per shortfall line */}
                {j === 0 && shared > 1 && <span className="shared">Dùng chung cho {shared} dòng cùng Sales Order + CM#, đừng cộng trùng</span>}
              </p>
              <dl>
                {tCols.map(i => {
                  const v = (r[i] || '').trim();
                  return v && v !== '-' && <div key={i} className={tKey.has(i) ? 'key' : undefined}><dt>{link!.sheet.headers[i]}</dt><dd>{v}</dd></div>;
                })}
              </dl>
            </Fragment>
          ))}
        </div>
      </div>
    </details>
  );
}
