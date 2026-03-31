import { Plugin } from 'chart.js';

const primary = '#0f172a';

function getCanvasFont(chart: { canvas: HTMLCanvasElement }, size: number, weight = 700) {
  const fontFamily = typeof window !== 'undefined'
    ? getComputedStyle(chart.canvas).fontFamily || 'sans-serif'
    : 'sans-serif';
  return `${weight} ${size}px ${fontFamily}`;
}

export const labelPluginHorizontal: Plugin = {
  id: 'corLabelHoriz',
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
  id: 'corLabelVert',
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
  id: 'corLabelPct',
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
