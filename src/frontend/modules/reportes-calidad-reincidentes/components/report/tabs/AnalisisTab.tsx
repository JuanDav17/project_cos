'use client';

import React, { useMemo } from 'react';
import { BriefcaseBusiness, CircleGauge, Lightbulb, ShieldCheck } from 'lucide-react';
import { buildTopCausalesByAsesor, getActiveCausales, getActiveReinc, getActiveReincidentes } from '@reincidentes/lib/filterUtils';
import { useReportStore } from '@reincidentes/store/reportStore';

export const AnalisisTab: React.FC = () => {
  const { data, tipoActivo } = useReportStore();

  const analysis = useMemo(() => {
    if (!data) return null;

    const active = getActiveReincidentes(data, tipoActivo);
    const totalEvents = active.reduce((sum, asesor) => sum + getActiveReinc(asesor, tipoActivo), 0);
    const topAdvisor = active[0];
    const topCausal = buildTopCausalesByAsesor(active, tipoActivo, [])[0];

    const perfilCount = {
      nuevo: 0,
      formacion: 0,
      intermedio: 0,
      veterano: 0,
    };

    active.forEach((asesor) => {
      perfilCount[asesor.perfil] += 1;
    });

    const supEvents: Record<string, number> = {};
    active.forEach((asesor) => {
      getActiveCausales(asesor, tipoActivo).forEach((causal) => {
        supEvents[asesor.supervisor] = (supEvents[asesor.supervisor] || 0) + causal.n;
      });
    });

    const topSupervisor = Object.entries(supEvents).sort((a, b) => b[1] - a[1])[0];
    const topSupervisorRaw = topSupervisor ? data.supRaw[topSupervisor[0]] : null;
    const topSupervisorPct = topSupervisorRaw
      ? Math.round(((tipoActivo === 'critico' ? topSupervisorRaw.reincData.length : tipoActivo === 'no_critico' ? topSupervisorRaw.reincDataNC.length : [...new Map([...topSupervisorRaw.reincData, ...topSupervisorRaw.reincDataNC].map((asesor) => [asesor.doc, asesor])).values()].length) / topSupervisorRaw.asesores) * 1000) / 10
      : 0;

    return { totalEvents, topAdvisor, topCausal, perfilCount, topSupervisor, topSupervisorPct };
  }, [data, tipoActivo]);

  if (!data || !analysis) return null;

  const profileLabels = {
    nuevo: 'Nuevo (<3 m)',
    formacion: 'En Formacion (3-6 m)',
    intermedio: 'Intermedio (6-12 m)',
    veterano: 'Veterano (>1 ano)',
  } as const;

  const profileColors = {
    nuevo: '#e35b5b',
    formacion: '#0f172a',
    intermedio: '#64748b',
    veterano: '#c98585',
  } as const;

  return (
    <div>
      <div className="rri-section-heading">
        <h2 className="rri-section-title">
          <BriefcaseBusiness className="rri-section-icon" aria-hidden="true" />
          Analisis Gerencial
        </h2>
        <p className="rri-section-copy">
          {data.reincidentesCrit.length} reincidentes criticos - {data.reincidentesNC.length} reincidentes no criticos - {analysis.totalEvents} eventos totales
        </p>
      </div>

      <div className="rri-analysis-grid">
        <div className="rri-analysis-card">
          <h3 className="rri-analysis-title"><ShieldCheck className="rri-inline-icon" aria-hidden="true" /> Impacto en el Cliente Final</h3>
          <p className="rri-analysis-copy">
            Los <strong>{analysis.totalEvents} eventos de reincidencia</strong> evidencian que las fallas siguen repitiendose en monitoreos distintos. {analysis.topCausal ? (
              <>
                La causal mas frecuente es <strong>{analysis.topCausal.causal}</strong> con {analysis.topCausal.count} eventos.
              </>
            ) : null}
          </p>
          <div className="rri-analysis-highlight">
            {analysis.topAdvisor ? (
              <>
                <strong>{analysis.topAdvisor.nombre}</strong> acumula <strong>{getActiveReinc(analysis.topAdvisor, tipoActivo)}</strong> eventos y representa el caso de mayor riesgo del periodo.
              </>
            ) : (
              'Sin reincidentes identificados con el tipo de error actual.'
            )}
          </div>
          <p className="rri-analysis-copy">
            La repeticion de causales operativas y de cierre impacta directamente tiempos de respuesta, experiencia del usuario y estabilidad del canal digital.
          </p>
        </div>

        <div className="rri-analysis-card">
          <h3 className="rri-analysis-title"><CircleGauge className="rri-inline-icon" aria-hidden="true" /> Impacto para GroupCOS</h3>
          <p className="rri-analysis-copy">
            La reincidencia demuestra que la retroalimentacion posterior al monitoreo no esta generando un cambio conductual consistente, lo que incrementa el riesgo operativo y contractual.
          </p>
          <div className="rri-analysis-highlight">
            {analysis.topSupervisor ? (
              <>
                <strong>{analysis.topSupervisor[0]}</strong> concentra <strong>{analysis.topSupervisor[1]} eventos</strong> y mantiene una tasa de reincidencia del {analysis.topSupervisorPct}% sobre su equipo.
              </>
            ) : (
              'No se identifico un supervisor con concentracion relevante en este corte.'
            )}
          </div>
          <p className="rri-analysis-copy">
            La presencia de casos en multiples perfiles de antiguedad indica una brecha de sostenimiento operativo, no solo de induccion inicial.
          </p>
        </div>
      </div>

      <div className="rri-analysis-card">
        <h3 className="rri-analysis-title"><Lightbulb className="rri-inline-icon" aria-hidden="true" /> Distribucion por Antiguedad y Hallazgos Clave</h3>
        <div className="rri-analysis-profiles">
          {(['nuevo', 'formacion', 'intermedio', 'veterano'] as const).map((key) => (
            <div key={key} className="rri-analysis-profile">
              <div className="rri-analysis-profile-label" style={{ color: profileColors[key] }}>
                {profileLabels[key]}
              </div>
              <div className="rri-analysis-profile-value" style={{ color: profileColors[key] }}>
                {analysis.perfilCount[key]}
              </div>
              <div className="rri-analysis-profile-text">
                {getActiveReincidentes(data, tipoActivo)
                  .filter((asesor) => asesor.perfil === key)
                  .map((asesor) => asesor.nombre.split(' ')[0])
                  .join(', ') || 'Ninguno'}
              </div>
            </div>
          ))}
        </div>

        <ul className="rri-analysis-list">
          <li>
            <strong>Metodologia de monitoreos:</strong> la columna <strong>ID Mios Consecutivo Unico De Auditoria</strong> se toma como unidad real del monitoreo, evitando duplicidades por subitems.
          </li>
          <li>
            <strong>Definicion de reincidencia:</strong> un asesor se considera reincidente cuando la misma causal aparece en dos o mas auditorias distintas del mismo colaborador.
          </li>
          {analysis.topCausal ? (
            <li>
              <strong>Causal principal:</strong> {analysis.topCausal.causal} concentra {analysis.topCausal.count} eventos y requiere revision puntual del proceso de formacion y seguimiento.
            </li>
          ) : null}
          <li>
            <strong>Recomendacion inmediata:</strong> plan de mejora individual, fecha compromiso y seguimiento semanal con revalidacion practica de las causales identificadas.
          </li>
        </ul>
      </div>
    </div>
  );
};
