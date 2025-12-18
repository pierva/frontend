import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import analyticsService from '../../services/analyticsService';
import logService from '../../services/logService';
import TrendLineChart from '../../components/charts/TrendLineChart';
import DualLineChart from '../../components/charts/DualLineChart';

export default function ProductionTrendsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [widget, setWidget] = useState(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    productId: '',
    granularity: 'month', // fixed monthly; keep for future
  });

  useEffect(() => {
    (async () => {
      try {
        const prods = await logService.getProducts();
        setProducts(prods || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchWidget = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getProductionSummary({ ...filters });
      setWidget(data);
    } catch (e) {
      console.error(e);
      setWidget(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.productId, filters.granularity]);

  const kpis = widget?.kpis || {};
  const charts = widget?.charts || {};

  const fmtMoney = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  };
  const fmtNum = (v, digits = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="mb-0">Production Trends</h4>
          <div className="d-flex gap-2">
            <Link to="/logs" className="btn btn-outline-secondary">Production Log</Link>
            <button className="btn btn-outline-primary" onClick={fetchWidget} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="row mt-3 g-2">
          <div className="col-12 col-sm-4">
            <label className="form-label mb-1">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="col-12 col-sm-4">
            <label className="form-label mb-1">End Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="col-12 col-sm-4">
            <label className="form-label mb-1">Product</label>
            <select
              className="form-select"
              value={filters.productId}
              onChange={e => setFilters(f => ({ ...f, productId: e.target.value }))}
            >
              <option value="">All products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="row mt-3 g-2">
          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Units produced</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtNum(kpis.unitsProduced, 0)}</div>
            </div></div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Labor cost / unit</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{kpis.laborCostPerUnit != null ? fmtMoney(kpis.laborCostPerUnit) : '—'}</div>
            </div></div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Units / employee</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtNum(kpis.unitsPerEmployee, 1)}</div>
            </div></div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Labor hrs / 1,000 units</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtNum(kpis.laborHoursPer1000Units, 2)}</div>
            </div></div>
          </div>
        </div>

        <div className="row mt-2 g-2">
          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Scrap rate</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {kpis.scrapRatePct != null ? `${fmtNum(kpis.scrapRatePct, 2)}%` : '—'}
              </div>
            </div></div>
          </div>
        </div>

        {/* Charts */}
        <div className="row mt-3 g-3">
          <div className="col-12 col-lg-7">
            <div className="card"><div className="card-body">
              <TrendLineChart
                title="Monthly units produced"
                points={charts.unitsOverTime || []} // [{x:'YYYY-MM-01', y:n}]
                label="Units"
                color="#1b2638"
                yAxisTitle="Units"
                granularity="month"
              />
            </div></div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card"><div className="card-body">
              <DualLineChart
                title="Units vs employees (monthly)"
                pointsA={charts.unitsOverTime || []}
                labelA="Units"
                pointsB={charts.employeesOverTime || []}
                labelB="Employees"
              />
            </div></div>
          </div>
        </div>

      </div>
    </div>
  );
}
