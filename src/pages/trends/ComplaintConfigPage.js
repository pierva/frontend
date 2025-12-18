// src/pages/trends/ComplaintConfigPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ComplaintCategoriesManager from '../../components/complaints/ComplaintCategoriesManager';
import ComplaintGuidanceRulesManager from '../../components/complaints/ComplaintGuidanceRulesManager';
import analyticsService from '../../services/analyticsService';

function ComplaintThresholdsCard() {
  const WIDGET_KEY = 'complaints.summary';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [greenMax, setGreenMax] = useState('1');  // defaults
  const [amberMax, setAmberMax] = useState('2');  // defaults

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const res = await analyticsService.getWidgetConfig(WIDGET_KEY);
        const cfg = res?.config;

        const g = cfg?.thresholds?.complaintsPer10k?.greenMax;
        const a = cfg?.thresholds?.complaintsPer10k?.amberMax;

        if (g !== undefined && g !== null) setGreenMax(String(g));
        if (a !== undefined && a !== null) setAmberMax(String(a));
      } catch (e) {
        console.error('Error loading thresholds config', e);
        setMessage('Unable to load thresholds (using defaults).');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const g = Number(greenMax);
      const a = Number(amberMax);

      if (!Number.isFinite(g) || !Number.isFinite(a)) {
        setMessage('Please enter valid numeric thresholds.');
        return;
      }
      if (g < 0 || a < 0) {
        setMessage('Thresholds must be 0 or higher.');
        return;
      }
      if (a < g) {
        setMessage('Amber max must be greater than or equal to Green max.');
        return;
      }

      await analyticsService.saveWidgetConfig(WIDGET_KEY, {
        thresholds: {
          complaintsPer10k: { greenMax: g, amberMax: a }
        }
      });

      setMessage('Thresholds saved.');
    } catch (e) {
      console.error('Error saving thresholds config', e);
      setMessage('Error saving thresholds.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div>
            <div style={{ fontWeight: 700 }}>Thresholds</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Used to color the “Complaints / 10,000 units” KPI (Green / Amber / Red).
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={onSave}
            disabled={loading || saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="row g-2 mt-2">
          <div className="col-12 col-md-6">
            <label className="form-label mb-1">Green max (complaints / 10,000 units)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={greenMax}
              onChange={(e) => setGreenMax(e.target.value)}
              disabled={loading || saving}
            />
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              ≤ this value is Green
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label mb-1">Amber max (complaints / 10,000 units)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={amberMax}
              onChange={(e) => setAmberMax(e.target.value)}
              disabled={loading || saving}
            />
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              ≤ this value is Amber, above is Red
            </div>
          </div>
        </div>

        {message ? (
          <div className="mt-2 text-muted" style={{ fontSize: 13 }}>
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ComplaintConfigPage() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Complaints Configuration</h4>
          <Link to="/trends/complaints" className="btn btn-outline-secondary">
            Back to Trends
          </Link>
        </div>

        <div className="alert alert-info mt-3">
          Configure Categories first, then add Guidance Rules. Complaints cannot be created until at least one Category exists.
        </div>

        {/* NEW: Thresholds */}
        <div className="mt-3">
          <ComplaintThresholdsCard />
        </div>

        <div className="row g-3 mt-1">
          <div className="col-12 col-lg-5">
            <ComplaintCategoriesManager />
          </div>
          <div className="col-12 col-lg-7">
            <ComplaintGuidanceRulesManager />
          </div>
        </div>
      </div>
    </div>
  );
}
