import React, { useCallback, useEffect, useMemo, useState } from 'react';
import analyticsService from '../../services/analyticsService';
import logService from '../../services/logService';
import MultiLineChart from '../../components/charts/MultiLineChart';
import TrendBarChart from '../../components/charts/TrendBarChart';

const EMPTY = Object.freeze([]);
const PAGE_SIZE = 50;
const BAR_PALETTE = ['#1b2638', '#2f80ed', '#f2994a', '#27ae60', '#9b51e0', '#eb5757', '#f2c94c', '#219653'];

function varianceColor(pct) {
  if (pct == null) return '';
  const abs = Math.abs(pct);
  if (abs <= 5) return '#d4edda';
  if (abs <= 15) return '#fff3cd';
  return '#f8d7da';
}

function fmtVariance(pct) {
  if (pct == null) return <span className="text-muted">—</span>;
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

function fmtCostVariance(val) {
  if (val == null) return <span className="text-muted">—</span>;
  const abs = Math.abs(val).toFixed(2);
  return `${val > 0 ? '+' : val < 0 ? '-' : ''}$${abs}`;
}

// Groups varianceByIngredient rows into per-product summaries
function buildProductGroups(rows) {
  const map = {};
  for (const row of rows) {
    if (!map[row.productId]) {
      map[row.productId] = { productId: row.productId, productName: row.productName, totalUnits: row.totalUnits || 0, ingredients: [], totalActual: 0, totalExpected: 0, totalActualCost: 0, totalExpectedCost: 0, hasCostData: false };
    }
    const g = map[row.productId];
    g.ingredients.push(row);
    g.totalActual += row.actualKgTotal;
    if (row.expectedKgTotal != null) g.totalExpected += row.expectedKgTotal;
    if (row.costVariance !== null) {
      g.totalActualCost += row.actualCost || 0;
      g.totalExpectedCost += row.expectedCost || 0;
      g.hasCostData = true;
    }
  }
  return Object.values(map).map(g => {
    const hasExpected = g.ingredients.some(r => r.expectedKgTotal != null);
    const variancePct = (hasExpected && g.totalExpected > 0)
      ? Number(((g.totalActual - g.totalExpected) / g.totalExpected * 100).toFixed(1))
      : null;
    const costVariance = g.hasCostData ? Number((g.totalActualCost - g.totalExpectedCost).toFixed(2)) : null;
    return { ...g, totalActual: Number(g.totalActual.toFixed(3)), totalExpected: hasExpected ? Number(g.totalExpected.toFixed(3)) : null, variancePct, costVariance };
  }).sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
}

export default function IngredientTrendsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [widget, setWidget] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [page, setPage] = useState(0);

  const today = new Date();
  const toISODate = (d) => d.toISOString().split('T')[0];

  const [filters, setFilters] = useState(() => ({
    startDate: `${today.getFullYear()}-01-01`,
    endDate: toISODate(today),
    productId: '',
  }));

  useEffect(() => {
    (async () => {
      try { setProducts((await logService.getProducts()) || []); }
      catch (e) { console.error(e); }
    })();
  }, []);

  const fetchWidget = useCallback(async () => {
    setLoading(true);
    setPage(0);
    setExpandedIds(new Set());
    try {
      setWidget(await analyticsService.getIngredientsSummary({ ...filters }));
    } catch (e) {
      console.error(e);
      setWidget(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchWidget(); }, [fetchWidget]);

  const kpis = widget?.kpis ?? {};
  const charts = widget?.charts ?? {};

  const consumptionOverTime = charts.consumptionOverTime ?? EMPTY;
  const costPerProduct = charts.costPerProduct ?? EMPTY;
  const varianceByIngredient = charts.varianceByIngredient ?? EMPTY;

  // Bar chart data
  const costLabels = costPerProduct.map(p => p.productName);
  const costValues = costPerProduct.map(p => p.avgCostPerUnit ?? 0);
  const costColors = costLabels.map((_, i) => BAR_PALETTE[i % BAR_PALETTE.length]);

  // Variance grouped by product
  const productGroups = useMemo(() => buildProductGroups(varianceByIngredient), [varianceByIngredient]);
  const totalPages = Math.ceil(productGroups.length / PAGE_SIZE);
  const pageGroups = productGroups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Grand totals across all products (all pages)
  const grandTotals = useMemo(() => {
    let totalUnits = 0, totalExpKg = 0, totalActKg = 0, totalActCost = 0, totalExpCost = 0;
    let hasExp = false, hasCost = false;
    for (const g of productGroups) {
      totalUnits += g.totalUnits || 0;
      totalActKg += g.totalActual || 0;
      if (g.totalExpected != null) { totalExpKg += g.totalExpected; hasExp = true; }
      if (g.hasCostData) { totalActCost += g.totalActualCost; totalExpCost += g.totalExpectedCost; hasCost = true; }
    }
    const variancePct = hasExp && totalExpKg > 0
      ? Number(((totalActKg - totalExpKg) / totalExpKg * 100).toFixed(1)) : null;
    const costVariance = hasCost ? Number((totalActCost - totalExpCost).toFixed(2)) : null;
    return {
      totalUnits, variancePct, costVariance,
      totalExpKg: hasExp ? Number(totalExpKg.toFixed(3)) : null,
      totalActKg: Number(totalActKg.toFixed(3)),
    };
  }, [productGroups]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const fmtKg = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
  };

  const fmtUnits = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const fmtMoney = (v) => {
    if (v == null || !Number.isFinite(Number(v))) return '—';
    return `$${Number(v).toFixed(4)}`;
  };

  return (
    <div className="card">
      <div className="card-body">

        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h4 className="mb-0">Ingredient Consumption Analytics</h4>
          <button className="btn btn-outline-primary" onClick={fetchWidget} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="row g-2 mb-3">
          <div className="col-12 col-sm-4">
            <label className="form-label mb-1">Start Date</label>
            <input type="date" className="form-control"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="col-12 col-sm-4">
            <label className="form-label mb-1">End Date</label>
            <input type="date" className="form-control"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="col-12 col-sm-4">
            <label className="form-label mb-1">Product</label>
            <select className="form-select"
              value={filters.productId}
              onChange={e => setFilters(f => ({ ...f, productId: e.target.value }))}>
              <option value="">All products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Units produced</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtUnits(kpis.totalUnitsProduced)}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>Period total</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Total kg consumed</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtKg(kpis.totalKgConsumed)}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>All ingredients</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Avg ingredient cost / unit</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtMoney(kpis.avgCostPerUnit)}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {kpis.avgCostPerUnit == null ? 'Add prices in Ingredients settings' : 'Based on price history'}
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Ingredients tracked</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{kpis.ingredientCount ?? '—'}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>With recorded quantities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart: Consumption over time */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="mb-2" style={{ fontWeight: 600 }}>Monthly consumption by ingredient (kg)</div>
            <MultiLineChart series={consumptionOverTime} yAxisTitle="kg" granularity="month" />
            {consumptionOverTime.length > 0 && (
              <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                Only ingredients with recorded quantities are shown.
              </div>
            )}
          </div>
        </div>

        {/* Chart: Cost per product */}
        <div className="card mb-3">
          <div className="card-body">
            <TrendBarChart
              title="Average ingredient cost per unit produced ($)"
              labels={costLabels}
              values={costValues}
              colors={costColors}
              yAxisTitle="$ / unit"
              label="Cost / unit"
              emptyText="No price data recorded yet. Add prices in the Ingredients settings to see cost analysis."
            />
          </div>
        </div>

        {/* Table: Variance vs recipe (grouped by product) */}
        <div className="card">
          <div className="card-body">
            <div className="mb-1" style={{ fontWeight: 600 }}>Variance vs recipe</div>
            <div className="text-muted mb-2" style={{ fontSize: 12 }}>
              Actual kg consumed vs expected kg (recipe × units produced).
              Click a product row to see per-ingredient breakdown.{' '}
              Colour: <span style={{ background: '#d4edda', padding: '0 4px' }}>≤5%</span>{' '}
              <span style={{ background: '#fff3cd', padding: '0 4px' }}>≤15%</span>{' '}
              <span style={{ background: '#f8d7da', padding: '0 4px' }}>&gt;15%</span>
            </div>

            {productGroups.length === 0 ? (
              <div className="text-muted">No ingredient data for the selected period.</div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-sm table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 28 }}></th>
                        <th>Product</th>
                        <th className="text-end">Units Produced</th>
                        <th className="text-end">Expected kg</th>
                        <th className="text-end">Actual kg</th>
                        <th className="text-end">Variance</th>
                        <th className="text-end">$ Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageGroups.map(group => {
                        const expanded = expandedIds.has(group.productId);
                        return (
                          <React.Fragment key={group.productId}>
                            {/* Product summary row */}
                            <tr
                              onClick={() => toggleExpand(group.productId)}
                              style={{ cursor: 'pointer', background: '#f8f9fa', fontWeight: 600 }}
                            >
                              <td className="text-center" style={{ fontSize: 12 }}>
                                {expanded ? '▼' : '▶'}
                              </td>
                              <td>{group.productName}</td>
                              <td className="text-end">{group.totalUnits ?? '—'}</td>
                              <td className="text-end">
                                {group.totalExpected != null ? group.totalExpected.toFixed(3) : <span className="text-muted fw-normal">— no recipe</span>}
                              </td>
                              <td className="text-end">{group.totalActual.toFixed(3)}</td>
                              <td className="text-end"
                                style={{ background: varianceColor(group.variancePct) }}>
                                {fmtVariance(group.variancePct)}
                              </td>
                              <td className="text-end"
                                style={{ background: varianceColor(group.variancePct) }}>
                                {fmtCostVariance(group.costVariance)}
                              </td>
                            </tr>

                            {/* Ingredient detail rows (expanded) */}
                            {expanded && group.ingredients.map((ing, j) => (
                              <tr key={j} style={{ background: '#fff', fontSize: 13 }}>
                                <td></td>
                                <td className="ps-4 text-muted">{ing.ingredientName}</td>
                                <td></td>
                                <td className="text-end text-muted">
                                  {ing.expectedKgTotal != null ? ing.expectedKgTotal.toFixed(3) : '—'}
                                </td>
                                <td className="text-end text-muted">{ing.actualKgTotal.toFixed(3)}</td>
                                <td className="text-end text-muted"
                                  style={{ background: varianceColor(ing.variancePct) }}>
                                  {fmtVariance(ing.variancePct)}
                                </td>
                                <td className="text-end text-muted"
                                  style={{ background: varianceColor(ing.variancePct) }}>
                                  {fmtCostVariance(ing.costVariance)}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    {productGroups.length > 0 && (
                      <tfoot>
                        <tr style={{ fontWeight: 700, background: '#e9ecef', borderTop: '2px solid #dee2e6' }}>
                          <td></td>
                          <td>TOTAL</td>
                          <td className="text-end">{grandTotals.totalUnits}</td>
                          <td className="text-end">
                            {grandTotals.totalExpKg != null ? grandTotals.totalExpKg.toFixed(3) : '—'}
                          </td>
                          <td className="text-end">{grandTotals.totalActKg.toFixed(3)}</td>
                          <td className="text-end" style={{ background: varianceColor(grandTotals.variancePct) }}>
                            {fmtVariance(grandTotals.variancePct)}
                          </td>
                          <td className="text-end" style={{ background: varianceColor(grandTotals.variancePct) }}>
                            {fmtCostVariance(grandTotals.costVariance)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex align-items-center justify-content-between mt-2">
                    <span className="text-muted" style={{ fontSize: 13 }}>
                      Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, productGroups.length)} of {productGroups.length} products
                    </span>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹</button>
                      <button className="btn btn-outline-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>›</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
