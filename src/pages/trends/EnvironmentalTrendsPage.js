import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import analyticsService from '../../services/analyticsService';
import TrendLineChart from '../../components/charts/TrendLineChart';
import TrendBarChart from '../../components/charts/TrendBarChart';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export default function EnvironmentalTrendsPage() {
  const [loading, setLoading] = useState(false);
  const [widget, setWidget] = useState(null);

  const [locations, setLocations] = useState([]);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    locationId: '',
    zone: '',
    status: '',
    timing: '',
    granularity: 'month',
  });

  const fetchLocations = async () => {
    const res = await axios.get(`${API_URL}/api/analytics/environmental/locations`, {
      headers: authHeaders(),
      params: { isActive: true }
    });
    setLocations(res.data || []);
  };

  const fetchWidget = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getEnvironmentalSummary({ ...filters });
      setWidget(data);
    } catch (e) {
      console.error(e);
      setWidget(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations().catch(console.error);
  }, []);

  useEffect(() => {
    fetchWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.locationId, filters.zone, filters.status, filters.timing, filters.granularity]);

  const kpis = widget?.kpis || {};
  const charts = widget?.charts || {};
  const list = widget?.list || [];

  const fmtNum = (v, digits = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="mb-0">Environmental Trends (ATP)</h4>
          
          <Link to="/trends/environmental/new" className="btn btn-outline-primary">
            New ATP Swab
          </Link>

          <div className="d-flex gap-2">
            <Link to="/trends/environmental/config" className="btn btn-outline-secondary">
              Configuration
            </Link>
            <button className="btn btn-outline-primary" onClick={fetchWidget} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="row mt-3 g-2">
          <div className="col-12 col-sm-3">
            <label className="form-label mb-1">Start Date</label>
            <input type="date" className="form-control" value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="col-12 col-sm-3">
            <label className="form-label mb-1">End Date</label>
            <input type="date" className="form-control" value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
          </div>

          <div className="col-12 col-sm-3">
            <label className="form-label mb-1">Zone</label>
            <select className="form-select" value={filters.zone}
              onChange={e => setFilters(f => ({ ...f, zone: e.target.value, locationId: '' }))}>
              <option value="">All zones</option>
              <option value="1">Zone 1</option>
              <option value="2">Zone 2</option>
              <option value="3">Zone 3</option>
              <option value="4">Zone 4</option>
            </select>
          </div>

          <div className="col-12 col-sm-3">
            <label className="form-label mb-1">Location</label>
            <select className="form-select" value={filters.locationId}
              onChange={e => setFilters(f => ({ ...f, locationId: e.target.value }))}>
              <option value="">All locations</option>
              {locations
                .filter(l => !filters.zone || String(l.zone) === String(filters.zone))
                .map(l => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="row mt-2 g-2">
          <div className="col-12 col-sm-3">
            <label className="form-label mb-1">Timing</label>
            <select className="form-select" value={filters.timing}
              onChange={e => setFilters(f => ({ ...f, timing: e.target.value }))}>
              <option value="">All</option>
              <option value="PRE_OP">Pre-Op</option>
              <option value="POST_CLEAN">Post-Clean</option>
              <option value="IN_PROCESS">In-Process</option>
            </select>
          </div>
          <div className="col-12 col-sm-3">
            <label className="form-label mb-1">Status</label>
            <select className="form-select" value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
            </select>
          </div>
          <div className="col-12 col-sm-3">
            <label className="form-label mb-1">View</label>
            <select className="form-select" value={filters.granularity}
              onChange={e => setFilters(f => ({ ...f, granularity: e.target.value }))}>
              <option value="month">Monthly</option>
              <option value="day">Daily</option>
            </select>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="row mt-3 g-2">
          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Samples</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtNum(kpis.totalSamples, 0)}</div>
            </div></div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Fail count</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtNum(kpis.failCount, 0)}</div>
            </div></div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Pass rate</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {kpis.passRatePct != null ? `${fmtNum(kpis.passRatePct, 2)}%` : '—'}
              </div>
            </div></div>
          </div>

          <div className="col-12 col-md-3">
            <div className="card"><div className="card-body">
              <div className="text-muted">Avg RLU</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtNum(kpis.avgRlu, 0)}</div>
            </div></div>
          </div>
        </div>

        {/* Charts */}
        <div className="row mt-3 g-3">
          <div className="col-12 col-lg-7">
            <div className="card"><div className="card-body">
              <TrendLineChart
                title="ATP Fails over time"
                points={charts.failsOverTime || []}
                label="Fails"
                color="#eb5757"
                yAxisTitle="Fail count"
                granularity={filters.granularity}
              />
            </div></div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card"><div className="card-body">
              <TrendBarChart
                title="Fails by location"
                labels={(charts.failsByLocation || []).map(r => `${r.locationCode || ''}`.trim() || `#${r.locationId}`)}
                values={(charts.failsByLocation || []).map(r => r.count)}
                yAxisTitle="Fails"
              />
            </div></div>
          </div>
        </div>

        {/* List */}
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div style={{ fontWeight: 600 }}>ATP Samples</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? 'Loading…' : `${list.length} record(s)`}
              </div>
            </div>

            <div className="table-responsive mt-2">
              <table className="table table-sm table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Zone</th>
                    <th>Timing</th>
                    <th>RLU</th>
                    <th>Status</th>
                    <th>Threshold</th>
                    <th className="d-none d-lg-table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-muted">Loading…</td></tr>
                  ) : list.length === 0 ? (
                    <tr><td colSpan={8} className="text-muted">No data for the selected filters.</td></tr>
                  ) : (
                    list.map((r) => (
                      <tr key={r.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{r.sampleDate}</td>
                        <td>{r.Location ? `${r.Location.code} — ${r.Location.name}` : `#${r.locationId}`}</td>
                        <td>{r.Location?.zone ?? '—'}</td>
                        <td>{r.timing}</td>
                        <td>{r.rlu}</td>
                        <td style={{ fontWeight: 700, color: r.status === 'FAIL' ? '#eb5757' : '#27ae60' }}>
                          {r.status}
                        </td>
                        <td>{r.thresholdUsed}</td>
                        <td className="d-none d-lg-table-cell" style={{ maxWidth: 420 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.notes || '—'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
