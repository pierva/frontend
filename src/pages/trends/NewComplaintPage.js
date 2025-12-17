// src/pages/trends/NewComplaintPage.js
import React, { useEffect, useMemo, useState } from 'react';
import complaintService from '../../services/complaintService';
import { Link } from 'react-router-dom';


const SOURCE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'INTERNAL', label: 'Internal' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
];

export default function NewComplaintPage() {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);

  // Batch search
  const [batchQuery, setBatchQuery] = useState('');
  const [batchSuggestions, setBatchSuggestions] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const [form, setForm] = useState({
    complaint_date: new Date().toISOString().split('T')[0], // DATEONLY
    productId: '',
    batchId: '',
    categoryId: '',
    guidanceRuleId: '',
    riskType: 'QUALITY',
    severityLevel: 1,
    capaRequired: false,
    capaReason: '',
    source: 'CUSTOMER',
    customer_name: '',
    notes: '',
  });

  const toast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  // Load categories + products on mount
  useEffect(() => {
    (async () => {
      try {
        const [cats, prods] = await Promise.all([
          complaintService.getCategories(),
          complaintService.getProducts(),
        ]);
        setCategories((cats || []).filter(c => c.isActive));
        setProducts(prods || []);
      } catch (e) {
        console.error(e);
        toast('Error loading initial data.');
      }
    })();
  }, []);

  // Load rules when category changes
  useEffect(() => {
    (async () => {
      if (!form.categoryId) {
        setRules([]);
        return;
      }
      try {
        const r = await complaintService.getGuidanceRules(form.categoryId);
        setRules((r || []).filter(x => x.isActive));
      } catch (e) {
        console.error(e);
        setRules([]);
      }
    })();
  }, [form.categoryId]);

  // When guidance rule changes, auto-fill risk/severity (+ CAPA)
  useEffect(() => {
    if (!form.guidanceRuleId) return;

    const rule = rules.find(r => String(r.id) === String(form.guidanceRuleId));
    if (!rule) return;

    const newSeverity = rule.alwaysSeverity3 ? 3 : Number(rule.severityLevel || 1);
    const newRisk = rule.riskType || 'QUALITY';

    setForm(prev => ({
      ...prev,
      riskType: newRisk,
      severityLevel: newSeverity,
      capaRequired: newSeverity === 3 ? true : prev.capaRequired
    }));
  }, [form.guidanceRuleId, rules]);

  // If severity is manually set to 3, force CAPA required
  useEffect(() => {
    if (Number(form.severityLevel) === 3 && !form.capaRequired) {
      setForm(prev => ({ ...prev, capaRequired: true }));
    }
  }, [form.severityLevel, form.capaRequired]);

  const selectedProductLabel = useMemo(() => {
    if (!form.productId) return '';
    const p = products.find(x => String(x.id) === String(form.productId));
    return p ? p.name : '';
  }, [form.productId, products]);

  // Debounced batch lookup
  useEffect(() => {
    const q = batchQuery.trim();
    if (q.length < 2) {
      setBatchSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      setBatchLoading(true);
      try {
        const rows = await complaintService.searchBatches(q);
        setBatchSuggestions(rows || []);
      } catch (e) {
        console.error(e);
        setBatchSuggestions([]);
      } finally {
        setBatchLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [batchQuery]);

  const onPickBatch = (b) => {
    setForm(prev => ({ ...prev, batchId: b.id }));
    setBatchQuery(b.lotCode);
    setBatchSuggestions([]);
  };

  const validate = () => {
    if (!form.complaint_date) return 'Complaint date is required.';
    if (!form.categoryId) return 'Category is required.';
    if (!form.riskType) return 'Risk type is required.';
    if (![1,2,3].includes(Number(form.severityLevel))) return 'Severity must be 1, 2, or 3.';
    if (form.capaRequired && !form.capaReason?.trim() && Number(form.severityLevel) !== 3) {
      // For S3, CAPA reason can be optional, but recommended. For others, if user toggles CAPA, require a reason.
      return 'CAPA reason is required when CAPA is set to Yes.';
    }
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast(err);

    setSaving(true);
    try {
      await complaintService.createComplaint({
        complaint_date: form.complaint_date,
        productId: form.productId || null,
        batchId: form.batchId || null,
        categoryId: form.categoryId,
        guidanceRuleId: form.guidanceRuleId || null,
        riskType: form.riskType,
        severityLevel: Number(form.severityLevel),
        capaRequired: !!form.capaRequired,
        capaReason: form.capaRequired ? (form.capaReason?.trim() || null) : null,
        source: form.source,
        customer_name: form.customer_name?.trim() || null,
        notes: form.notes?.trim() || null
      });

      toast('Complaint saved.');
      // reset minimal
      setForm(prev => ({
        ...prev,
        productId: '',
        batchId: '',
        categoryId: '',
        guidanceRuleId: '',
        riskType: 'QUALITY',
        severityLevel: 1,
        capaRequired: false,
        capaReason: '',
        customer_name: '',
        notes: '',
      }));
      setBatchQuery('');
      setBatchSuggestions([]);
    } catch (e) {
      console.error(e);
      toast('Error saving complaint.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="m-0">New Complaint</h2>
        <Link to="/trends/complaints" className="btn btn-outline-secondary">
        Back to Trends
        </Link>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label">Complaint Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.complaint_date}
                  onChange={(e) => setForm(p => ({ ...p, complaint_date: e.target.value }))}
                  required
                />
              </div>

              <div className="col-12 col-md-5">
                <label className="form-label">Product (optional)</label>
                <select
                  className="form-select"
                  value={form.productId}
                  onChange={(e) => setForm(p => ({ ...p, productId: e.target.value }))}
                >
                  <option value="">All / Not specified</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedProductLabel && (
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    Selected: {selectedProductLabel}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4 position-relative">
                <label className="form-label">Batch (optional, by Lot Code)</label>
                <input
                  className="form-control"
                  value={batchQuery}
                  onChange={(e) => {
                    setBatchQuery(e.target.value);
                    setForm(p => ({ ...p, batchId: '' }));
                  }}
                  placeholder="Type lot code (e.g., A-125...)"
                />
                {batchLoading && (
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    Searching…
                  </div>
                )}
                {batchSuggestions.length > 0 && (
                  <ul
                    className="list-group position-absolute w-100 mt-1"
                    style={{ zIndex: 1000, maxHeight: 220, overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  >
                    {batchSuggestions.map(b => (
                      <li
                        key={b.id}
                        className="list-group-item"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={() => onPickBatch(b)}
                      >
                        <div style={{ fontWeight: 600 }}>{b.lotCode}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          Production: {b.production_date || 'N/A'} • Batch #{b.id}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Category (required)</label>
                <select
                  className="form-select"
                  value={form.categoryId}
                  onChange={(e) => setForm(p => ({
                    ...p,
                    categoryId: e.target.value,
                    guidanceRuleId: '',
                    // reset derived fields until a rule is chosen
                    riskType: 'QUALITY',
                    severityLevel: 1,
                    capaRequired: false,
                    capaReason: ''
                  }))}
                  required
                >
                  <option value="">Select…</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-8">
                <label className="form-label">Guidance Rule (optional)</label>
                <select
                  className="form-select"
                  value={form.guidanceRuleId}
                  onChange={(e) => setForm(p => ({ ...p, guidanceRuleId: e.target.value }))}
                  disabled={!form.categoryId}
                >
                  <option value="">None</option>
                  {rules.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.label} — Risk: {r.riskType} — Sev: {r.alwaysSeverity3 ? '3' : r.severityLevel}
                    </option>
                  ))}
                </select>
                {!form.categoryId && (
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    Select a Category first to see rules.
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Risk Type</label>
                <select
                  className="form-select"
                  value={form.riskType}
                  onChange={(e) => setForm(p => ({ ...p, riskType: e.target.value }))}
                >
                  <option value="QUALITY">Quality</option>
                  <option value="FOOD_SAFETY_REGULATORY">Food Safety / Regulatory</option>
                </select>
              </div>

              <div className="col-6 col-md-2">
                <label className="form-label">Severity</label>
                <select
                  className="form-select"
                  value={form.severityLevel}
                  onChange={(e) => setForm(p => ({ ...p, severityLevel: e.target.value }))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label">CAPA Required</label>
                <select
                  className="form-select"
                  value={form.capaRequired ? 'YES' : 'NO'}
                  onChange={(e) => setForm(p => ({ ...p, capaRequired: e.target.value === 'YES' }))}
                  disabled={Number(form.severityLevel) === 3}
                >
                  <option value="NO">No</option>
                  <option value="YES">Yes</option>
                </select>
                {Number(form.severityLevel) === 3 && (
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    Severity 3 forces CAPA = Yes.
                  </div>
                )}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label">Source</label>
                <select
                  className="form-select"
                  value={form.source}
                  onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))}
                >
                  {SOURCE_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Customer Name (optional)</label>
                <input
                  className="form-control"
                  value={form.customer_name}
                  onChange={(e) => setForm(p => ({ ...p, customer_name: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">CAPA Reason (if needed)</label>
                <input
                  className="form-control"
                  value={form.capaReason}
                  onChange={(e) => setForm(p => ({ ...p, capaReason: e.target.value }))}
                  placeholder={Number(form.severityLevel) === 3 ? 'Recommended for Severity 3' : 'Required only if CAPA = Yes'}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Details of the complaint (what happened, evidence, photos, etc.)"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Complaint'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
