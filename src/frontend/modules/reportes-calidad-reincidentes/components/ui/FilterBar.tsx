'use client';

import React from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { PerfilAntiguedad } from '@reincidentes/types';
import { Button } from './Button';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface FilterBarProps {
  meses?: { value: string; label: string }[];
  selectedMeses?: string[];
  onMesesChange?: (values: string[]) => void;
  supervisores?: { value: string; label: string }[];
  selectedSupervisores?: string[];
  onSupervisoresChange?: (values: string[]) => void;
  antiguedades?: { value: PerfilAntiguedad; label: string }[];
  selectedAntiguedades?: PerfilAntiguedad[];
  onAntiguedadesChange?: (values: PerfilAntiguedad[]) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  countLabel: string;
  countValue: number;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  meses,
  selectedMeses,
  onMesesChange,
  supervisores,
  selectedSupervisores,
  onSupervisoresChange,
  antiguedades,
  selectedAntiguedades,
  onAntiguedadesChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  countLabel,
  countValue,
  onReset,
}) => {
  return (
    <div className="rri-filterbar">
      <div className="rri-filterbar-header">
        <span className="rri-filterbar-header-accent" />
        <SlidersHorizontal className="rri-inline-icon" aria-hidden="true" />
        Filtros
      </div>

      <div className="rri-filterbar-controls">
        <div className="rri-filterbar-fields">
          {meses && selectedMeses && onMesesChange ? (
            <MultiSelectDropdown
              label="Mes"
              options={meses}
              selected={selectedMeses}
              onChange={onMesesChange}
              placeholder="Todos los meses"
            />
          ) : null}

          {supervisores && selectedSupervisores && onSupervisoresChange ? (
            <MultiSelectDropdown
              label="Supervisor"
              options={supervisores}
              selected={selectedSupervisores}
              onChange={onSupervisoresChange}
              placeholder="Todos"
            />
          ) : null}

          {antiguedades && selectedAntiguedades && onAntiguedadesChange ? (
            <MultiSelectDropdown
              label="Antiguedad"
              options={antiguedades}
              selected={selectedAntiguedades}
              onChange={(values) => onAntiguedadesChange(values as PerfilAntiguedad[])}
              placeholder="Todas"
            />
          ) : null}
        </div>

        <div className="rri-filterbar-actions">
          {onSearchChange ? (
            <div className="rri-filter-search">
              <label className="rri-filter-label">Buscar</label>
              <div className="rri-filter-searchbox">
                <Search className="rri-search-icon" aria-hidden="true" />
                <input
                  value={searchValue ?? ''}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder ?? 'Buscar...'}
                  className="rri-filter-searchinput"
                />
              </div>
            </div>
          ) : null}

          <Button variant="secondary" onClick={onReset} className="rri-filter-reset">
            <RotateCcw className="rri-inline-icon" aria-hidden="true" />
            Limpiar
          </Button>

          <div className="rri-filter-counter">
            Mostrando <strong>{countValue}</strong> {countLabel}
          </div>
        </div>
      </div>
    </div>
  );
};
