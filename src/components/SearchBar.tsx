'use client';

import type { RefObject } from 'react';

interface Props {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onClear: () => void;
}

export default function SearchBar({ value, inputRef, onChange, onClear }: Props) {
  return (
    <div className="search">
      <input
        ref={inputRef} type="search" inputMode="search" autoComplete="off" autoCapitalize="characters" spellCheck={false}
        placeholder="Mã style, mã vật tư CM# hoặc số phiếu" aria-label="Mã style, mã vật tư CM# hoặc số phiếu Sales Order"
        value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') onClear(); }}
      />
      <button className="clear" type="button" aria-label="Xoá" hidden={!value} onClick={() => { onClear(); inputRef.current?.focus(); }}>×</button>
    </div>
  );
}
