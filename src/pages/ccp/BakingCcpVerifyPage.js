// src/pages/ccp/BakingCcpVerifyPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import bakingCcpService from '../../services/bakingCcpService';
import ingredientService from '../../services/ingredientService';

export default function BakingCcpVerifyPage() {
  const { runId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable QA fields
  const [productTotals, setProductTotals] = useState([]);
  const [deviation, setDeviation] = useState(false);
  const [deviationNotes, setDeviationNotes] = useState('');
  const [correctiveNotes, setCorrectiveNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ingredient lot codes
  const [ingredients, setIngredients] = useState([]);
  const [loadedBatchId, setLoadedBatchId] = useState(null); // authoritative batchId for ingredient ops
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [savingIngredients, setSavingIngredients] = useState(false);
  const [ingredientsSaved, setIngredientsSaved] = useState(false);
  const [newRow, setNewRow] = useState({ ingredientId: '', ingredientLotCode: '', quantityInput: '', uomInput: 'lb' });
  const [allIngredients, setAllIngredients] = useState([]);

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchRun = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bakingCcpService.getRun(runId);
      const r = res?.run || null;
      setRun(r);
      if (r) {
        seedEditableFields(r);
        if (r.batchId) fetchIngredients(r.batchId);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load run.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async (batchId) => {
    setLoadingIngredients(true);
    try {
      const res = await bakingCcpService.getBatchIngredients(batchId);
      setLoadedBatchId(batchId); // lock in the batchId we actually fetched
      setIngredients(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to load ingredients', e);
      setIngredients([]);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const seedEditableFields = (r) => {
    // Product totals: prefer productTotalsJson, fall back to computing from carts
    if (Array.isArray(r.productTotalsJson) && r.productTotalsJson.length > 0) {
      setProductTotals(r.productTotalsJson.map(x => ({ ...x })));
    } else {
      // Compute from carts that have been blasted out
      const totalsMap = new Map();
      (r.Carts || []).forEach(c => {
        if (!c.blastOutAt) return;
        const pid = Number(c.productId);
        const name = c.Product?.name || `Product #${pid}`;
        const units = Number(c.unitsInCart) || 0;
        if (totalsMap.has(pid)) {
          totalsMap.get(pid).units += units;
        } else {
          totalsMap.set(pid, { productId: pid, name, units });
        }
      });
      setProductTotals(Array.from(totalsMap.values()));
    }

    setDeviation(!!r.deviation);
    setDeviationNotes(r.deviationNotes || '');
    setCorrectiveNotes(r.correctiveActionNotes || '');
    setNotes(r.notes || r.packagingNotes || '');
  };

  useEffect(() => {
    fetchRun();
    ingredientService.getIngredients()
      .then(data => setAllIngredients(Array.isArray(data) ? data : []))
      .catch(() => setAllIngredients([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const editedTotal = useMemo(() => {
    return productTotals.reduce((sum, r) => {
      const n = Number(r.units);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [productTotals]);

  const isLocked = run?.isLocked || run?.status === 'VERIFIED';

  const toKg = (qty, uom) => {
    const n = Number(qty);
    if (!Number.isFinite(n) || n < 0) return null;
    return uom === 'kg' ? n : n * 0.45359237;
  };

  const saveIngredients = async () => {
    setSavingIngredients(true);
    setError('');
    try {
      const payload = ingredients.map(ing => {
        const uom = ing.uomInput || 'lb';
        const qInput = ing.quantityInput != null ? Number(ing.quantityInput) : null;
        const qKg = (qInput != null && Number.isFinite(qInput) && qInput > 0) ? toKg(qInput, uom) : null;
        const lot = (ing.ingredientLotCode || '').trim();
        let status = 'MISSING';
        if (lot) status = (qKg != null && qKg > 0) ? 'ENTERED' : 'EXCLUDED';
        return {
          id: ing.id,
          ingredientLotCode: lot || null,
          quantityInput: qInput,
          uomInput: uom,
          quantityKg: qKg,
          status,
        };
      });
      const targetBatchId = loadedBatchId ?? run?.batchId;
      if (!targetBatchId) throw new Error('Batch ID not available. Please reload the page.');
      await bakingCcpService.updateBatchIngredients(targetBatchId, payload);
      await fetchIngredients(targetBatchId);
      setIngredientsSaved(true);
      setTimeout(() => setIngredientsSaved(false), 2500);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to save ingredients.');
    } finally {
      setSavingIngredients(false);
    }
  };

  const addIngredientRow = async () => {
    if (!newRow.ingredientId) return;
    const targetBatchId = loadedBatchId ?? run?.batchId;
    if (!targetBatchId) return;

    const uom = newRow.uomInput || 'lb';
    const qInput = newRow.quantityInput !== '' ? Number(newRow.quantityInput) : null;
    const qKg = (qInput != null && Number.isFinite(qInput) && qInput > 0) ? toKg(qInput, uom) : null;
    const lot = (newRow.ingredientLotCode || '').trim();
    const status = lot ? (qKg != null ? 'ENTERED' : 'EXCLUDED') : 'MISSING';

    // Find the ingredient name from the run's product ingredient list
    const existingMatch = ingredients.find(i => Number(i.ingredientId) === Number(newRow.ingredientId));
    const ingredientName = existingMatch?.Ingredient?.name || `Ingredient #${newRow.ingredientId}`;

    try {
      setSavingIngredients(true);
      const res = await bakingCcpService.addBatchIngredient(targetBatchId, {
        ingredientId: Number(newRow.ingredientId),
        ingredientLotCode: lot || null,
        quantityInput: qInput,
        uomInput: uom,
        quantityKg: qKg,
        status,
      });
      // Refresh from server
      await fetchIngredients(targetBatchId);
      setNewRow({ ingredientId: '', ingredientLotCode: '', quantityInput: '', uomInput: 'lb' });
      setIngredientsSaved(false);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add ingredient.');
    } finally {
      setSavingIngredients(false);
    }
  };

  const removeIngredientRow = async (ing) => {
    const targetBatchId = loadedBatchId ?? run?.batchId;
    if (!targetBatchId) return;
    if (!window.confirm(`Remove ${ing.Ingredient?.name || 'this ingredient'}${ing.ingredientLotCode ? ` (${ing.ingredientLotCode})` : ''} from this batch?`)) return;
    try {
      setSavingIngredients(true);
      await bakingCcpService.deleteBatchIngredient(targetBatchId, ing.id);
      await fetchIngredients(targetBatchId);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to remove ingredient.');
    } finally {
      setSavingIngredients(false);
    }
  };

  const doVerify = async () => {
    setShowConfirm(false);
    setError('');
    setSubmitting(true);
    try {
      await bakingCcpService.verifyAndLog(runId, {
        productTotals,
        notes,
        deviation,
        deviationNotes,
        correctiveActionNotes: correctiveNotes,
      });
      setSuccessMsg('Run verified and production log created successfully.');
      // Refresh navbar QA badge count
      window.dispatchEvent(new Event('productionStatusChanged'));
      setTimeout(() => navigate('/ccp/baking/queue'), 1800);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || 'Failed to verify run.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDate = (d) => {
    if (!d) return '—';
    // Plain YYYY-MM-DD strings are parsed as UTC midnight by new Date(), which
    // rolls back one day in negative-offset timezones. Appending T00:00:00
    // forces the date to be interpreted in local time instead.
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00` : d;
    return new Date(normalized).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const carts = useMemo(() => {
    return [...(run?.Carts || [])].sort((a, b) => (a.cartNumber || 0) - (b.cartNumber || 0));
  }, [run]);

  const tempReadings = useMemo(() => {
    return [...(run?.TempReadings || [])].sort((a, b) => new Date(a.readingAt) - new Date(b.readingAt));
  }, [run]);

  const packagingAnswers = useMemo(() => {
    const q = run?.packagingAnswersJson;
    return Array.isArray(q) ? q : [];
  }, [run]);

  if (loading) return (
    <div className="container mt-4 text-center text-muted py-5">
      <div className="spinner-border spinner-border-sm me-2" /> Loading run…
    </div>
  );

  if (!run && !loading) return (
    <div className="container mt-4">
      <div className="alert alert-danger">Run not found.</div>
      <Link className="btn btn-outline-secondary" to="/ccp/baking/queue">← Back to Queue</Link>
    </div>
  );

  return (
    <>
    <style>{`
      @media print {
        /* Hide everything by default */
        body * { visibility: hidden; }

        /* Show only the report content */
        .sqf-report, .sqf-report * { visibility: visible; }
        .sqf-report { position: absolute; top: 0; left: 0; width: 100%; }

        /* Hide interactive / nav elements even inside the report */
        .no-print { display: none !important; }

        /* Typography & layout */
        .sqf-report { font-size: 11pt; font-family: Arial, sans-serif; }
        .sqf-report h3 { font-size: 15pt; margin-bottom: 2pt; }
        .sqf-report h6 { font-size: 10pt; text-transform: uppercase;
                         letter-spacing: 0.05em; color: #555; margin-bottom: 6pt; }
        .sqf-report .card { border: 1px solid #ccc !important;
                            page-break-inside: avoid; margin-bottom: 10pt; }
        .sqf-report .card-body { padding: 8pt 10pt; }
        .sqf-report table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        .sqf-report th, .sqf-report td { border: 1px solid #ddd;
                                          padding: 3pt 5pt; text-align: left; }
        .sqf-report th { background: #f5f5f5; font-weight: bold; }
        .sqf-report .badge { border: 1px solid #999; padding: 1pt 4pt;
                              font-size: 9pt; background: transparent !important;
                              color: #000 !important; }

        /* Print header with company + report title */
        .print-header { display: block !important; }

        /* Page breaks */
        .page-break-before { page-break-before: always; }

        /* Two-column layout collapses to single column */
        .row { display: block !important; }
        .col-12, .col-lg-6 { width: 100% !important; max-width: 100% !important;
                              display: block !important; }

        /* Ensure status badge colours render in print */
        .bg-success { background-color: #d4edda !important; }
        .bg-danger  { background-color: #f8d7da !important; }
        .bg-warning { background-color: #fff3cd !important; }
        .bg-secondary { background-color: #e2e3e5 !important; }
      }

      /* Force full paper width — override Bootstrap container */
      .sqf-report.container,
      .sqf-report.container-sm,
      .sqf-report.container-md,
      .sqf-report.container-lg,
      .sqf-report.container-xl,
      .sqf-report.container-xxl {
        max-width: 100% !important;
        width: 100% !important;
        padding-left: 12pt !important;
        padding-right: 12pt !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      /* Print header hidden on screen */
      .print-header { display: none; }
    `}</style>
    <div className="container mt-4 pb-5 sqf-report">

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <Link className="text-muted no-print" style={{ fontSize: 13 }} to="/ccp/baking/queue">
            ← Back to Queue
          </Link>
          <h3 className="mb-0 mt-1">
            QA Review — {run.Batch?.lotCode || `Batch #${run.batchId}`}
          </h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {run.Product?.name} · Production date: {formatDate(run.Batch?.production_date)}
          </div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {isLocked && (
            <>
              <span className="badge bg-success" style={{ fontSize: 13, padding: '8px 12px' }}>
                ✓ VERIFIED
              </span>
              <button
                className="btn btn-outline-secondary btn-sm no-print"
                onClick={() => window.print()}
                title="Print or save as PDF"
              >
                🖨 Print / Export PDF
              </button>
            </>
          )}
          {!isLocked && (
            <span className="badge bg-warning text-dark" style={{ fontSize: 13, padding: '8px 12px' }}>
              PENDING VERIFICATION
            </span>
          )}
        </div>
      </div>

      {/* Print-only header */}
      <div className="print-header mb-3 pb-2" style={{ borderBottom: '2px solid #1b2638' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#1b2638' }}>PIZZACINI — SQF Baking CCP Record</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
              Lot: {run?.Batch?.lotCode || '—'} &nbsp;|&nbsp;
              FG Lot: {run?.finishedGoodsLotCode || '—'} &nbsp;|&nbsp;
              Prod. Date: {formatDate(run?.Batch?.production_date)}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#555' }}>
            <div>Verified: {formatDateTime(run?.verifiedAt)}</div>
            <div>By: {run?.VerifiedBy?.username || '—'}</div>
            <div style={{ marginTop: 4, fontWeight: 700, color: '#155724' }}>✓ VERIFIED &amp; LOCKED</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger no-print">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="row g-3">

        {/* ── Run summary card ── */}
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-3">Run Summary</h6>
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: 160 }}>Status</td>
                    <td><strong>{run.status}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Lot Code</td>
                    <td><strong>{run.Batch?.lotCode || '—'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">FG Lot Code</td>
                    <td>{run.finishedGoodsLotCode || '—'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Prod. Date</td>
                    <td>{formatDate(run.Batch?.production_date)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Baking Started</td>
                    <td>{formatDateTime(run.bakingStartedAt)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Baking Stopped</td>
                    <td>{formatDateTime(run.bakingStoppedAt)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Oven Temp (start)</td>
                    <td><strong>{run.ovenTempStartF ? `${run.ovenTempStartF}°F` : '—'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Completed At</td>
                    <td>{formatDateTime(run.completedAt)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Completed By</td>
                    <td>{run.CompletedBy?.username || '—'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Record Owner</td>
                    <td>{run.RecordOwner?.username || '—'}</td>
                  </tr>
                  {isLocked && (
                    <>
                      <tr>
                        <td className="text-muted">Verified At</td>
                        <td>{formatDateTime(run.verifiedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Verified By</td>
                        <td><strong className="text-success">{run.VerifiedBy?.username || '—'}</strong></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Temperature readings card ── */}
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-3">
                Temperature Readings ({tempReadings.length})
              </h6>
              {tempReadings.length === 0 ? (
                <div className="text-muted" style={{ fontSize: 13 }}>No readings recorded.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Time</th>
                        <th>Temp (°F)</th>
                        <th>Cart</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempReadings.map((t, idx) => (
                        <tr key={t.id}>
                          <td>{idx + 1}</td>
                          <td style={{ fontSize: 12 }}>
                            {new Date(t.readingAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td><strong>{t.tempF}°F</strong></td>
                          <td>{t.cartId ? `#${t.cartId}` : '—'}</td>
                          <td style={{ fontSize: 11 }} className="text-muted">{t.readingType || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Carts card ── */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title text-muted mb-3">
                Carts ({carts.length})
              </h6>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Cart</th>
                      <th>Product</th>
                      <th>Units</th>
                      <th>Oven Out</th>
                      <th>Blast In</th>
                      <th>Blast Out</th>
                      <th>Freezer Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carts.length === 0 ? (
                      <tr><td colSpan={7} className="text-muted">No carts recorded.</td></tr>
                    ) : carts.map(c => {
                      const blastIn = c.blastInAt ? new Date(c.blastInAt) : null;
                      const blastOut = c.blastOutAt ? new Date(c.blastOutAt) : null;
                      const freezerMins = blastIn && blastOut
                        ? Math.round((blastOut - blastIn) / 60000)
                        : null;
                      const prodName = c.Product?.name || `Product #${c.productId}`;
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 900 }}>#{c.cartNumber}</td>
                          <td>{prodName}</td>
                          <td>{c.unitsInCart ?? '—'}</td>
                          <td style={{ fontSize: 12 }}>
                            {c.ovenOutAt ? new Date(c.ovenOutAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {blastIn ? blastIn.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : (
                              <span className="badge bg-danger">Missing</span>
                            )}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {blastOut ? blastOut.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : (
                              <span className="badge bg-danger">Missing</span>
                            )}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {freezerMins != null ? `${freezerMins} min` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ingredient Lot Codes ── */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="card-title text-muted mb-0">Ingredient Lot Codes</h6>
                  {!isLocked && (
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      Review and complete all ingredient lot codes and quantities before verifying.
                    </div>
                  )}
                </div>
                {!isLocked && (
                  <button
                    className={`btn btn-sm ${ingredientsSaved ? 'btn-success' : 'btn-outline-primary'}`}
                    onClick={saveIngredients}
                    disabled={savingIngredients || loadingIngredients}
                    style={{ minWidth: 120 }}
                  >
                    {savingIngredients ? 'Saving…' : ingredientsSaved ? '✓ Saved' : 'Save Changes'}
                  </button>
                )}
              </div>

              {loadingIngredients ? (
                <div className="text-muted" style={{ fontSize: 13 }}>
                  <span className="spinner-border spinner-border-sm me-2" />Loading ingredients…
                </div>
              ) : (
                <>
                  {/* Table — shown when there are rows, empty state otherwise */}
                  {ingredients.length === 0 ? (
                    <div className={`alert mb-3 ${isLocked ? 'alert-secondary' : 'alert-warning'}`} style={{ fontSize: 13 }}>
                      {isLocked
                        ? 'No ingredients were recorded for this batch.'
                        : '⚠ No ingredients yet. Use the form below to add them.'}
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ minWidth: 160 }}>Ingredient</th>
                              <th style={{ minWidth: 180 }}>Lot Code</th>
                              <th style={{ minWidth: 110 }}>Quantity</th>
                              <th style={{ width: 80 }}>Unit</th>
                              <th style={{ width: 100 }}>Status</th>
                              {!isLocked && <th style={{ width: 50 }}></th>}
                            </tr>
                          </thead>
                          <tbody>
                            {ingredients.map((ing, idx) => {
                              const statusColor = { ENTERED: 'success', MISSING: 'danger', EXCLUDED: 'secondary' };
                              return (
                                <tr key={ing.id}>
                                  <td style={{ fontWeight: 700 }}>
                                    {ing.Ingredient?.name || `Ingredient #${ing.ingredientId}`}
                                  </td>
                                  <td>
                                    {isLocked ? (
                                      <span className={!ing.ingredientLotCode ? 'text-danger' : ''}>
                                        {ing.ingredientLotCode || '—'}
                                      </span>
                                    ) : (
                                      <input
                                        type="text"
                                        className={`form-control form-control-sm ${!ing.ingredientLotCode ? 'border-danger' : ''}`}
                                        value={ing.ingredientLotCode || ''}
                                        placeholder="Enter lot code"
                                        onChange={e => {
                                          const val = e.target.value;
                                          setIngredients(prev => prev.map((x, i) =>
                                            i === idx ? { ...x, ingredientLotCode: val } : x
                                          ));
                                          setIngredientsSaved(false);
                                        }}
                                      />
                                    )}
                                  </td>
                                  <td>
                                    {isLocked ? (
                                      <span>{ing.quantityInput != null ? ing.quantityInput : '—'} {ing.uomInput || ''}</span>
                                    ) : (
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        value={ing.quantityInput != null ? ing.quantityInput : ''}
                                        min={0}
                                        step="0.01"
                                        placeholder="0"
                                        onChange={e => {
                                          const val = e.target.value === '' ? null : e.target.value;
                                          setIngredients(prev => prev.map((x, i) =>
                                            i === idx ? { ...x, quantityInput: val } : x
                                          ));
                                          setIngredientsSaved(false);
                                        }}
                                      />
                                    )}
                                  </td>
                                  <td>
                                    {isLocked ? (
                                      <span>{ing.uomInput || '—'}</span>
                                    ) : (
                                      <select
                                        className="form-select form-select-sm"
                                        value={ing.uomInput || 'lb'}
                                        onChange={e => {
                                          const val = e.target.value;
                                          setIngredients(prev => prev.map((x, i) =>
                                            i === idx ? { ...x, uomInput: val } : x
                                          ));
                                          setIngredientsSaved(false);
                                        }}
                                      >
                                        <option value="lb">lb</option>
                                        <option value="kg">kg</option>
                                      </select>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`badge bg-${statusColor[ing.status] || 'secondary'}`}>
                                      {ing.status}
                                    </span>
                                  </td>
                                  {!isLocked && (
                                    <td>
                                      <button
                                        className="btn btn-outline-danger btn-sm"
                                        style={{ padding: '1px 7px', fontSize: 16, lineHeight: 1 }}
                                        onClick={() => removeIngredientRow(ing)}
                                        disabled={savingIngredients}
                                        title="Remove this ingredient row"
                                      >
                                        ×
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary badges */}
                      <div className="d-flex gap-2 mt-3 flex-wrap">
                        {['ENTERED', 'MISSING', 'EXCLUDED'].map(s => {
                          const count = ingredients.filter(i => i.status === s).length;
                          if (count === 0) return null;
                          const color = { ENTERED: 'success', MISSING: 'danger', EXCLUDED: 'secondary' };
                          return (
                            <span key={s} className={`badge bg-${color[s]}`} style={{ fontSize: 12 }}>
                              {count} {s}
                            </span>
                          );
                        })}
                      </div>

                      {/* Missing warning */}
                      {!isLocked && ingredients.some(i => i.status === 'MISSING') && (
                        <div className="alert alert-warning mt-3 mb-0" style={{ fontSize: 13 }}>
                          ⚠ <strong>{ingredients.filter(i => i.status === 'MISSING').length} ingredient(s)</strong> still have a missing lot code.
                          You can still verify, but missing ingredients will be flagged in the record.
                        </div>
                      )}
                    </>
                  )}

                  {/* Add ingredient row — always visible when not locked */}
                  {!isLocked && (
                    <div className={`${ingredients.length > 0 ? 'border-top mt-3' : ''} pt-3`}>
                      <div style={{ fontWeight: 700, fontSize: 13 }} className="mb-2">Add Ingredient</div>
                      <div className="row g-2 align-items-end">
                        <div className="col-12 col-md-3">
                          <select
                            className="form-select form-select-sm"
                            value={newRow.ingredientId}
                            onChange={e => setNewRow(r => ({ ...r, ingredientId: e.target.value }))}
                          >
                            <option value="">Select ingredient…</option>
                            {allIngredients.map(i => (
                              <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12 col-md-3">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Lot code"
                            value={newRow.ingredientLotCode}
                            onChange={e => setNewRow(r => ({ ...r, ingredientLotCode: e.target.value }))}
                          />
                        </div>
                        <div className="col-6 col-md-2">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Qty"
                            min={0}
                            step="0.01"
                            value={newRow.quantityInput}
                            onChange={e => setNewRow(r => ({ ...r, quantityInput: e.target.value }))}
                          />
                        </div>
                        <div className="col-3 col-md-1">
                          <select
                            className="form-select form-select-sm"
                            value={newRow.uomInput}
                            onChange={e => setNewRow(r => ({ ...r, uomInput: e.target.value }))}
                          >
                            <option value="lb">lb</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                        <div className="col-3 col-md-2">
                          <button
                            className="btn btn-primary btn-sm w-100"
                            onClick={addIngredientRow}
                            disabled={!newRow.ingredientId || savingIngredients}
                          >
                            {savingIngredients ? '…' : '+ Add'}
                          </button>
                        </div>
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                        You can add the same ingredient multiple times with different lot codes.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Packaging checklist answers ── */}
        {packagingAnswers.length > 0 && (
          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title text-muted mb-3">Packaging Checklist</h6>
                {packagingAnswers.map((a, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-start border-bottom py-2" style={{ fontSize: 13 }}>
                    <span>{a.question}</span>
                    <span className="ms-3" style={{ minWidth: 60, textAlign: 'right', fontWeight: 700 }}>
                      {a.type === 'CHECK'
                        ? (a.value === true ? <span className="text-success">✓ Yes</span> : <span className="text-danger">✗ No</span>)
                        : String(a.value ?? '—')
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Editable QA fields ── */}
        <div className={`col-12 ${packagingAnswers.length > 0 ? 'col-lg-6' : ''}`}>
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted mb-3">
                Production Quantities
                {!isLocked && <span className="text-muted ms-2" style={{ fontSize: 11, fontWeight: 400 }}>Editable before verification</span>}
              </h6>

              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: 160 }}>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {productTotals.length === 0 ? (
                    <tr><td colSpan={2} className="text-muted">No product totals recorded.</td></tr>
                  ) : (
                    <>
                      {productTotals.map((r, idx) => (
                        <tr key={r.productId}>
                          <td style={{ fontWeight: 700 }}>{r.name}</td>
                          <td>
                            {isLocked ? (
                              <span style={{ fontWeight: 900 }}>{r.units}</span>
                            ) : (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={r.units}
                                min={0}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setProductTotals(prev =>
                                    prev.map((x, i) => i === idx ? { ...x, units: val } : x)
                                  );
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ fontWeight: 900 }}>TOTAL</td>
                        <td style={{ fontWeight: 900 }}>{editedTotal}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Deviation & notes ── */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title text-muted mb-3">Deviation & Notes</h6>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="qaDeviation"
                  checked={deviation}
                  onChange={e => setDeviation(e.target.checked)}
                  disabled={isLocked}
                />
                <label className="form-check-label" htmlFor="qaDeviation">
                  Deviation occurred
                </label>
              </div>

              {deviation && (
                <div className="row g-2 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label mb-1">Deviation Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={deviationNotes}
                      onChange={e => setDeviationNotes(e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label mb-1">Corrective Action Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={correctiveNotes}
                      onChange={e => setCorrectiveNotes(e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="form-label mb-1">QA Notes (optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={isLocked}
                  placeholder="Any additional observations from QA review…"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Verify button ── */}
        {!isLocked && (
          <div className="col-12">
            <div className="card border-success">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>Ready to verify?</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      This will lock the run and create the production log entries. This action cannot be undone.
                    </div>
                    {editedTotal === 0 && (
                      <div className="text-danger mt-1" style={{ fontSize: 13 }}>
                        ⚠ Total units is 0 — review product quantities before verifying.
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-success btn-lg"
                    style={{ fontWeight: 900, minWidth: 180 }}
                    onClick={() => setShowConfirm(true)}
                    disabled={submitting || editedTotal === 0}
                  >
                    {submitting ? 'Verifying…' : 'VERIFY & LOCK'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>{/* end row */}

      {/* ── Confirm modal ── */}
      {showConfirm && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Verification</h5>
                <button className="btn-close" onClick={() => setShowConfirm(false)} />
              </div>
              <div className="modal-body">
                <p>You are about to verify and lock batch <strong>{run.Batch?.lotCode}</strong>.</p>
                <p>This will:</p>
                <ul>
                  <li>Lock the run permanently (no further edits)</li>
                  <li>Create production log entries for <strong>{editedTotal} total units</strong></li>
                </ul>
                {deviation && (
                  <div className="alert alert-warning" style={{ fontSize: 13 }}>
                    ⚠ This batch has a <strong>deviation</strong> recorded. Make sure notes are complete.
                  </div>
                )}
                <p className="mb-0 text-muted" style={{ fontSize: 13 }}>This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setShowConfirm(false)} disabled={submitting}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={doVerify} disabled={submitting}>
                  {submitting ? 'Verifying…' : 'Confirm & Verify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}