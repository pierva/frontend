import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import logService, { fetchAllLogsInRange, aggregateLogsByDate } from '../services/logService';

export default function ProductionTrendChart() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState([]); // [{x, y}]

  useEffect(() => {
    (async () => {
      try {
        const prods = await logService.getProducts();
        setProducts(prods || []);
      } catch (e) {
        console.error('Error loading products', e);
      }
    })();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all logs (up to maxPages * 200) and do production-date filtering on frontend
      const logs = await fetchAllLogsInRange(200, '', '', '');
      const aggregated = aggregateLogsByDate(
        logs,
        productId || null,
        startDate,
        endDate
      );
      const points = Object.keys(aggregated)
        .sort()
        .map(d => ({ x: d, y: aggregated[d] }));
      setSeries(points);
    } catch (e) {
      console.error('Error fetching trend data', e);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, startDate, endDate]);

  const chartData = useMemo(() => ({
    labels: series.map(p => p.x),
    datasets: [
      {
        label: productId ? `Daily Production (Product #${productId})` : 'Daily Production (All Products)',
        data: series.map(p => p.y),
        tension: 0.25,
        borderColor: '#007bff',                // BLUE LINE
        backgroundColor: 'rgba(0, 123, 255, 0.25)', // LIGHT BLUE FILL (optional)
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#007bff'
      }
    ]
  }), [series, productId]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { type: 'time', time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' } },
      y: { beginAtZero: true, title: { display: true, text: 'Quantity' } }
    }
  }), []);

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label className="form-label mb-1">Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label mb-1">End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div style={{ minWidth: 260 }} className="flex-grow-1">
            <label className="form-label mb-1">Product (optional)</label>
            <select className="form-select" value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">All products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button className="btn btn-outline-primary" onClick={fetchData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div style={{ height: 360 }} className="mt-3">
          {series.length === 0 && !loading ? (
            <div className="text-muted">No data for the selected filters.</div>
          ) : (
            <Line data={chartData} options={options} />
          )}
        </div>
      </div>
    </div>
  );
}