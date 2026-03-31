'use client';

import { useMemo } from 'react';
import { AudioLines, Link2, Repeat2, ShieldAlert, TriangleAlert, Users } from 'lucide-react';
import { classNames } from '@quality/lib/utils';
import { ChartComponent } from '@quality/components/ui/Chart';
import { ProcessedReport } from '@quality/types/report';
import styles from './ResumenSection.module.css';

interface ResumenSectionProps {
  data: ProcessedReport;
}

const EXECUTIVE_TONES = [
  'rgba(15, 23, 42, 0.92)',
  'rgba(15, 23, 42, 0.82)',
  'rgba(15, 23, 42, 0.7)',
  'rgba(227, 91, 91, 0.92)',
  'rgba(243, 167, 167, 0.9)',
  'rgba(15, 23, 42, 0.56)',
];

export function ResumenSection({ data }: ResumenSectionProps) {
  const supervisorChart = useMemo(() => ({
    type: 'bar' as const,
    data: {
      labels: data.supervisores.map((item) => item.supervisor),
      datasets: [
        {
          label: 'Reinc. Criticos',
          data: data.supervisores.map((item) => item.reincidentes),
          backgroundColor: data.supervisores.map((_, index) => EXECUTIVE_TONES[index % EXECUTIVE_TONES.length]),
          borderRadius: 6,
        },
        {
          label: 'Con Antifraude',
          data: data.supervisores.map((item) => item.conAntifraude),
          backgroundColor: 'rgba(227, 91, 91, 0.78)',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' as const } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 28 } },
        y: { grid: { display: false }, ticks: { display: false }, border: { display: false } },
      },
    },
  }), [data.supervisores]);

  const paretoMini = useMemo(() => {
    const topFive = data.paretoSoul.slice(0, 5);
    return {
      type: 'bar' as const,
      data: {
        labels: topFive.map((item) => item.causal.length > 32 ? `${item.causal.slice(0, 32)}...` : item.causal),
        datasets: [{ label: 'Asesores reincidentes', data: topFive.map((item) => item.asesores), backgroundColor: EXECUTIVE_TONES.slice(0, 5), borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { display: false }, border: { display: false } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    };
  }, [data.paretoSoul]);

  const afDoughnut = useMemo(() => ({
    type: 'doughnut' as const,
    data: {
      labels: data.paretoAf.map((item) => item.tipo),
      datasets: [{ data: data.paretoAf.map((item) => item.asesores), backgroundColor: ['rgba(15, 23, 42, 0.9)', 'rgba(227, 91, 91, 0.9)', 'rgba(15, 23, 42, 0.72)', 'rgba(243, 167, 167, 0.95)', 'rgba(15, 23, 42, 0.52)'], borderColor: '#fff', borderWidth: 2 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' as const },
      },
    },
  }), [data.paretoAf]);

  const speechRisk = useMemo(() => ({
    type: 'bar' as const,
    data: {
      labels: ['Ag. enojado', 'Ag. negativo', 'Fin neg. cliente'],
      datasets: [
        { label: 'Reincidentes SOUL', data: [data.speechStats.reincidentesSoul.enojado, data.speechStats.reincidentesSoul.negativo, data.speechStats.reincidentesSoul.fin], backgroundColor: 'rgba(15, 23, 42, 0.88)', borderRadius: 6 },
        { label: 'No Reincidentes', data: [data.speechStats.noReincidentesSoul.enojado, data.speechStats.noReincidentesSoul.negativo, data.speechStats.noReincidentesSoul.fin], backgroundColor: 'rgba(15, 23, 42, 0.36)', borderRadius: 6 },
        { label: 'Con AF', data: [data.speechStats.conAf.enojado, data.speechStats.conAf.negativo, data.speechStats.conAf.fin], backgroundColor: 'rgba(227, 91, 91, 0.84)', borderRadius: 6 },
        { label: 'Sin AF', data: [data.speechStats.sinAf.enojado, data.speechStats.sinAf.negativo, data.speechStats.sinAf.fin], backgroundColor: 'rgba(243, 167, 167, 0.55)', borderRadius: 6 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' as const } },
      scales: { x: { grid: { display: false } }, y: { grid: { display: false }, ticks: { callback: (value: string | number) => `${value}%` }, border: { display: false } } },
    },
  }), [data.speechStats]);

  const topCausales = data.soulAdvisors.slice(0, 10);
  const maxCausales = topCausales.length ? topCausales[0].numCausales : 1;

  return (
    <div id="sec-resumen" className={styles.section}>
      <div className={styles.title}>
        Resumen Ejecutivo
        {data.kpis.hasSpeech ? <span className={styles.speechBadge}><AudioLines className={styles.inlineIcon} aria-hidden="true" /> Speech Analytics activo</span> : null}
      </div>

      <div className={styles.kpiGrid}>
        <div className={classNames(styles.kpiCard, styles.kpiGray)}><span className={styles.kpiIcon}><Users className={styles.kpiIconSvg} aria-hidden="true" /></span><div className={styles.kpiValue}>{data.kpis.totalAsesores}</div><div className={styles.kpiLabel}>Asesores Evaluados</div><div className={styles.kpiSub}>{data.kpis.totalMonitoreos.toLocaleString('es-CO')} mon. unicos</div></div>
        <div className={classNames(styles.kpiCard, styles.kpiBlueLight)}><span className={styles.kpiIcon}><TriangleAlert className={styles.kpiIconSvg} aria-hidden="true" /></span><div className={styles.kpiValue}>{data.kpis.asesoresConCriticos}</div><div className={styles.kpiLabel}>Con error critico</div><div className={styles.kpiSub}>{Math.round((data.kpis.asesoresConCriticos / Math.max(data.kpis.totalAsesores, 1)) * 100)}% del total</div></div>
        <div className={classNames(styles.kpiCard, styles.kpiBlue)}><span className={styles.kpiIcon}><Repeat2 className={styles.kpiIconSvg} aria-hidden="true" /></span><div className={styles.kpiValue}>{data.kpis.reincidentesCriticos}</div><div className={styles.kpiLabel}>Reincidentes Criticos</div><div className={styles.kpiSub}>{Math.round((data.kpis.reincidentesCriticos / Math.max(data.kpis.asesoresConCriticos, 1)) * 100)}% con err. criticos</div></div>
        <div className={classNames(styles.kpiCard, styles.kpiWarn)}><span className={styles.kpiIcon}><ShieldAlert className={styles.kpiIconSvg} aria-hidden="true" /></span><div className={styles.kpiValue}>{data.kpis.totalAf}</div><div className={styles.kpiLabel}>En Celula Antifraude</div><div className={styles.kpiSub}>{data.kpis.reincidentesAf} reincidentes AF</div></div>
        <div className={classNames(styles.kpiCard, styles.kpiBlue)}><span className={styles.kpiIcon}><Link2 className={styles.kpiIconSvg} aria-hidden="true" /></span><div className={styles.kpiValue}>{data.kpis.coincidencias}</div><div className={styles.kpiLabel}>Coincidencias SOUL+AF</div><div className={styles.kpiSub}>{data.kpis.coincidencias} riesgo mas alto</div></div>
        {data.kpis.hasSpeech ? <div className={classNames(styles.kpiCard, styles.kpiSpeech)}><span className={styles.kpiIcon}><AudioLines className={styles.kpiIconSvg} aria-hidden="true" /></span><div className={styles.kpiValue}>{data.kpis.spTotal}</div><div className={styles.kpiLabel}>Con Speech Analytics</div><div className={styles.kpiSub}>{data.kpis.spConDatos} reincidentes con datos</div></div> : null}
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.card}>
          <div className={styles.cardHead}><h2>Top causales criticas reincidentes</h2><span className={classNames(styles.scopeTag, styles.scopeBlue)}>Solo SOUL critico</span></div>
          <div className={styles.cardBody}>
            {topCausales.map((item, index) => (
              <div className={styles.rankRow} key={item.cedula}>
                <div className={classNames(styles.rankNum, index === 0 && styles.rankGold, index === 1 && styles.rankSilver, index === 2 && styles.rankBronze)}>{index + 1}</div>
                <div>
                  <div className={styles.rankName}>{item.nombre}</div>
                  <div className={styles.rankSub}>{item.supervisor}</div>
                </div>
                <div className={styles.rankBarOuter}><div className={styles.rankBarFill} style={{ width: `${Math.round((item.numCausales / maxCausales) * 100)}%` }} /></div>
                <div className={styles.rankVal}>{item.numCausales}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}><h2>Reincidentes por supervisor</h2></div>
          <div className={styles.cardBody}><div className={styles.chart260}><ChartComponent {...supervisorChart} /></div></div>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <div className={styles.card}>
          <div className={styles.cardHead}><h2>Pareto rapido - Top 5 causales</h2><span className={classNames(styles.scopeTag, styles.scopeBlue)}>Solo SOUL critico</span></div>
          <div className={styles.cardBody}><div className={styles.chart250}><ChartComponent {...paretoMini} /></div></div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}><h2>Antifraude por tipo</h2><span className={classNames(styles.scopeTag, styles.scopeWarn)}>Todos los registros</span></div>
          <div className={styles.cardBody}><div className={styles.chart250}><ChartComponent {...afDoughnut} /></div></div>
        </div>
      </div>

      {data.kpis.hasSpeech ? (
        <div className={styles.card}>
          <div className={styles.cardHead}><h2>Speech Analytics - Comparativo por grupo de riesgo</h2><span className={classNames(styles.scopeTag, styles.scopeSpeech)}>Promedio por grupo</span></div>
          <div className={styles.cardBody}><div className={styles.chart280}><ChartComponent {...speechRisk} /></div></div>
        </div>
      ) : null}
    </div>
  );
}
