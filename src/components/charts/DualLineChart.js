import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

export default function DualLineChart({
  title = '',
  pointsA = [],
  labelA = 'Series A',
  pointsB = [],
  labelB = 'Series B',

  // NEW styling props (optional)
  colorA = '#1b2638',        // PIZZACINI blue
  colorB = '#27ae60',        // green (labor cost)
  fillA = false,
  fillB = false,

  useDualAxis = false,
  axisTitleA = '',
  axisTitleB = '',
  formatBAsCurrency = false,
}) {
  const data = useMemo(() => {
    const xs = Array.from(new Set([
      ...pointsA.map(p => p.x),
      ...pointsB.map(p => p.x),
    ])).sort();

    const mapA = new Map(pointsA.map(p => [p.x, p.y]));
    const mapB = new Map(pointsB.map(p => [p.x, p.y]));

    return {
      labels: xs,
      datasets: [
        {
          label: labelA,
          data: xs.map(x => mapA.get(x) ?? null),
          tension: 0.25,
          borderWidth: 3,
          pointRadius: 3,
          borderColor: colorA,
          backgroundColor: colorA,
          fill: fillA,
          yAxisID: useDualAxis ? 'yA' : 'y',
        },
        {
          label: labelB,
          data: xs.map(x => mapB.get(x) ?? null),
          tension: 0.25,
          borderWidth: 3,
          pointRadius: 3,
          borderColor: colorB,
          backgroundColor: colorB,
          fill: fillB,
          yAxisID: useDualAxis ? 'yB' : 'y',
        }
      ]
    };
  }, [
    pointsA, pointsB, labelA, labelB,
    colorA, colorB, fillA, fillB, useDualAxis
  ]);

  const options = useMemo(() => {
    const base = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
          }
        },
        title: { display: !!title, text: title },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: formatBAsCurrency
            ? {
                label: (ctx) => {
                  const v = ctx.parsed?.y;
                  if (v == null) return `${ctx.dataset.label}: —`;
                  if (ctx.datasetIndex === 1) {
                    return `${ctx.dataset.label}: $${Number(v).toLocaleString()}`;
                  }
                  return `${ctx.dataset.label}: ${Number(v).toLocaleString()}`;
                }
              }
            : undefined
        }
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { type: 'time', time: { unit: 'month', tooltipFormat: 'yyyy-MM' } },
        y: { beginAtZero: true },
      }
    };

    if (!useDualAxis) return base;

    return {
      ...base,
      scales: {
        x: base.scales.x,
        yA: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: axisTitleA ? { display: true, text: axisTitleA } : undefined,
        },
        yB: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          title: axisTitleB ? { display: true, text: axisTitleB } : undefined,
          grid: { drawOnChartArea: false },
        }
      }
    };
  }, [title, useDualAxis, axisTitleA, axisTitleB, formatBAsCurrency]);

  return (
    <div style={{ height: 360 }}>
      {(pointsA.length === 0 && pointsB.length === 0) ? (
        <div className="text-muted">No data for the selected filters.</div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
}
