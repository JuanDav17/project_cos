'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AudioLines, RotateCcw, ShieldAlert, TriangleAlert, X } from 'lucide-react';
import { FilterState, ProcessedReport, SectionId } from '@quality/types/report';
import { FILTER_LABELS, FILTER_OPTIONS, classNames, escapeId } from '@quality/lib/utils';
import { MultiSelectDropdown } from '@quality/components/ui/MultiSelectDropdown';
import logoCos from '@/frontend/img/logo_cos - copia.png';
import styles from './ReportScreen.module.css';
import { ResumenSection } from './sections/ResumenSection';
import { SoulSection } from './sections/SoulSection';
import { ParetoSection } from './sections/ParetoSection';
import { AntifraudeSection } from './sections/AntifraudeSection';
import { SupervisoresSection } from './sections/SupervisoresSection';
import { AnalisisSection } from './sections/AnalisisSection';

const TABS: Array<{ id: SectionId; label: string }> = [
  { id: 'resumen', label: 'Resumen Ejecutivo' },
  { id: 'soul', label: 'Reincidencia Critica' },
  { id: 'pareto', label: 'Pareto' },
  { id: 'antifraude', label: 'Celula Antifraude' },
  { id: 'supervisores', label: 'Por Supervisor' },
  { id: 'analisis', label: 'Analisis Gerencial' },
];

const PAGE_SIZE = 10;

interface ReportScreenProps {
  data: ProcessedReport;
}

function buildFilterLabel(label: string, count: number) {
  return count > 0 ? `${label} <span class='ms-badge'>${count}</span>` : label;
}

export function ReportScreen({ data }: ReportScreenProps) {
  const [activeTab, setActiveTab] = useState<SectionId>('resumen');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    sup: new Set<string>(),
    mes: new Set<string>(),
    fue: new Set<string>(),
    ant: new Set<string>(),
    query: '',
  });

  const filteredSoul = useMemo(() => {
    return data.soulAdvisors.filter((advisor) => {
      if (filters.sup.size > 0 && !filters.sup.has(advisor.supervisor)) return false;
      if (filters.mes.size > 0 && !advisor.meses.some((month) => filters.mes.has(month))) return false;
      if (filters.fue.size > 0) {
        const inAf = advisor.totalRegAf > 0;
        const match = (filters.fue.has('Solo SOUL critico') && !inAf)
          || (filters.fue.has('Con Antifraude') && inAf)
          || (filters.fue.has('Coincidencia ambas') && advisor.coincidencia);
        if (!match) return false;
      }
      if (filters.ant.size > 0 && !filters.ant.has(advisor.antCat)) return false;
      const query = filters.query.trim().toLowerCase();
      if (query && !advisor.nombre.toLowerCase().includes(query) && !advisor.cedula.includes(query)) return false;
      return true;
    });
  }, [data.soulAdvisors, filters]);

  const renderedTags = useMemo(() => {
    const tags: Array<{ key: keyof Omit<FilterState, 'query'> | 'query'; value: string }> = [];
    (['sup', 'mes', 'fue', 'ant'] as const).forEach((key) => {
      filters[key].forEach((value) => tags.push({ key, value }));
    });
    if (filters.query) tags.push({ key: 'query', value: filters.query });
    return tags;
  }, [filters]);

  const updateFilterSet = (key: 'sup' | 'mes' | 'fue' | 'ant', next: Set<string>) => {
    setFilters((current) => ({ ...current, [key]: next }));
    setPage(1);
  };

  const currentDate = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div id="report-screen" className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerBrand}>
            <div className={styles.logo}>
              <Image src={logoCos} alt="GroupCOS" className={styles.logoImage} priority />
            </div>
            <div className={styles.titleWrap}>
              <div className={styles.eyebrow}>GroupCOS · Reportes Internos</div>
              <h1 className={styles.title}>
                <span className={styles.titleMain}>Reporte de Reincidencia</span>
                <span className={styles.titleAccent}>y Riesgo Operativo</span>
              </h1>
              <p>BBDD SOUL - Celula Antifraude - Speech Analytics - GroupCOS - ETB Retencion - <span>{data.kpis.mesesLabel}</span></p>
              <div className={styles.pillRow}>
                <span className={classNames(styles.pill, styles.pillWarn)}><TriangleAlert className={styles.icon} aria-hidden="true" /> SOUL critico</span>
                <span className={styles.pill}><ShieldAlert className={styles.icon} aria-hidden="true" /> Antifraude</span>
                {data.kpis.hasSpeech ? <span className={classNames(styles.pill, styles.pillSpeech)}><AudioLines className={styles.icon} aria-hidden="true" /> Speech Analytics</span> : null}
              </div>
            </div>
          </div>
          <div className={styles.headerMeta}>
            <strong>{currentDate} - GroupCOS</strong>
            <span>{data.kpis.totalMonitoreos.toLocaleString('es-CO')} monitoreos - {data.kpis.totalAsesores} asesores</span>
          </div>
        </div>
      </div>

      <div className={styles.nav}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={classNames(styles.tab, activeTab === tab.id && styles.tabActive)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>Filtros</span>
        <MultiSelectDropdown id="sup" label={buildFilterLabel('Supervisor', filters.sup.size)} values={data.supervisoresList} selected={filters.sup} onChange={(next) => updateFilterSet('sup', next)} />
        <MultiSelectDropdown id="mes" label={buildFilterLabel('Mes', filters.mes.size)} values={data.meses} selected={filters.mes} onChange={(next) => updateFilterSet('mes', next)} />
        <MultiSelectDropdown id="fue" label={buildFilterLabel('Fuente', filters.fue.size)} values={[...FILTER_OPTIONS.fue]} selected={filters.fue} searchable={false} onChange={(next) => updateFilterSet('fue', next)} />
        <MultiSelectDropdown id="ant" label={buildFilterLabel('Antiguedad', filters.ant.size)} values={[...FILTER_OPTIONS.ant]} selected={filters.ant} searchable={false} onChange={(next) => updateFilterSet('ant', next)} />
        <input
          className={styles.search}
          placeholder="Nombre o cedula"
          value={filters.query}
          onChange={(event) => {
            setFilters((current) => ({ ...current, query: event.target.value }));
            setPage(1);
          }}
        />
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => {
            setFilters({ sup: new Set(), mes: new Set(), fue: new Set(), ant: new Set(), query: '' });
            setPage(1);
          }}
        >
          <RotateCcw className={styles.buttonIcon} aria-hidden="true" /> Limpiar todo
        </button>
      </div>

      <div className={styles.activeFilters}>
        {renderedTags.map((tag) => (
          <span key={`${tag.key}-${escapeId(tag.value)}`} className={styles.filterTag}>
            {tag.key === 'query' ? 'Busqueda' : FILTER_LABELS[tag.key]}: <strong>{tag.value}</strong>
            <button
              type="button"
              className={styles.filterTagRemove}
              onClick={() => {
                if (tag.key === 'query') {
                  setFilters((current) => ({ ...current, query: '' }));
                  return;
                }
                setFilters((current) => {
                  const next = new Set(current[tag.key]);
                  next.delete(tag.value);
                  return { ...current, [tag.key]: next };
                });
              }}
            >
              <X className={styles.buttonIcon} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>

      <div className={styles.main}>
        {activeTab === 'resumen' ? <ResumenSection data={data} /> : null}
        {activeTab === 'soul' ? <SoulSection advisors={filteredSoul} total={filteredSoul.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} hasSpeech={data.kpis.hasSpeech} /> : null}
        {activeTab === 'pareto' ? <ParetoSection data={data} /> : null}
        {activeTab === 'antifraude' ? <AntifraudeSection data={data} /> : null}
        {activeTab === 'supervisores' ? <SupervisoresSection data={data} /> : null}
        {activeTab === 'analisis' ? <AnalisisSection data={data} /> : null}
      </div>

      <div className={styles.footer}><strong>GroupCOS</strong> - Area de Calidad y Antifraude - Reporte confidencial - Uso interno</div>
    </div>
  );
}

