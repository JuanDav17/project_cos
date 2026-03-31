import { Plugin } from 'chart.js';

const primary = '#0f172a';
const accent = 'rgba(227, 91, 91, 0.8)';

function getCanvasFont(chart: { canvas: HTMLCanvasElement }, size: number, weight = 700) {
  const fontFamily = typeof window !== 'undefined'
    ? getComputedStyle(chart.canvas).fontFamily || 'sans-serif'
    : 'sans-serif';
  return `${weight} ${size}px ${fontFamily}`;
}

export const labelPluginHorizontal: Plugin = {
  id: 'labelPluginHorizontal',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        if (value === null || value === undefined) return;
        ctx.save();
        ctx.fillStyle = primary;
        ctx.font = getCanvasFont(chart, 11);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(value), bar.x + 6, bar.y);
        ctx.restore();
      });
    });
  },
};

export const labelPluginVertical: Plugin = {
  id: 'labelPluginVertical',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        if (value === null || value === undefined) return;
        ctx.save();
        ctx.fillStyle = primary;
        ctx.font = getCanvasFont(chart, 11);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(value), bar.x, bar.y - 4);
        ctx.restore();
      });
    });
  },
};

export const labelPluginPercentage: Plugin = {
  id: 'labelPluginPercentage',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        if (value === null || value === undefined) return;
        ctx.save();
        ctx.fillStyle = primary;
        ctx.font = getCanvasFont(chart, 11);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${value}%`, bar.x, bar.y - 4);
        ctx.restore();
      });
    });
  },
};

export function paretoLinePlugin(id = 'paretoLinePlugin'): Plugin {
  return {
    id,
    afterDraw(chart) {
      const yScale = chart.scales.yLine;
      if (!yScale) return;
      const y = yScale.getPixelForValue(80);
      const { left, right } = chart.chartArea;
      const { ctx } = chart;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.8;
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e35b5b';
      ctx.font = getCanvasFont(chart, 10);
      ctx.textAlign = 'right';
      ctx.fillText('80%', right - 4, y - 5);
      ctx.restore();
    },
  };
}
