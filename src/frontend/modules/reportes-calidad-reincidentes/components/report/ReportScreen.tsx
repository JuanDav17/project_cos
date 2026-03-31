'use client';

import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeAlert,
  CalendarDays,
  FileSpreadsheet,
  FolderKanban,
  Layers3,
  LayoutDashboard,
  PieChart,
  ShieldAlert,
  UserCog,
  Users,
} from 'lucide-react';
import { useReportStore } from '@reincidentes/store/reportStore';
import { ResumenTab } from './tabs/ResumenTab';
import { AsesoresTab } from './tabs/AsesoresTab';
import { CausalesTab } from './tabs/CausalesTab';
import { SupervisoresTab } from './tabs/SupervisoresTab';
import { AnalisisTab } from './tabs/AnalisisTab';
import { classNames } from '@reincidentes/lib/utils';
import logoCos from '@/frontend/img/logo_cos - copia.png';
import headerStyles from './ReportHeader.module.css';
import contentStyles from './ReportContent.module.css';

const tabs = [
  { id: 'resumen', label: 'Resumen Ejecutivo', icon: LayoutDashboard },
  { id: 'asesores', label: 'Asesores Reincidentes', icon: Users },
  { id: 'causales', label: 'Causales Reincidentes', icon: PieChart },
  { id: 'supervisores', label: 'Por Supervisor', icon: UserCog },
  { id: 'analisis', label: 'Analisis Gerencial', icon: FolderKanban },
] as const;

export const ReportScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('resumen');
  const { data, tipoActivo, setTipoActivo } = useReportStore();

  const counters = useMemo(() => {
    if (!data) return { crit: 0, nc: 0 };
    return {
      crit: data.reincidentesCrit.length,
      nc: data.reincidentesNC.length,
    };
  }, [data]);

  if (!data) return null;

  const now = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const monthsLabel = data.allMeses.map((month) => data.mesLabels[month]).join(', ');

  return (
    <div className={classNames('rri-report-shell', headerStyles.scope, contentStyles.scope)}>
      <header className="rri-report-header">
        <div className="rri-report-header-inner">
          <div className="rri-report-brand">
            <div className="rri-report-logoWrap">
              <Image src={logoCos} alt="GroupCOS" className="rri-report-logo" priority />
            </div>
            <div className="rri-report-titleWrap">
              <div className="rri-report-eyebrow">GroupCOS · Reportes Internos</div>
              <h1 className="rri-report-title">
                <span className="rri-report-title-main">Reporte de Reincidencia</span>
                <span className="rri-report-title-accent">en Errores</span>
              </h1>
              <p className="rri-report-subtitle">
                Matriz de Reincidencia - GroupCOS - {data.meta.campana || data.meta.empresa} - <span>{monthsLabel || now}</span>
              </p>
              <div className="rri-report-pillRow">
                <span className="rri-report-pill">
                  <Layers3 className="rri-inline-icon" aria-hidden="true" />
                  Dashboard ejecutivo
                </span>
                <span className={classNames('rri-report-pill', 'rri-report-pill-soft')}>
                  <ShieldAlert className="rri-inline-icon" aria-hidden="true" />
                  Seguimiento de reincidencia
                </span>
              </div>
            </div>
          </div>
          <div className="rri-report-meta">
            <strong>Customer Operation Success S.A.S.</strong>
            <span className="rri-report-metaRow">
              <CalendarDays className="rri-inline-icon" aria-hidden="true" />
              Fecha de corte: {now}
            </span>
            {data.meta.campana ? (
              <span className="rri-report-metaRow">
                <BadgeAlert className="rri-inline-icon" aria-hidden="true" />
                Campaña: {data.meta.campana}
              </span>
            ) : null}

          </div>
        </div>
      </header>

      <div className="rri-report-systemBar">
        <div className="rri-report-systemInner">
          <nav className="rri-report-nav">
            <div className="rri-report-nav-inner">
              <div className="rri-report-tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={classNames(
                        'rri-report-tab',
                        activeTab === tab.id && 'rri-report-tab-active',
                      )}
                    >
                      <Icon className="rri-tab-icon" aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className="rri-report-typebar">
            <div className="rri-report-typebar-inner">
              <span className="rri-report-type-label">
                <FileSpreadsheet className="rri-inline-icon" aria-hidden="true" />
                Tipo de Error
              </span>
              <button
                type="button"
                onClick={() => setTipoActivo('all')}
                className={classNames(
                  'rri-report-type-button',
                  tipoActivo === 'all' && 'rri-report-type-button-active-muted',
                )}
              >
                Todos los errores
              </button>
              <button
                type="button"
                onClick={() => setTipoActivo('critico')}
                className={classNames(
                  'rri-report-type-button',
                  tipoActivo === 'critico' && 'rri-report-type-button-active-light',
                )}
              >
                <AlertTriangle className="rri-inline-icon" aria-hidden="true" />
                Solo críticos
              </button>
              <button
                type="button"
                onClick={() => setTipoActivo('no_critico')}
                className={classNames(
                  'rri-report-type-button',
                  tipoActivo === 'no_critico' && 'rri-report-type-button-active-accent',
                )}
              >
                <ShieldAlert className="rri-inline-icon" aria-hidden="true" />
                Solo no críticos
              </button>

              <div className="rri-report-counters">
                <span className="rri-report-counter rri-report-counter-crit">
                  <AlertTriangle className="rri-inline-icon" aria-hidden="true" />
                  {counters.crit} reincidentes críticos
                </span>
                <span className="rri-report-counter rri-report-counter-nc">
                  <ShieldAlert className="rri-inline-icon" aria-hidden="true" />
                  {counters.nc} reincidentes no críticos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="rri-report-main">
        {activeTab === 'resumen' ? <ResumenTab /> : null}
        {activeTab === 'asesores' ? <AsesoresTab /> : null}
        {activeTab === 'causales' ? <CausalesTab /> : null}
        {activeTab === 'supervisores' ? <SupervisoresTab /> : null}
        {activeTab === 'analisis' ? <AnalisisTab /> : null}
      </main>

      <footer className="rri-report-footer">
        <strong>GroupCOS - Customer Operation Success S.A.S.</strong> - Reporte de Reincidencia - {data.meta.campana || data.meta.empresa} - Uso interno - Gerencia de Calidad
      </footer>
    </div>
  );
};
