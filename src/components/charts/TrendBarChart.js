import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function TrendBarChart({
  title = '',
  labels = [],           // ['Packaging', 'Toppings', ...]
  values = [],           // [10, 5, ...]
  height = 320,
  label = 'By category',
  colors = [],           // optional array per bar
  defaultColor = '#1b2638',
  yAxisTitle = 'Count',
  emptyText = 'No data.'
}) {
  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: colors.length ? colors : labels.map(() => defaultColor),
        borderWidth: 1
      }
    ]
  }), [labels, values, colors, defaultColor, label]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { autoSkip: false } },
      y: { beginAtZero: true, title: { display: true, text: yAxisTitle } }
    }
  }), [yAxisTitle]);

  return (
    <div>
      {title ? <div className="mb-2" style={{ fontWeight: 600 }}>{title}</div> : null}
      <div style={{ height }}>
        {values?.length ? <Bar data={data} options={options} /> : <div className="text-muted">{emptyText}</div>}
      </div>
    </div>
  );
}
