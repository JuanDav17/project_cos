'use client';

import { useMemo } from 'react';
import { SoulAdvisor } from '@quality/types/report';
import { CausalCell, SpeechCell } from '../parts';

interface SoulSectionProps {
  advisors: SoulAdvisor[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  hasSpeech: boolean;
}

export function SoulSection({ advisors, total, page, pageSize, onPageChange, hasSpeech }: SoulSectionProps) {
  const start = (page - 1) * pageSize;
  const rows = advisors.slice(start, start + pageSize);
  const totalPages = Math.ceil(Math.max(advisors.length, 1) / pageSize);

  const pagination = useMemo(() => {
    if (totalPages <= 1) return [] as number[];
    const from = Math.max(1, page - 2);
    const to = Math.min(totalPages, page + 2);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [page, totalPages]);

  return (
    <div id="sec-soul" className="sec on">
      <div className="stitle">Reincidencia en errores críticos · BBDD SOUL</div>
      <div className="alt alt-b"><span className="alt-icon"><i className="bi bi-info-circle" aria-hidden="true" /></span><div>Reincidente = mismo atributo crítico en ≥2 monitoreos con ID distintos. {hasSpeech ? 'La columna Speech Analytics muestra % promedio de agente enojado, sentimiento negativo y fin de llamada negativa del cliente.' : ''}</div></div>
      <div className="card">
        <div className="card-head"><h2>Detalle de asesores reincidentes</h2><span style={{ fontSize: 12, color: 'var(--t3)' }}>{total} asesores</span></div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Cédula</th><th>Nombre</th><th>Supervisor</th><th>Mes(es)</th><th>Antigüedad</th><th>Mon. Total</th><th>Mon. c/Crítico</th><th style={{ minWidth: 300 }}>Causales Críticas Reincidentes</th><th>N.° causales</th><th>Mala Práctica AF</th><th>Reg. AF</th><th>Coincidencia</th>{hasSpeech ? <th className="sp-th" style={{ minWidth: 170 }}>Speech Analytics</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((advisor, index) => {
                const highlighted = advisor.numCausales >= 3 || (advisor.coincidencia && advisor.totalRegAf >= 3);
                const countClass = advisor.numCausales >= 3 ? 'bb' : advisor.numCausales >= 2 ? 'bw' : 'bi';
                return (
                  <tr key={advisor.cedula} className={highlighted ? 'row-hl' : ''}>
                    <td><strong>{start + index + 1}</strong></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{advisor.cedula}</td>
                    <td><strong style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{advisor.nombre}</strong></td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{advisor.supervisor}</td>
                    <td>{advisor.meses.map((month) => <span className="tag-mes" key={`${advisor.cedula}-${month}`}>{month}</span>)}</td>
                    <td><span className="b bi">{advisor.antCat}</span><div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{advisor.antMonths}m</div></td>
                    <td style={{ textAlign: 'center' }}>{advisor.totalMon}</td>
                    <td style={{ textAlign: 'center' }}>{advisor.monCriticos}</td>
                    <td><CausalCell causales={advisor.causales} /></td>
                    <td style={{ textAlign: 'center' }}><span className={`b ${countClass}`}>{advisor.numCausales}</span></td>
                    <td>{advisor.malasPracticas ? <span className="b bw">{advisor.malasPracticas}</span> : <span className="b bs">Sin alertas</span>}</td>
                    <td style={{ textAlign: 'center' }}>{advisor.totalRegAf > 0 ? <strong style={{ color: 'var(--b2)' }}>{advisor.totalRegAf}</strong> : '—'}</td>
                    <td>{advisor.coincidencia ? <span className="b bd">Sí</span> : <span className="b bgr">No</span>}</td>
                    {hasSpeech ? <td><SpeechCell speech={advisor.speech} /></td> : null}
                  </tr>
                );
              }) : (
                <tr><td colSpan={hasSpeech ? 14 : 13}><div className="no-res"><span className="no-res-icon"><i className="bi bi-search" aria-hidden="true" /></span>Sin resultados con los filtros aplicados</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="pag">
            <span className="pg-info">Pág {page}/{totalPages}</span>
            {pagination.map((pageNumber) => <button key={pageNumber} type="button" className={`pg-btn ${pageNumber === page ? 'on' : ''}`} onClick={() => onPageChange(pageNumber)}>{pageNumber}</button>)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
