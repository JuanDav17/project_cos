'use client';

import { useEffect, useState } from 'react';
import { ProgressScreen } from '@correlaciones/components/progress/ProgressScreen';
import { ReportScreen } from '@correlaciones/components/report/ReportScreen';
import { useCorrelacionStore } from '@correlaciones/store/correlacionStore';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function CorrelacionesPage() {
  const [progress, setProgress] = useState(8);
  const [message, setMessage] = useState('Preparando correlaciones...');
  const { data, setData, reset } = useCorrelacionStore();

  useEffect(() => {
    let isActive = true;

    reset();
    const loadReport = async () => {
      setProgress(10);
      setMessage('Cargando bases de datos...');

      try {
        await delay(220);

        const response = await fetch('/api/correlaciones', { cache: 'no-store' });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || 'No fue posible obtener la informacion de correlaciones.');
        }

        if (!isActive) return;
        setProgress(45);
        setMessage('Procesando auditorias y efectividad...');
        await delay(280);

        const nextData = await response.json();

        if (!isActive) return;
        setProgress(72);
        setMessage('Calculando correlaciones...');
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
        alert(`Error al procesar correlaciones:\n${messageText}`);
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
