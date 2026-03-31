'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCheck, ChevronDown, X } from 'lucide-react';
import { classNames } from '@reincidentes/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Todos',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  const allValues = useMemo(() => options.map((option) => option.value), [options]);
  const isAllSelected = selected.length === options.length;
  const isPartial = selected.length > 0 && selected.length < options.length;

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  };

  const toggleAll = () => {
    if (isAllSelected) {
      onChange([]);
      return;
    }
    onChange(allValues);
  };

  const buttonLabel =
    selected.length === 0 || isAllSelected
      ? placeholder
      : `${selected.length} seleccionado${selected.length > 1 ? 's' : ''}`;

  return (
    <div className="rri-multiselect" ref={containerRef}>
      <label className="rri-filter-label">{label}</label>
      <div className="rri-multiselect-shell">
        <button
          type="button"
          className={classNames(
            'rri-multiselect-trigger',
            isOpen && 'rri-multiselect-trigger-open',
          )}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span>{buttonLabel}</span>
          <ChevronDown
            className={classNames(
              'rri-multiselect-trigger-caret',
              isOpen && 'rri-multiselect-trigger-caret-open',
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <div className="rri-multiselect-menu">
            <div className="rri-multiselect-search">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
                className="rri-multiselect-search-input"
              />
            </div>
            <div className="rri-multiselect-options">
              <label className="rri-multiselect-option rri-multiselect-option-all">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(element) => {
                    if (element) element.indeterminate = isPartial;
                  }}
                  onChange={toggleAll}
                />
                <span className="rri-multiselect-optionText">
                  <CheckCheck className="rri-inline-icon" aria-hidden="true" />
                  Todos
                </span>
              </label>
              {filteredOptions.map((option) => (
                <label key={option.value} className="rri-multiselect-option">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rri-multiselect-tags">
        {selected.length === 0 || isAllSelected ? (
          <span className="rri-multiselect-tag rri-multiselect-tag-all">Todos</span>
        ) : (
          selected.map((value) => {
            const option = options.find((item) => item.value === value);
            return (
              <span key={value} className="rri-multiselect-tag">
                {option?.label ?? value}
                <button
                  type="button"
                  className="rri-multiselect-tag-remove"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleValue(value);
                  }}
                >
                  <X className="rri-inline-icon" aria-hidden="true" />
                </button>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
};
