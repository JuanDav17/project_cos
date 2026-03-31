'use client';

import { useEffect, useState } from 'react';
import { ProgressScreen } from '@quality/components/progress/ProgressScreen';
import { ReportScreen } from '@/frontend/modules/reportes-calidad/components/report/ReportScreen';
import { delay } from '@quality/lib/utils';
import { ProcessedReport, ProgressState } from '@quality/types/report';

export default function HomePage() {
  const [progress, setProgress] = useState<ProgressState>({ value: 8, message: 'Preparando reporte...' });
  const [report, setReport] = useState<ProcessedReport | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadReport = async () => {
      try {
        setProgress({ value: 12, message: 'Consultando reportes...' });
        await delay(120);

        if (!isActive) return;
        setProgress({ value: 28, message: 'Consultando antifraude...' });
        await delay(120);

        if (!isActive) return;
        setProgress({ value: 42, message: 'Consultando speech...' });
        await delay(120);

        if (!isActive) return;
        setProgress({ value: 62, message: 'Procesando datos...' });
        const response = await fetch('/api/reportes-calidad', { cache: 'no-store' });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || 'No fue posible obtener la informacion del modulo.');
        }

        const processed = (await response.json()) as ProcessedReport;

        if (!isActive) return;
        setProgress({ value: 92, message: 'Renderizando dashboard...' });
        await delay(180);

        if (!isActive) return;
        setReport(processed);
        setProgress({ value: 100, message: 'Listo!' });
      } catch (error) {
        if (!isActive) return;

        const message = error instanceof Error ? error.message : 'Ocurrio un error inesperado al cargar la informacion.';
        window.alert(`Error cargando la informacion:\n${message}`);
        window.location.href = '/';
      }
    };

    void loadReport();

    return () => {
      isActive = false;
    };
  }, []);

  if (!report) return <ProgressScreen progress={progress.value} message={progress.message} />;
  return <ReportScreen data={report} />;
}
