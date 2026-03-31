'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  GitCompareArrows,
  Layers3,
  LayoutDashboard,
  ScatterChart,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useCorrelacionStore } from '@correlaciones/store/correlacionStore';
import { ResumenTab } from './tabs/ResumenTab';
import { DetalleAsesorTab } from './tabs/DetalleAsesorTab';
import { AnalisisGlobalTab } from './tabs/AnalisisGlobalTab';
import { ReincidentesTab } from './tabs/ReincidentesTab';
import { classNames } from '@correlaciones/lib/utils';
import logoCos from '@/frontend/img/logo_cos - copia.png';
import headerStyles from './ReportHeader.module.css';
import contentStyles from './ReportContent.module.css';

const tabs = [
  { id: 'resumen', label: 'Resumen Ejecutivo', icon: LayoutDashboard },
  { id: 'detalle', label: 'Detalle por Asesor', icon: Users },
  { id: 'analisis', label: 'Analisis Global', icon: ScatterChart },
  { id: 'reincidentes', label: 'Reincidentes', icon: ShieldAlert },
] as const;

export const ReportScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('resumen');
  const { data } = useCorrelacionStore();

  if (!data) return null;

  const now = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className={classNames('cor-report-shell', headerStyles.scope, contentStyles.scope)}>
      <header className="cor-report-header">
        <div className="cor-report-header-inner">
          <div className="cor-report-brand">
            <div className="cor-report-logoWrap">
              <Image src={logoCos} alt="GroupCOS" className="cor-report-logo" priority />
            </div>
            <div className="cor-report-titleWrap">
              <div className="cor-report-eyebrow">GroupCOS · Reportes Internos</div>
              <h1 className="cor-report-title">
                <span className="cor-report-title-main">Correlaciones</span>
                <span className="cor-report-title-accent">ETB Retencion</span>
              </h1>
              <p className="cor-report-subtitle">
                Analisis integral de 5 dimensiones - Campana ETB Retencion Bogota
              </p>
              <div className="cor-report-pillRow">
                <span className="cor-report-pill">
                  <Layers3 className="cor-inline-icon" aria-hidden="true" />
                  Dashboard ejecutivo
                </span>
                <span className={classNames('cor-report-pill', 'cor-report-pill-soft')}>
                  <GitCompareArrows className="cor-inline-icon" aria-hidden="true" />
                  Correlacion multidimensional
                </span>
              </div>
            </div>
          </div>
          <div className="cor-report-meta">
            <strong>Customer Operation Success S.A.S.</strong>
            <span className="cor-report-metaRow">
              <CalendarDays className="cor-inline-icon" aria-hidden="true" />
              Fecha de corte: {now}
            </span>
            <span className="cor-report-metaRow">
              <BarChart3 className="cor-inline-icon" aria-hidden="true" />
              {data.totalAsesores} asesores evaluados
            </span>
          </div>
        </div>
      </header>

      <div className="cor-report-systemBar">
        <div className="cor-report-systemInner">
          <nav className="cor-report-nav">
            <div className="cor-report-nav-inner">
              <div className="cor-report-tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={classNames(
                        'cor-report-tab',
                        activeTab === tab.id && 'cor-report-tab-active',
                      )}
                    >
                      <Icon className="cor-tab-icon" aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>

      <main className="cor-report-main">
        {activeTab === 'resumen' ? <ResumenTab /> : null}
        {activeTab === 'detalle' ? <DetalleAsesorTab /> : null}
        {activeTab === 'analisis' ? <AnalisisGlobalTab /> : null}
        {activeTab === 'reincidentes' ? <ReincidentesTab /> : null}
      </main>

      <footer className="cor-report-footer">
        <strong>GroupCOS - Customer Operation Success S.A.S.</strong> - Correlaciones ETB Retencion - Uso interno - Gerencia de Calidad
      </footer>
    </div>
  );
};
