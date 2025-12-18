import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import analyticsService from '../../services/analyticsService';

const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const DEFAULT_CFG = {
  thresholds: {
    zones: {
      1: { passMaxRlu: 100 },
      2: { passMaxRlu: 150 },
      3: { passMaxRlu: 300 },
      4: { passMaxRlu: 400 },
    },
    default: { passMaxRlu: 250 }
  },
  retestSlaHours: 4,
};

export default function EnvironmentalConfigPage() {
  const [loading, setLoading] = useState(false);

  // locations
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locFilters, setLocFilters] = useState({ zone: '', isActive: 'true', q: '' });

  // config
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [cfgLoading, setCfgLoading] = useState(false);
  const [cfgSaving, setCfgSaving] = useState(false);

  // location modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [locForm, setLocForm] = useState({
    code: '',
    name: '',
    area: '',
    line: '',
    zone: 1,
    isActive: true,
    notes: '',
  });

  const openNew = () => {
    setEditingLoc(null);
    setLocForm({
      code: '',
      name: '',
      area: '',
      line: '',
      zone: 1,
      isActive: true,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (loc) => {
    setEditingLoc(loc);
    setLocForm({
      code: loc.code || '',
      name: loc.name || '',
      area: loc.area || '',
      line: loc.line || '',
      zone: loc.zone || 1,
      isActive: loc.isActive !== false,
      notes: loc.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLoc(null);
  };

  const fetchLocations = async () => {
    setLocLoading(true);
    try {
      const params = {};
      if (locFilters.isActive !== '') params.isActive = locFilters.isActive;
      if (locFilters.zone) params.zone = locFilters.zone;

      const res = await axios.get(`${API_URL}/api/analytics/environmental/locations`, {
        headers: authHeaders(),
        params
      });

      setLocations(res.data || []);
    } catch (e) {
      console.error(e);
      setLocations([]);
    } finally {
      setLocLoading(false);
    }
  };

  const fetchConfig = async () => {
    setCfgLoading(true);
    try {
      const res = await analyticsService.getWidgetConfig('environmental.summary');
      const loaded = res?.config || null;

      // Merge with defaults to avoid missing keys
      const merged = {
        ...DEFAULT_CFG,
        ...(loaded || {}),
        thresholds: {
          ...DEFAULT_CFG.thresholds,
          ...(loaded?.thresholds || {}),
          zones: {
            ...DEFAULT_CFG.thresholds.zones,
            ...(loaded?.thresholds?.zones || {}),
          },
          default: {
            ...DEFAULT_CFG.thresholds.default,
            ...(loaded?.thresholds?.default || {}),
          }
        }
      };

      setCfg(merged);
    } catch (e) {
      console.error(e);
      setCfg(DEFAULT_CFG);
    } finally {
      setCfgLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locFilters.zone, locFilters.isActive]);

  const filteredLocations = useMemo(() => {
    const q = (locFilters.q || '').trim().toLowerCase();
    if (!q) return locations;

    return locations.filter(l => {
      const hay = `${l.code || ''} ${l.name || ''} ${l.area || ''} ${l.line || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [locations, locFilters.q]);

  const saveLocation = async () => {
    const payload = {
      code: String(locForm.code || '').trim(),
      name: String(locForm.name || '').trim(),
      area: locForm.area ? String(locForm.area).trim() : null,
      line: locForm.line ? String(locForm.line).trim() : null,
      zone: Number(locForm.zone),
      isActive: !!locForm.isActive,
      notes: locForm.notes || null,
    };

    if (!payload.code || !payload.name || !payload.zone) {
      alert('Code, Name, and Zone are required.');
      return;
    }

    setLoading(true);
    try {
      if (editingLoc) {
        await axios.put(`${API_URL}/api/analytics/environmental/locations/${editingLoc.id}`, payload, {
          headers: authHeaders(),
        });
      } else {
        await axios.post(`${API_URL}/api/analytics/environmental/locations`, payload, {
          headers: authHeaders(),
        });
      }

      closeModal();
      await fetchLocations();
    } catch (e) {
      console.error(e);
      alert('Error saving location (check code uniqueness).');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (loc) => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/analytics/environmental/locations/${loc.id}`, {
        isActive: !loc.isActive,
      }, { headers: authHeaders() });

      await fetchLocations();
    } catch (e) {
      console.error(e);
      alert('Error updating location.');
    } finally {
      setLoading(false);
    }
  };

  const setZoneThreshold = (zone, value) => {
    setCfg(c => ({
      ...c,
      thresholds: {
        ...c.thresholds,
        zones: {
          ...c.thresholds.zones,
          [zone]: { passMaxRlu: value }
        }
      }
    }));
  };

  const saveConfig = async () => {
    setCfgSaving(true);
    try {
      // sanitize inputs
      const clean = JSON.parse(JSON.stringify(cfg));

      // ensure numeric thresholds
      for (const z of [1, 2, 3, 4]) {
        const v = Number(clean?.thresholds?.zones?.[z]?.passMaxRlu);
        clean.thresholds.zones[z] = { passMaxRlu: Number.isFinite(v) ? v : DEFAULT_CFG.thresholds.zones[z].passMaxRlu };
      }

      const d = Number(clean?.thresholds?.default?.passMaxRlu);
      clean.thresholds.default = { passMaxRlu: Number.isFinite(d) ? d : DEFAULT_CFG.thresholds.default.passMaxRlu };

      const sla = Number(clean?.retestSlaHours);
      clean.retestSlaHours = Number.isFinite(sla) ? sla : DEFAULT_CFG.retestSlaHours;

      await analyticsService.saveWidgetConfig('environmental.summary', clean);
      await fetchConfig();
      alert('Environmental configuration saved.');
    } catch (e) {
      console.error(e);
      alert('Error saving configuration.');
    } finally {
      setCfgSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="mb-0">Environmental Configuration (ATP)</h4>
          <div className="d-flex gap-2">
            <Link to="/trends/environmental" className="btn btn-outline-secondary">
              Back to Trends
            </Link>
            <button className="btn btn-outline-primary" onClick={saveConfig} disabled={cfgSaving || cfgLoading}>
              {cfgSaving ? 'Saving…' : 'Save Thresholds'}
            </button>
          </div>
        </div>

        {/* Thresholds */}
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div style={{ fontWeight: 600 }}>ATP Thresholds (Pass Max RLU by Zone)</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {cfgLoading ? 'Loading…' : 'Configure pass/fail thresholds'}
              </div>
            </div>

            <div className="row mt-3 g-2">
              {[1, 2, 3, 4].map(z => (
                <div className="col-12 col-md-3" key={z}>
                  <label className="form-label mb-1">Zone {z} max RLU</label>
                  <input
                    type="number"
                    className="form-control"
                    value={cfg?.thresholds?.zones?.[z]?.passMaxRlu ?? ''}
                    onChange={e => setZoneThreshold(z, e.target.value === '' ? '' : Number(e.target.value))}
                    min="0"
                  />
                </div>
              ))}
            </div>

            <div className="row mt-2 g-2">
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Default max RLU</label>
                <input
                  type="number"
                  className="form-control"
                  value={cfg?.thresholds?.default?.passMaxRlu ?? ''}
                  onChange={e => setCfg(c => ({
                    ...c,
                    thresholds: { ...c.thresholds, default: { passMaxRlu: e.target.value === '' ? '' : Number(e.target.value) } }
                  }))}
                  min="0"
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Re-test SLA (hours)</label>
                <input
                  type="number"
                  className="form-control"
                  value={cfg?.retestSlaHours ?? ''}
                  onChange={e => setCfg(c => ({ ...c, retestSlaHours: e.target.value === '' ? '' : Number(e.target.value) }))}
                  min="0"
                />
                <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Used later for KPI “retest compliance”.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontWeight: 600 }}>ATP Locations</div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Define where you swab and assign a zone.
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary" onClick={openNew}>
                  New Location
                </button>
                <button className="btn btn-outline-secondary" onClick={fetchLocations} disabled={locLoading}>
                  {locLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Location filters */}
            <div className="row mt-3 g-2">
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Zone</label>
                <select
                  className="form-select"
                  value={locFilters.zone}
                  onChange={e => setLocFilters(f => ({ ...f, zone: e.target.value }))}
                >
                  <option value="">All zones</option>
                  <option value="1">Zone 1</option>
                  <option value="2">Zone 2</option>
                  <option value="3">Zone 3</option>
                  <option value="4">Zone 4</option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Status</label>
                <select
                  className="form-select"
                  value={locFilters.isActive}
                  onChange={e => setLocFilters(f => ({ ...f, isActive: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label mb-1">Search</label>
                <input
                  type="text"
                  className="form-control"
                  value={locFilters.q}
                  onChange={e => setLocFilters(f => ({ ...f, q: e.target.value }))}
                  placeholder="Search by code, name, area, line…"
                />
              </div>
            </div>

            {/* Locations table */}
            <div className="table-responsive mt-3">
              <table className="table table-sm table-bordered align-middle">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>Code</th>
                    <th>Name</th>
                    <th className="d-none d-md-table-cell">Area</th>
                    <th className="d-none d-md-table-cell">Line</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Zone</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Active</th>
                    <th style={{ width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locLoading ? (
                    <tr><td colSpan={7} className="text-muted">Loading…</td></tr>
                  ) : filteredLocations.length === 0 ? (
                    <tr><td colSpan={7} className="text-muted">No locations found.</td></tr>
                  ) : (
                    filteredLocations.map(loc => (
                      <tr key={loc.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{loc.code}</td>
                        <td>{loc.name}</td>
                        <td className="d-none d-md-table-cell">{loc.area || '—'}</td>
                        <td className="d-none d-md-table-cell">{loc.line || '—'}</td>
                        <td>{loc.zone}</td>
                        <td>{loc.isActive ? 'Yes' : 'No'}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(loc)}>
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => toggleActive(loc)}
                              disabled={loading}
                            >
                              {loc.isActive ? 'Deactivate' : 'Activate'}
                            </button>
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

      {/* Location Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ marginTop: '75px' }}>
          <div className="modal-dialog modal-lg" role="document" style={{ boxShadow: '0px -2px 17px -1px rgba(0,0,0,0.35)' }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#1b2638', color: 'white' }}>
                <h5 className="modal-title">
                  {editingLoc ? `Edit Location (${editingLoc.code})` : 'New Location'}
                </h5>
                <button type="button" className="btn-close" style={{ filter: 'invert(1)' }} onClick={closeModal} />
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label mb-1">Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={locForm.code}
                      onChange={e => setLocForm(f => ({ ...f, code: e.target.value }))}
                      placeholder="ATP-Z1-001"
                    />
                  </div>
                  <div className="col-12 col-md-8">
                    <label className="form-label mb-1">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={locForm.name}
                      onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Work Table - Make Line"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label mb-1">Area</label>
                    <input
                      type="text"
                      className="form-control"
                      value={locForm.area}
                      onChange={e => setLocForm(f => ({ ...f, area: e.target.value }))}
                      placeholder="Make Line"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label mb-1">Line</label>
                    <input
                      type="text"
                      className="form-control"
                      value={locForm.line}
                      onChange={e => setLocForm(f => ({ ...f, line: e.target.value }))}
                      placeholder="Line 1"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label mb-1">Zone *</label>
                    <select
                      className="form-select"
                      value={locForm.zone}
                      onChange={e => setLocForm(f => ({ ...f, zone: Number(e.target.value) }))}
                    >
                      <option value={1}>Zone 1</option>
                      <option value={2}>Zone 2</option>
                      <option value={3}>Zone 3</option>
                      <option value={4}>Zone 4</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-4 d-flex align-items-end">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!locForm.isActive}
                        onChange={e => setLocForm(f => ({ ...f, isActive: e.target.checked }))}
                        id="isActive"
                      />
                      <label className="form-check-label" htmlFor="isActive">Active</label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label mb-1">Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={locForm.notes}
                      onChange={e => setLocForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Optional notes (surface type, cleaning SOP, etc.)"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-warning" onClick={saveLocation} disabled={loading}>
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
