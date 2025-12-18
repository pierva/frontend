import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

export default function TrendLineChart({
  title = '',
  points = [],                    // [{ x: 'YYYY-MM-DD' or 'YYYY-MM-01', y: n }]
  height = 320,
  label = 'Series',
  color = '#1b2638',
  fill = false,
  yAxisTitle = 'Count',
  emptyText = 'No data.',
  granularity = 'day',            // 'day' | 'month'
  tooltipFormat,                  // optional override
  displayFormats                   // optional override
}) {
  const data = useMemo(() => ({
    labels: points.map(p => p.x),
    datasets: [
      {
        label,
        data: points.map(p => p.y),
        tension: 0.25,
        borderColor: color,
        backgroundColor: fill ? color : undefined,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: color
      }
    ]
  }), [points, label, color, fill]);

  const options = useMemo(() => {
    const unit = granularity === 'month' ? 'month' : 'day';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit,
            tooltipFormat: tooltipFormat || (unit === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd'),
            displayFormats: displayFormats || (unit === 'month'
              ? { month: 'yyyy-MM' }
              : { day: 'yyyy-MM-dd' })
          }
        },
        y: { beginAtZero: true, title: { display: true, text: yAxisTitle } }
      }
    };
  }, [granularity, yAxisTitle, tooltipFormat, displayFormats]);

  return (
    <div>
      {title ? <div className="mb-2" style={{ fontWeight: 600 }}>{title}</div> : null}
      <div style={{ height }}>
        {points?.length ? <Line data={data} options={options} /> : <div className="text-muted">{emptyText}</div>}
      </div>
    </div>
  );
}
