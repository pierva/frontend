import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

export default function MultiLineChart({
  title = '',
  series = [], // [{ key: 'Zone 1', points: [{x,y}] }]
  yAxisTitle = '',
  granularity = 'month',
}) {
  const data = useMemo(() => {
    const xs = Array.from(new Set(
      series.flatMap(s => (s.points || []).map(p => p.x))
    )).sort();

    const palette = ['#1b2638', '#2f80ed', '#f2994a', '#27ae60'];

    return {
      labels: xs,
      datasets: series.map((s, idx) => {
        const map = new Map((s.points || []).map(p => [p.x, p.y]));
        const color = palette[idx % palette.length];

        return {
          label: s.key,
          data: xs.map(x => map.get(x) ?? null),
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 2,
          borderColor: color,
          pointBackgroundColor: color,
        };
      })
    };
  }, [series]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: !!title, text: title },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { type: 'time', time: { unit: granularity, tooltipFormat: granularity === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd' } },
      y: { beginAtZero: true, title: { display: !!yAxisTitle, text: yAxisTitle } }
    }
  }), [title, yAxisTitle, granularity]);

  return (
    <div style={{ height: 360 }}>
      {(!series || series.every(s => (s.points || []).length === 0)) ? (
        <div className="text-muted">No data for the selected filters.</div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
}
