import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import analyticsService from '../../services/analyticsService';
import logService from '../../services/logService';
import TrendLineChart from '../../components/charts/TrendLineChart';
import DualLineChart from '../../components/charts/DualLineChart';

export default function ProductionTrendsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [widget, setWidget] = useState(null);

  const today = new Date();
  const yyyy = today.getFullYear();
  const toISODate = (d) => d.toISOString().split('T')[0];

  const [filters, setFilters] = useState(() => ({
    startDate: `${yyyy}-01-01`,
    endDate: toISODate(today),
    productId: '',
    granularity: 'month', // fixed monthly; keep for future
  }));

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

  // Safe accessors
  const kpis = widget?.kpis || {};
  const delta = kpis?.delta || {};
  const charts = widget?.charts || {};

  const missingMonths = widget?.meta?.missingLaborMonths || [];
  const laborDataComplete = widget?.meta?.laborDataComplete !== false;

  // Prefer whichever key your backend returns
  const unitsProduced =
    (kpis.unitsProduced ?? kpis.producedUnits ?? null);

  const unitsPerEmployee =
    (kpis.unitsPerEmployee ?? null);

  const laborHoursPer1000Units =
    (kpis.laborHoursPer1000Units ?? null);

  const laborCostPerUnit =
    (kpis.laborCostPerUnit ?? null);

  const scrapRatePct =
    (kpis.scrapRatePct ?? null);

  // Format helpers
  const fmtNum = (v, digits = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString(undefined, {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  };

  const moneySmall = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return `$${n.toFixed(2)}`;
  };

  const formatPct = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`);
  const arrow = (v) => (v == null ? '' : (v > 0 ? '▲' : v < 0 ? '▼' : '•'));

  // Show “no data” nicely if the widget failed to load
  const hasAnyChartData = useMemo(() => {
    const a = charts.unitsOverTime || [];
    const b = charts.laborCostOverTime || [];
    return a.length > 0 || b.length > 0;
  }, [charts]);

  return (
    <div className="card">
      <div className="card-body">

        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <h4 className="mb-0">Production Trends</h4>

            {!laborDataComplete && (
              <span
                className="badge"
                style={{ backgroundColor: '#f2c94c', color: '#1b2638', fontWeight: 700 }}
                title={`Missing labor months: ${missingMonths.join(', ')}`}
              >
                Labor data missing ({missingMonths.length})
              </span>
            )}
          </div>

          <div className="d-flex gap-2">
            <Link to="/trends/production/labor" className="btn btn-outline-secondary">
              Labor Info
            </Link>
            <Link to="/logs" className="btn btn-outline-secondary">
              Production Log
            </Link>
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

        {/* KPI Tiles */}
        <div className="row mt-3 g-2">
          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Units produced</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>
                  {fmtNum(unitsProduced, 0)}
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {arrow(delta.unitsMoM)} MoM: {formatPct(delta.unitsMoM)}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Labor Cost / Unit</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>
                  {laborCostPerUnit == null ? '—' : moneySmall(laborCostPerUnit)}
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {arrow(delta.laborCostPerUnitMoM)} MoM: {formatPct(delta.laborCostPerUnitMoM)}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Units / employee</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>
                  {fmtNum(unitsPerEmployee, 1)}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Labor hrs / 1,000 units</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>
                  {fmtNum(laborHoursPer1000Units, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="row mt-2 g-2">
          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Scrap rate</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>
                  {scrapRatePct != null ? `${fmtNum(scrapRatePct, 2)}%` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="row mt-3 g-3">
          <div className="col-12 col-lg-7">
            <div className="card">
              <div className="card-body">
                <TrendLineChart
                  title="Monthly units produced"
                  points={charts.unitsOverTime || []} // [{x:'YYYY-MM-01', y:n}]
                  label="Units"
                  color="#1b2638"
                  yAxisTitle="Units"
                  granularity="month"
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card">
              <div className="card-body">
                <DualLineChart
                  title="Units Produced vs Labor Cost"
                  pointsA={charts.unitsOverTime || []}
                  labelA="Units Produced"
                  pointsB={charts.laborCostOverTime || []}
                  labelB="Labor Cost"
                  colorA="#1b2638"
                  colorB="#f2994a"
                  useDualAxis
                  axisTitleA="Units"
                  axisTitleB="Labor Cost ($)"
                  formatBAsCurrency
                />

                {!loading && !hasAnyChartData ? (
                  <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                    No chart data for the selected filters.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
