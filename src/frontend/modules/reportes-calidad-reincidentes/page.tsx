'use client';

import { useEffect, useState } from 'react';
import { ProgressScreen } from '@reincidentes/components/progress/ProgressScreen';
import { ReportScreen } from '@reincidentes/components/report/ReportScreen';
import { useReportStore } from '@reincidentes/store/reportStore';
import { delay } from '@quality/lib/utils';

export default function Home() {
  const [progress, setProgress] = useState(8);
  const [message, setMessage] = useState('Preparando reporte...');
  const { data, setData, reset } = useReportStore();

  useEffect(() => {
    let isActive = true;

    reset();
    const loadReport = async () => {
      setProgress(10);
      setMessage('Consultando SOUL...');

      try {
        await delay(220);

        const response = await fetch('/api/reportes-calidad-reincidentes', { cache: 'no-store' });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || 'No fue posible obtener la informacion del modulo.');
        }

        const nextData = await response.json();

        if (!isActive) return;
        setProgress(65);
        setMessage('Procesando datos...');
        await delay(320);

        if (!isActive) return;

        setData(nextData);
        setProgress(92);
        setMessage('Renderizando dashboard...');
        await delay(260);

        if (!isActive) return;
        setProgress(100);
        setMessage('Listo!');
      } catch (error) {
        if (!isActive) return;

        const messageText = error instanceof Error ? error.message : 'Ocurrio un error inesperado.';
        alert(`Error al procesar la informacion:\n${messageText}`);
        window.location.href = '/';
      }
    };

    void loadReport();

    return () => {
      isActive = false;
    };
  }, [reset, setData]);

  if (!data) return <ProgressScreen progress={progress} message={message} />;
  return <ReportScreen />;
}
