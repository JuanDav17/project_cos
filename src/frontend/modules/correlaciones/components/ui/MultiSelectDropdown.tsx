'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option { value: string; label: string }

interface Props {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export const MultiSelectDropdown: React.FC<Props> = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = useCallback((value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }, [selected, onChange]);

  const allSelected = selected.length === options.length;

  const toggleAll = useCallback(() => {
    if (allSelected) onChange([]);
    else onChange(options.map((o) => o.value));
  }, [allSelected, options, onChange]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="cor-msd" ref={ref}>
      <button type="button" className="cor-msd-trigger" onClick={() => setOpen(!open)}>
        <span>{label}</span>
        {selected.length > 0 && selected.length < options.length ? (
          <span className="cor-msd-badge">{selected.length}</span>
        ) : null}
        <ChevronDown className="cor-inline-icon" aria-hidden="true" />
      </button>
      {open ? (
        <div className="cor-msd-dropdown">
          <label className="cor-msd-option">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = selected.length > 0 && !allSelected; }}
              onChange={toggleAll}
            />
            <span>Todos</span>
          </label>
          {options.map((opt) => (
            <label key={opt.value} className="cor-msd-option">
              <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} />
              <span>{opt.label}</span>
              {selected.includes(opt.value) ? <Check className="cor-inline-icon" aria-hidden="true" /> : null}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
};
