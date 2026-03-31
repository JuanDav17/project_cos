'use client';

import React, { useEffect, useRef } from 'react';
import Chart, { ChartConfiguration, Plugin } from 'chart.js/auto';

interface ChartProps {
  type: ChartConfiguration['type'];
  data: ChartConfiguration['data'];
  options?: ChartConfiguration['options'];
  plugins?: Plugin[];
}

export const ChartComponent: React.FC<ChartProps> = ({ type, data, options, plugins = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

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
};
