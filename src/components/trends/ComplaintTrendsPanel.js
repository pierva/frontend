// src/components/trends/ComplaintTrendsPanel.js
import React, { useEffect, useMemo, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

import complaintsService from '../../services/complaintsService';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Tooltip, Legend, TimeScale
);

export default function ComplaintTrendsPanel() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [productId, setProductId] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');

  const [loading, setLoading] = useState(false);

  // Loaded options (can come from API)
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Missing topping', 'Quality', 'Packaging', 'Frozen damage', 'Other']);
  const [severities, setSeverities] = useState([1, 2, 3]);

  // Data payload from API
  // Expected structure:
  // {
  //   kpis: { complaintsPer10k: number, severity3Count: number, capaTriggered: boolean },
  //   timeSeries: [{ date: '2025-12-01', count: 3 }, ...],
  //   byCategory: [{ category: 'Packaging', count: 4 }, ...]
  // }
  const [data, setData] = useState({ kpis: null, timeSeries: [], byCategory: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await complaintsService.getComplaintTrends({
        month,
        productId: productId || null,
        category: category || null,
        severity: severity || null,
      });
      setData(res);
      setProducts(res.products || products); // optional: API can return products list
      if (res.categories) setCategories(res.categories);
    } catch (e) {
      console.error('Error loading complaint trends', e);
      setData({ kpis: null, timeSeries: [], byCategory: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, productId, category, severity]);

  const kpis = data.kpis || { complaintsPer10k: 0, severity3Count: 0, capaTriggered: false };

  const lineData = useMemo(() => ({
    labels: data.timeSeries.map(p => p.date),
    datasets: [
      {
        label: 'Complaints over time',
        data: data.timeSeries.map(p => p.count),
        tension: 0.25,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.15)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#007bff',
      }
    ]
  }), [data.timeSeries]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { type: 'time', time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' } },
      y: { beginAtZero: true, title: { display: true, text: 'Complaints' } }
    }
  }), []);

  const barData = useMemo(() => ({
    labels: data.byCategory.map(c => c.category),
    datasets: [
      {
        label: 'Complaints by category',
        data: data.byCategory.map(c => c.count),
        borderColor: '#1b2638',
        backgroundColor: 'rgba(27, 38, 56, 0.25)',
        borderWidth: 1,
      }
    ]
  }), [data.byCategory]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true } }
  }), []);

  return (
    <div>
      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-3 align-items-end">
            <div>
              <label className="form-label mb-1">Month</label>
              <input
                type="month"
                className="form-control"
                value={month}
                onChange={e => setMonth(e.target.value)}
              />
            </div>

            <div style={{ minWidth: 260 }} className="flex-grow-1">
              <label className="form-label mb-1">Product (optional)</label>
              <select className="form-select" value={productId} onChange={e => setProductId(e.target.value)}>
                <option value="">All products</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div style={{ minWidth: 220 }}>
              <label className="form-label mb-1">Category (optional)</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ minWidth: 180 }}>
              <label className="form-label mb-1">Severity (optional)</label>
              <select className="form-select" value={severity} onChange={e => setSeverity(e.target.value)}>
                <option value="">All severities</option>
                {severities.map(s => <option key={s} value={String(s)}>{s}</option>)}
              </select>
            </div>

            <button className="btn btn-outline-primary" onClick={fetchData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted">Complaints / 10,000 units</div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>
                {Number(kpis.complaintsPer10k || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted">Severity 3 count</div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>
                {kpis.severity3Count || 0}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted">CAPA triggered</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {kpis.capaTriggered ? 'Yes' : 'No'}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Rule-based (we’ll formalize thresholds in your SQF matrix).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Complaints over time</h5>
                <span className="text-muted" style={{ fontSize: 12 }}>Daily trend (within month)</span>
              </div>
              <div style={{ height: 340 }}>
                {data.timeSeries.length === 0 && !loading ? (
                  <div className="text-muted">No data for selected filters.</div>
                ) : (
                  <Line data={lineData} options={lineOptions} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-2">By category</h5>
              <div style={{ height: 340 }}>
                {data.byCategory.length === 0 && !loading ? (
                  <div className="text-muted">No data for selected filters.</div>
                ) : (
                  <Bar data={barData} options={barOptions} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
