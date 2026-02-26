// src/pages/ccp/BakingCcpConfigPage.js

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import bakingCcpService from '../../services/bakingCcpService';

export default function BakingCcpConfigPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState(null);

  // Keep error for "load" failures
  const [error, setError] = useState('');

  // NEW: save feedback (success + error)
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' }); // type: 'success' | 'danger' | ''

  const [form, setForm] = useState({
    maxMinutesBetweenTemps: 60,
    maxMinutesToFreezer: 360,
    ovenStartMinF: '',
    ovenStartMaxF: '',
    packagingQuestionsJson: [],
  });

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    setSaveStatus({ type: '', message: '' }); // clear banners on refresh

    try {
      const data = await bakingCcpService.getConfig();
      const c = data?.config;

      setCfg(c || null);
      setForm({
        maxMinutesBetweenTemps: c?.maxMinutesBetweenTemps ?? 60,
        maxMinutesToFreezer: c?.maxMinutesToFreezer ?? 360,
        ovenStartMinF: c?.ovenStartMinF ?? '',
        ovenStartMaxF: c?.ovenStartMaxF ?? '',
        packagingQuestionsJson: Array.isArray(c?.packagingQuestionsJson) ? c.packagingQuestionsJson : [],
      });
    } catch (e) {
      console.error(e);
      setError('Failed to load Baking CCP configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const addQuestion = () => {
    setForm((f) => ({ ...f, packagingQuestionsJson: [...f.packagingQuestionsJson, ''] }));
  };

  const updateQuestion = (idx, value) => {
    setForm((f) => {
      const next = [...f.packagingQuestionsJson];
      next[idx] = value;
      return { ...f, packagingQuestionsJson: next };
    });
  };

  const removeQuestion = (idx) => {
    setForm((f) => {
      const next = [...f.packagingQuestionsJson];
      next.splice(idx, 1);
      return { ...f, packagingQuestionsJson: next };
    });
  };

  const canSave = useMemo(() => {
    const a = Number(form.maxMinutesBetweenTemps);
    const b = Number(form.maxMinutesToFreezer);
    if (!Number.isFinite(a) || a <= 0) return false;
    if (!Number.isFinite(b) || b <= 0) return false;
    return true;
  }, [form.maxMinutesBetweenTemps, form.maxMinutesToFreezer]);

  // Optional: auto-hide success after 3 seconds
  useEffect(() => {
    if (saveStatus.type !== 'success') return;
    const t = setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
    return () => clearTimeout(t);
  }, [saveStatus]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaveStatus({ type: '', message: '' });

    try {
      const payload = {
        maxMinutesBetweenTemps: Number(form.maxMinutesBetweenTemps),
        maxMinutesToFreezer: Number(form.maxMinutesToFreezer),
        ovenStartMinF: form.ovenStartMinF === '' ? null : Number(form.ovenStartMinF),
        ovenStartMaxF: form.ovenStartMaxF === '' ? null : Number(form.ovenStartMaxF),
        packagingQuestionsJson: (form.packagingQuestionsJson || []).map((q) => String(q || '').trim()).filter(Boolean),
      };

      const res = await bakingCcpService.saveConfig(payload);

      // Some APIs return { config }, others return the config directly—handle both.
      const nextCfg = res?.config ?? res ?? null;

      setCfg(nextCfg);
      setSaveStatus({ type: 'success', message: 'Configuration saved successfully.' });
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Failed to save Baking CCP configuration.';
      setSaveStatus({ type: 'danger', message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h4 className="mb-0">Baking CCP Configuration</h4>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Company-scoped settings for interval alerts, freezer window, and packaging checklist.
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/ccp/baking/start">
              Back
            </Link>
            <button className="btn btn-outline-primary" onClick={fetchConfig} disabled={loading || saving}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || saving || loading}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* NEW: Save feedback banner */}
        {saveStatus.message && (
          <div className={`alert alert-${saveStatus.type} mt-3 mb-0`} role="alert">
            {saveStatus.message}
          </div>
        )}

        {/* Existing: Load error banner */}
        {error && (
          <div className="alert alert-danger mt-3 mb-0" role="alert">
            {error}
          </div>
        )}

        <div className="row mt-3 g-3">
          <div className="col-12 col-lg-6">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">Timing Rules</h6>

                <label className="form-label mb-1">Max minutes between temperature readings</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={form.maxMinutesBetweenTemps}
                  onChange={(e) => setForm((f) => ({ ...f, maxMinutesBetweenTemps: e.target.value }))}
                />

                <label className="form-label mb-1 mt-3">Max minutes from oven to blast freezer</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={form.maxMinutesToFreezer}
                  onChange={(e) => setForm((f) => ({ ...f, maxMinutesToFreezer: e.target.value }))}
                />

                <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                  Defaults: 60 minutes temp interval, 360 minutes (6 hours) to freezer.
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">Oven Start Expected Range (Optional)</h6>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label mb-1">Min °F</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.ovenStartMinF}
                      onChange={(e) => setForm((f) => ({ ...f, ovenStartMinF: e.target.value }))}
                      placeholder="e.g. 850"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label mb-1">Max °F</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.ovenStartMaxF}
                      onChange={(e) => setForm((f) => ({ ...f, ovenStartMaxF: e.target.value }))}
                      placeholder="e.g. 950"
                    />
                  </div>
                </div>

                <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                  Used to flag an out-of-range oven start temperature during “Start Production”.
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Packaging Checklist Questions</h6>
                  <button className="btn btn-outline-secondary btn-sm" onClick={addQuestion} disabled={saving || loading}>
                    + Add question
                  </button>
                </div>

                <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                  These appear at “Complete Production” and are stored with the run record.
                </div>

                <div className="mt-3 d-flex flex-column gap-2">
                  {(form.packagingQuestionsJson || []).map((q, idx) => (
                    <div key={idx} className="d-flex gap-2">
                      <input
                        className="form-control"
                        value={q}
                        onChange={(e) => updateQuestion(idx, e.target.value)}
                        placeholder={`Question ${idx + 1}`}
                        disabled={saving || loading}
                      />
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => removeQuestion(idx)}
                        title="Remove"
                        disabled={saving || loading}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(form.packagingQuestionsJson || []).length === 0 && (
                    <div className="text-muted">No questions configured.</div>
                  )}
                </div>

                {cfg?.updatedAt && (
                  <div className="text-muted mt-3" style={{ fontSize: 12 }}>
                    Last updated: {new Date(cfg.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
