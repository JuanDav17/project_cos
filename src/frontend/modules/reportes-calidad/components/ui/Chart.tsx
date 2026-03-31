'use client';

import { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration, Plugin } from 'chart.js/auto';

interface ChartProps {
  type: ChartConfiguration['type'];
  data: ChartConfiguration['data'];
  options?: ChartConfiguration['options'];
  plugins?: Plugin[];
}

export function ChartComponent({ type, data, options, plugins = [] }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type,
      data,
      options,
      plugins,
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [type, data, options, plugins]);

  return <canvas ref={canvasRef} />;
}
