'use client';

import { useMemo, useState } from 'react';
import { classNames, escapeId } from '@quality/lib/utils';

interface MultiSelectDropdownProps {
  id: string;
  label: string;
  values: string[];
  selected: Set<string>;
  searchable?: boolean;
  onChange: (next: Set<string>) => void;
}

export function MultiSelectDropdown({ id, label, values, selected, searchable = true, onChange }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const visibleValues = useMemo(() => {
    if (!searchable || !search.trim()) return values;
    return values.filter((value) => value.toLowerCase().includes(search.toLowerCase()));
  }, [search, searchable, values]);

  const handleToggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  return (
    <div className="ms-wrap">
      <button type="button" className={classNames('ms-btn', open && 'open')} onClick={() => setOpen((current) => !current)}>
        <span dangerouslySetInnerHTML={{ __html: label }} />
        <span className="ms-caret">▼</span>
      </button>
      <div className={classNames('ms-drop', open && 'open')}>
        {searchable ? (
          <div className="ms-srch">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${id}…`} />
          </div>
        ) : null}
        <div className="ms-list">
          {visibleValues.map((value) => {
            const checkboxId = `chk-${id}-${escapeId(value)}`;
            return (
              <div className="ms-item" key={value} data-val={value}>
                <input type="checkbox" id={checkboxId} checked={selected.has(value)} onChange={() => handleToggle(value)} />
                <label htmlFor={checkboxId}>{value}</label>
              </div>
            );
          })}
        </div>
        <div className="ms-foot">
          <button type="button" className="btn-sel-all" onClick={() => onChange(new Set(values))}>Todos</button>
          <button type="button" onClick={() => onChange(new Set())}>Limpiar</button>
        </div>
      </div>
    </div>
  );
}
