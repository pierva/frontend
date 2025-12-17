// src/components/complaints/ComplaintGuidanceRulesManager.js
import React, { useEffect, useMemo, useState } from 'react';
import complaintService from '../../services/complaintService';

const RISK_TYPES = [
  { value: 'QUALITY', label: 'Quality' },
  { value: 'FOOD_SAFETY_REGULATORY', label: 'Food Safety / Regulatory' }
];

export default function ComplaintGuidanceRulesManager() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    categoryId: '',
    label: '',
    riskType: 'QUALITY',
    severityLevel: 1,
    alwaysSeverity3: false,
    isActive: true,
    sortOrder: 0
  });

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ ...form });

  const toast = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  };

  const loadCategories = async () => {
    const cats = await complaintService.getCategories();
    setCategories(cats || []);
    // Default selection for convenience
    if (!selectedCategoryId && cats?.length) {
      setSelectedCategoryId(String(cats[0].id));
    }
  };

  const loadRules = async (categoryId = '') => {
    setLoading(true);
    try {
      const data = await complaintService.getGuidanceRules(categoryId);
      setRules(data || []);
    } catch (e) {
      console.error(e);
      setRules([]);
      toast('Error loading guidance rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadCategories();
      } catch (e) {
        console.error(e);
        toast('Error loading categories.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRules(selectedCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const activeCount = useMemo(() => rules.filter(r => r.isActive).length, [rules]);

  const onCreate = async (e) => {
    e.preventDefault();

    const payload = {
      categoryId: form.categoryId || selectedCategoryId,
      label: form.label.trim(),
      riskType: form.riskType,
      severityLevel: Number(form.severityLevel),
      alwaysSeverity3: !!form.alwaysSeverity3,
      isActive: !!form.isActive,
      sortOrder: Number(form.sortOrder) || 0
    };

    if (!payload.categoryId) return toast('Select a category first.');
    if (!payload.label) return toast('Rule label is required.');

    try {
      await complaintService.createGuidanceRule(payload);
      toast('Guidance rule created.');
      setForm(f => ({ ...f, label: '', severityLevel: 1, alwaysSeverity3: false, sortOrder: 0, isActive: true }));
      await loadRules(selectedCategoryId);
    } catch (e) {
      console.error(e);
      toast('Error creating guidance rule.');
    }
  };

  const beginEdit = (rule) => {
    setEditId(rule.id);
    setEditForm({
      categoryId: String(rule.categoryId),
      label: rule.label || '',
      riskType: rule.riskType || 'QUALITY',
      severityLevel: rule.severityLevel ?? 1,
      alwaysSeverity3: !!rule.alwaysSeverity3,
      isActive: !!rule.isActive,
      sortOrder: rule.sortOrder ?? 0
    });
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = async () => {
    if (!editForm.label.trim()) return toast('Rule label is required.');
    try {
      await complaintService.updateGuidanceRule(editId, {
        categoryId: editForm.categoryId,
        label: editForm.label.trim(),
        riskType: editForm.riskType,
        severityLevel: Number(editForm.severityLevel),
        alwaysSeverity3: !!editForm.alwaysSeverity3,
        isActive: !!editForm.isActive,
        sortOrder: Number(editForm.sortOrder) || 0
      });
      toast('Guidance rule updated.');
      setEditId(null);
      await loadRules(selectedCategoryId);
    } catch (e) {
      console.error(e);
      toast('Error updating guidance rule.');
    }
  };

  const riskTypeLabel = (val) => RISK_TYPES.find(r => r.value === val)?.label || val;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <div style={{ fontWeight: 700 }}>Guidance Rules</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {rules.length} total • {activeCount} active
            </div>
          </div>
          <button className="btn btn-sm btn-outline-primary" onClick={() => loadRules(selectedCategoryId)} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {msg && <div className="alert alert-info mt-3 py-2">{msg}</div>}

        {/* Category selector */}
        <div className="mt-3">
          <label className="form-label mb-1">Category scope</label>
          <select
            className="form-select"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            disabled={categories.length === 0}
          >
            {categories.length === 0 ? (
              <option value="">No categories yet</option>
            ) : (
              categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isActive ? '' : '(inactive)'}
                </option>
              ))
            )}
          </select>
          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
            Tip: create Categories first.
          </div>
        </div>

        {/* Create */}
        <form onSubmit={onCreate} className="mt-3">
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <label className="form-label mb-1">Rule label</label>
              <input
                className="form-control"
                value={form.label}
                onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g., Seal failure (always severity 3)"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label mb-1">Risk type</label>
              <select
                className="form-select"
                value={form.riskType}
                onChange={(e) => setForm(f => ({ ...f, riskType: e.target.value }))}
              >
                {RISK_TYPES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label mb-1">Severity</label>
              <select
                className="form-select"
                value={form.severityLevel}
                onChange={(e) => setForm(f => ({ ...f, severityLevel: e.target.value }))}
              >
                <option value={1}>1 – Low</option>
                <option value={2}>2 – Medium</option>
                <option value={3}>3 – High</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label mb-1">Sort</label>
              <input
                type="number"
                className="form-control"
                value={form.sortOrder}
                onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>

            <div className="col-12 col-md-6 d-flex align-items-end gap-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.alwaysSeverity3}
                  onChange={(e) => setForm(f => ({ ...f, alwaysSeverity3: e.target.checked }))}
                  id="alwaysS3"
                />
                <label className="form-check-label" htmlFor="alwaysS3">
                  Always Severity 3
                </label>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  id="ruleActive"
                />
                <label className="form-check-label" htmlFor="ruleActive">
                  Active
                </label>
              </div>
            </div>
          </div>

          <button className="btn btn-primary w-100 mt-2" type="submit" disabled={!selectedCategoryId && categories.length > 0}>
            Add Guidance Rule
          </button>
        </form>

        {/* List */}
        <hr />
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Rule</th>
                <th style={{ width: 170 }}>Risk</th>
                <th style={{ width: 90 }}>Severity</th>
                <th style={{ width: 70 }}>Sort</th>
                <th style={{ width: 90 }}>Active</th>
                <th style={{ width: 150 }}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td>
                    {editId === r.id ? (
                      <input
                        className="form-control form-control-sm"
                        value={editForm.label}
                        onChange={(e) => setEditForm(f => ({ ...f, label: e.target.value }))}
                      />
                    ) : (
                      <>
                        <div style={{ fontWeight: 600 }}>{r.label}</div>
                        {r.alwaysSeverity3 ? (
                          <div className="text-muted" style={{ fontSize: 12 }}>Always Severity 3</div>
                        ) : null}
                      </>
                    )}
                  </td>

                  <td>
                    {editId === r.id ? (
                      <select
                        className="form-select form-select-sm"
                        value={editForm.riskType}
                        onChange={(e) => setEditForm(f => ({ ...f, riskType: e.target.value }))}
                      >
                        {RISK_TYPES.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                      </select>
                    ) : (
                      <span className="text-muted">{riskTypeLabel(r.riskType)}</span>
                    )}
                  </td>

                  <td>
                    {editId === r.id ? (
                      <select
                        className="form-select form-select-sm"
                        value={editForm.severityLevel}
                        onChange={(e) => setEditForm(f => ({ ...f, severityLevel: e.target.value }))}
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </select>
                    ) : (
                      <span className={`badge ${Number(r.severityLevel) === 3 ? 'bg-danger' : Number(r.severityLevel) === 2 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {r.severityLevel}
                      </span>
                    )}
                  </td>

                  <td>
                    {editId === r.id ? (
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={editForm.sortOrder}
                        onChange={(e) => setEditForm(f => ({ ...f, sortOrder: e.target.value }))}
                      />
                    ) : (
                      <span className="text-muted">{r.sortOrder ?? 0}</span>
                    )}
                  </td>

                  <td>
                    {editId === r.id ? (
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                      />
                    ) : (
                      <span className={`badge ${r.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {r.isActive ? 'Yes' : 'No'}
                      </span>
                    )}
                  </td>

                  <td className="text-end">
                    {editId === r.id ? (
                      <div className="btn-group">
                        <button className="btn btn-sm btn-primary" type="button" onClick={saveEdit}>Save</button>
                        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={cancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => beginEdit(r)}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {rules.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted">
                    No rules for this category yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
