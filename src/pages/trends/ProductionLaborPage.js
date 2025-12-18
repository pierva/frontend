// src/pages/trends/ProductionLaborPage.js

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import laborService from '../../services/laborService';

function monthLabel(dateOnly) {
  if (!dateOnly) return '—';
  // expects YYYY-MM-01
  return String(dateOnly).slice(0, 7);
}

export default function ProductionLaborPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // simple entry form (upsert by month)
  const [form, setForm] = useState({
    month: '',         // YYYY-MM
    laborCost: '',
    laborHours: '',
    employeeCount: '',
    notes: '',         // remove if you don't add notes to model
  });

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await laborService.listMonthly();
      setRows(data || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const onEdit = (r) => {
    setForm({
      month: monthLabel(r.month), // YYYY-MM
      laborCost: r.laborCost ?? '',
      laborHours: r.laborHours ?? '',
      employeeCount: r.employeeCount ?? '',
      notes: r.notes ?? '', // remove if not using notes
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSave = async () => {
    try {
      await laborService.upsertMonthly({
        month: form.month,
        laborCost: form.laborCost,
        laborHours: form.laborHours,
        employeeCount: form.employeeCount,
        notes: form.notes, // remove if not using notes
      });
      await fetchRows();
      // keep month, reset numeric fields
      setForm(f => ({ ...f, laborCost: '', laborHours: '', employeeCount: '', notes: '' }));
    } catch (e) {
      console.error(e);
      alert('Error saving labor month. Check month format and values.');
    }
  };

  const onDelete = async (r) => {
    const m = monthLabel(r.month); // YYYY-MM
    const ok = window.confirm(`Delete labor snapshot for ${m}?`);
    if (!ok) return;
    try {
      await laborService.deleteMonthly(m);
      await fetchRows();
    } catch (e) {
      console.error(e);
      alert('Error deleting month.');
    }
  };

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => String(b.month).localeCompare(String(a.month)));
  }, [rows]);

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="mb-0">Labor Info (Monthly)</h4>
          <div className="d-flex gap-2">
            <Link to="/trends/production" className="btn btn-outline-secondary">Back</Link>
            <button className="btn btn-outline-primary" onClick={fetchRows} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Entry Form */}
        <div className="card mt-3">
          <div className="card-body">
            <div className="row g-2">
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Month (YYYY-MM)</label>
                <input
                  type="month"
                  className="form-control"
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Total salaries paid</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.laborCost}
                  onChange={e => setForm(f => ({ ...f, laborCost: e.target.value }))}
                  placeholder="e.g. 28500"
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Total hours</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.laborHours}
                  onChange={e => setForm(f => ({ ...f, laborHours: e.target.value }))}
                  placeholder="e.g. 1320"
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Total employees</label>
                <input
                  type="number"
                  step="1"
                  className="form-control"
                  value={form.employeeCount}
                  onChange={e => setForm(f => ({ ...f, employeeCount: e.target.value }))}
                  placeholder="e.g. 12"
                />
              </div>

              {/* Notes (optional) */}
              <div className="col-12">
                <label className="form-label mb-1">Notes (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional context (bonus payroll, hiring spike, etc.)"
                />
              </div>

              <div className="col-12 d-flex justify-content-end gap-2">
                <button className="btn btn-primary" onClick={onSave}>
                  Save Month
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div style={{ fontWeight: 600 }}>Monthly Labor Records</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? 'Loading…' : `${sorted.length} record(s)`}
              </div>
            </div>

            <div className="table-responsive mt-2">
              <table className="table table-sm table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Salaries</th>
                    <th>Total Hours</th>
                    <th>Total Employees</th>
                    <th className="d-none d-lg-table-cell">Notes</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan={6} className="text-muted">No labor snapshots yet.</td></tr>
                  ) : (
                    sorted.map((r) => (
                      <tr key={r.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{monthLabel(r.month)}</td>
                        <td>${Number(r.laborCost || 0).toLocaleString()}</td>
                        <td>{r.laborHours == null ? '—' : Number(r.laborHours).toLocaleString()}</td>
                        <td>{r.employeeCount == null ? '—' : Number(r.employeeCount).toLocaleString()}</td>
                        <td className="d-none d-lg-table-cell">{r.notes || '—'}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(r)}>
                              Edit
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(r)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-muted" style={{ fontSize: 12 }}>
              Tip: enter one row per month. Production KPIs will update automatically on the Production Trends page.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
