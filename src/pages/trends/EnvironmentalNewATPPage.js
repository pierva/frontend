import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import analyticsService from '../../services/analyticsService';

const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const toISODate = (d) => {
  try {
    return new Date(d).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export default function EnvironmentalNewATPPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [locations, setLocations] = useState([]);
  const [cfg, setCfg] = useState(null);

  const [form, setForm] = useState({
    sampleDate: toISODate(new Date()),
    locationId: '',
    rlu: '',
    notes: '',
    timing: 'POST_CLEAN',   // explicit default
  });

  // Load locations + config thresholds
  useEffect(() => {
    (async () => {
      try {
        setLocationsLoading(true);
        const res = await axios.get(`${API_URL}/api/analytics/environmental/locations`, {
          headers: authHeaders(),
          params: { isActive: true },
        });
        setLocations(res.data || []);
      } catch (e) {
        console.error(e);
        setLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    })();

    (async () => {
      try {
        const cfgRes = await analyticsService.getWidgetConfig('environmental.summary');
        setCfg(cfgRes?.config || null);
      } catch (e) {
        console.error(e);
        setCfg(null);
      }
    })();
  }, []);

  const selectedLocation = useMemo(() => {
    return locations.find(l => String(l.id) === String(form.locationId)) || null;
  }, [locations, form.locationId]);

  const zone = selectedLocation?.zone || null;

  const passMaxRlu = useMemo(() => {
    const z = zone;
    const zCfg = cfg?.thresholds?.zones?.[z];
    const def = cfg?.thresholds?.default;
    const v = Number(zCfg?.passMaxRlu ?? def?.passMaxRlu);
    return Number.isFinite(v) ? v : null;
  }, [cfg, zone]);

  const derivedStatus = useMemo(() => {
    const r = Number(form.rlu);
    if (!Number.isFinite(r) || r < 0) return null;
    if (passMaxRlu == null) return null;
    return r <= passMaxRlu ? 'PASS' : 'FAIL';
  }, [form.rlu, passMaxRlu]);

  const save = async () => {
    // minimal validation
    if (!form.sampleDate) return alert('Sample date is required.');
    if (!form.locationId) return alert('Location is required.');
    const r = Number(form.rlu);
    if (!Number.isFinite(r) || r < 0) return alert('RLU must be a valid number.');

    setLoading(true);
    try {
      const payload = {
        sampleDate: form.sampleDate,
        locationId: Number(form.locationId),
        rlu: r,
        timing: form.timing,
        notes: form.notes ? String(form.notes).trim() : null,

        // if your backend expects status, you can send it;
        // but ideally backend computes it too:
        status: derivedStatus || null,
      };

      await axios.post(`${API_URL}/api/analytics/environmental/atp`, payload, {
        headers: authHeaders(),
      });

      // back to trends after save
      nav('/trends/environmental');
    } catch (e) {
      console.error(e);
      alert('Error saving ATP swab. Check server logs for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="mb-0">New ATP Swab</h4>
          <div className="d-flex gap-2">
            <Link to="/trends/environmental" className="btn btn-outline-secondary">
              Back to Environmental Trends
            </Link>
            <Link to="/trends/environmental/config" className="btn btn-outline-secondary">
              Configuration
            </Link>
          </div>
        </div>

        <div className="row mt-3 g-3">
          <div className="col-12 col-md-4">
            <label className="form-label mb-1">Sample Date *</label>
            <input
              type="date"
              className="form-control"
              value={form.sampleDate}
              onChange={e => setForm(f => ({ ...f, sampleDate: e.target.value }))}
            />
          </div>

          <div className="col-12 col-md-8">
            <label className="form-label mb-1">Location *</label>
            <select
              className="form-select"
              value={form.locationId}
              onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}
              disabled={locationsLoading}
            >
              <option value="">{locationsLoading ? 'Loading…' : 'Select a location'}</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.name} (Zone {l.zone}{l.area ? `, ${l.area}` : ''}{l.line ? `, ${l.line}` : ''})
                </option>
              ))}
            </select>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              Locations come from Environmental Configuration.
            </div>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label mb-1">RLU *</label>
            <input
              type="number"
              className="form-control"
              value={form.rlu}
              onChange={e => setForm(f => ({ ...f, rlu: e.target.value }))}
              min="0"
              step="1"
              placeholder="e.g., 120"
            />
          </div>
          <div className="col-12 col-md-3">
          <label className="form-label mb-1">Timing *</label>
          <select
            className="form-select"
            value={form.timing}
            onChange={e => setForm(f => ({ ...f, timing: e.target.value }))}
          >
            <option value="POST_CLEAN">Post-clean</option>
            <option value="PRE_OP">Pre-op</option>
            <option value="IN_PROCESS">In process</option>
          </select>
        </div>

          <div className="col-12 col-md-6">
            <label className="form-label mb-1">Notes</label>
            <input
              type="text"
              className="form-control"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes (pre-op, post-op, cleaning event, etc.)"
            />
          </div>
        </div>

        {/* Derived info */}
        <div className="row mt-3 g-2">
          <div className="col-12 col-lg-6">
            <div className="card">
              <div className="card-body">
                <div className="text-muted">Derived</div>
                <div className="mt-2">
                  <div><strong>Zone:</strong> {zone ?? '—'}</div>
                  <div><strong>Pass max (RLU):</strong> {passMaxRlu ?? '—'}</div>
                  <div>
                    <strong>Status:</strong>{' '}
                    {derivedStatus ? (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: derivedStatus === 'PASS' ? '#27ae60' : '#eb5757',
                          color: 'white',
                          fontWeight: 700
                        }}
                      >
                        {derivedStatus}
                      </span>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {!cfg && (
                  <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                    Threshold config not loaded yet. Status will compute once config is available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-warning" onClick={save} disabled={loading}>
            {loading ? 'Saving…' : 'Save ATP Swab'}
          </button>
          <Link to="/trends/environmental" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
