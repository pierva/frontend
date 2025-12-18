import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

export default function DualLineChart({
  title = '',
  pointsA = [],
  labelA = 'Series A',
  pointsB = [],
  labelB = 'Series B',
}) {
  const data = useMemo(() => {
    // Merge x-axis labels by month
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
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: labelB,
          data: xs.map(x => mapB.get(x) ?? null),
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 3,
        }
      ]
    };
  }, [pointsA, pointsB, labelA, labelB]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: !!title, text: title }
    },
    scales: {
      x: { type: 'time', time: { unit: 'month', tooltipFormat: 'yyyy-MM' } },
      y: { beginAtZero: true }
    }
  }), [title]);

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
