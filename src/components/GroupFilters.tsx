'use client';

import { GROUPS, type Group } from '@/lib/config';

export type GroupFilter = Group | 'all';

interface Props {
  value: GroupFilter;
  counts: Record<GroupFilter, number> | null; // null: no search yet, hide the counts
  onChange: (g: GroupFilter) => void;
}

export default function GroupFilters({ value, counts, onChange }: Props) {
  return (
    <div className="filters" role="group" aria-label="Lọc theo khách hàng">
      {GROUPS.map(([g, label]) => (
        <button key={g} type="button" aria-pressed={g === value} onClick={() => onChange(g)}>
          {label}{counts && <b>{counts[g]}</b>}
        </button>
      ))}
    </div>
  );
}
