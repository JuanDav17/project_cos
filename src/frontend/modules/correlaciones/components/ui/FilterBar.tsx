'use client';

import React from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface Option { value: string; label: string }

interface FilterBarProps {
  supervisores: Option[];
  selectedSupervisores: string[];
  onSupervisoresChange: (v: string[]) => void;
  cuartiles: Option[];
  selectedCuartiles: string[];
  onCuartilesChange: (v: string[]) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  countLabel: string;
  countValue: number;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  supervisores, selectedSupervisores, onSupervisoresChange,
  cuartiles, selectedCuartiles, onCuartilesChange,
  searchValue, onSearchChange,
  searchPlaceholder = 'Buscar...',
  countLabel, countValue, onReset,
}) => {
  return (
    <div className="cor-filter-bar">
      <div className="cor-filter-row">
        <MultiSelectDropdown label="Supervisor" options={supervisores} selected={selectedSupervisores} onChange={onSupervisoresChange} />
        <MultiSelectDropdown label="Cuartil" options={cuartiles} selected={selectedCuartiles} onChange={onCuartilesChange} />
        <div className="cor-filter-search">
          <Search className="cor-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="cor-filter-input"
          />
        </div>
        <button type="button" className="cor-filter-reset" onClick={onReset}>
          <RotateCcw className="cor-inline-icon" aria-hidden="true" />
          Limpiar
        </button>
      </div>
      <div className="cor-filter-count">
        <strong>{countValue}</strong> {countLabel}
      </div>
    </div>
  );
};
