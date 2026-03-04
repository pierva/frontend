import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const WRITEOFF_REASONS = ['Promotion', 'Direct Sale', 'Sampling', 'Waste', 'Correction', 'Other'];

// --- lot helpers (pure) ---
const isArchived = (lot) => lot.closedAt != null || lot.quantity === 0;
const isNegative = (lot) => lot.quantity < 0;

const getLotStatus = (lot) => {
  if (isArchived(lot)) return 'archived';
  if (isNegative(lot)) return 'negative';
  if (lot.quantity <= 5) return 'low';
  return 'active';
};

const STATUS_BADGE = {
  active: { label: 'Active', cls: 'bg-success' },
  low: { label: 'Low', cls: 'bg-warning text-dark' },
  negative: { label: 'Negative', cls: 'bg-danger' },
  archived: { label: 'Archived', cls: 'bg-secondary' },
};

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

function StatusBadge({ lot }) {
  const { label, cls } = STATUS_BADGE[getLotStatus(lot)];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [activeAction, setActiveAction] = useState(null); // { productId, lotCode, type }
  const [actionForm, setActionForm] = useState({});

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory(data);
      setExpandedProducts(new Set(data.map((p) => p.productId)));
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  // --- stats (from unfiltered data) ---
  const stats = useMemo(() => {
    let activeLots = 0;
    let productsWithNeg = 0;
    let closedThisMonth = 0;
    const thisMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    inventory.forEach((product) => {
      let hasNeg = false;
      product.lots.forEach((lot) => {
        if (isNegative(lot)) hasNeg = true;
        if (!isArchived(lot) && !isNegative(lot)) activeLots++;
        if (lot.closedAt && lot.closedAt.startsWith(thisMonth)) closedThisMonth++;
      });
      if (hasNeg) productsWithNeg++;
    });

    return { activeLots, productsWithNeg, closedThisMonth };
  }, [inventory]);

  // --- filtered view ---
  const filteredInventory = useMemo(() => {
    return inventory
      .map((product) => {
        // `product.lots` here is the original unfiltered array
        let lots = product.lots;

        if (!showArchived) lots = lots.filter((l) => !isArchived(l));

        if (statusFilter === 'Active') {
          lots = lots.filter((l) => !isNegative(l));
        } else if (statusFilter === 'Issues') {
          lots = lots.filter((l) => isNegative(l));
        }

        const q = searchTerm.trim().toLowerCase();
        if (q) {
          const nameMatch = product.name.toLowerCase().includes(q);
          if (!nameMatch) lots = lots.filter((l) => l.lotCode.toLowerCase().includes(q));
        }

        return {
          ...product,
          lots,
          hasAnyNegative: product.lots.some((l) => isNegative(l)),
        };
      })
      .filter((p) => p.lots.length > 0);
  }, [inventory, searchTerm, statusFilter, showArchived]);

  // --- expand / collapse ---
  const toggleProduct = (productId) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      next.has(productId) ? next.delete(productId) : next.add(productId);
      return next;
    });
  };

  // --- inline action helpers ---
  const openAction = (productId, lotCode, type, extra = {}) => {
    setActiveAction({ productId, lotCode, type });
    setActionForm({ writeoffQty: '', reason: '', note: '', adjustQty: '', ...extra });
  };

  const closeAction = () => {
    setActiveAction(null);
    setActionForm({});
  };

  const patchLotInState = (productId, lotCode, patch) => {
    setInventory((prev) =>
      prev.map((p) => {
        if (p.productId !== productId) return p;
        return {
          ...p,
          lots: p.lots.map((l) => (l.lotCode !== lotCode ? l : { ...l, ...patch })),
        };
      })
    );
  };

  const handleConfirmAdjust = async () => {
    const { productId, lotCode } = activeAction;
    const newQuantity = Number(actionForm.adjustQty);
    if (isNaN(newQuantity)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/inventory/adjust`,
        { productId, lotCode, newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      patchLotInState(productId, lotCode, { quantity: newQuantity });
      closeAction();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmWriteoff = async () => {
    const { productId, lotCode } = activeAction;
    if (!actionForm.reason || !actionForm.writeoffQty) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/api/inventory/writeoff`,
        {
          productId,
          lotCode,
          writeoffQty: Number(actionForm.writeoffQty),
          reason: actionForm.reason,
          note: actionForm.note,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      patchLotInState(productId, lotCode, {
        quantity: data.newQuantity,
        reason: actionForm.reason,
        note: actionForm.note,
      });
      closeAction();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmClose = async () => {
    const { productId, lotCode } = activeAction;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/inventory/adjust`,
        { productId, lotCode, newQuantity: 0, closedAt: today },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      patchLotInState(productId, lotCode, { quantity: 0, closedAt: today });
      closeAction();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="container mt-5"><p>Loading inventory…</p></div>;
  }

  return (
    <div className="container-fluid mt-4" style={{ maxWidth: 1100 }}>
      <h4 className="mb-4">Inventory</h4>

      {/* Summary strip */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        <div className="card text-center px-4 py-2">
          <div className="fs-4 fw-bold">{stats.activeLots}</div>
          <div className="text-muted small">Active lots</div>
        </div>
        <div
          className={`card text-center px-4 py-2 ${stats.productsWithNeg > 0 ? 'border-danger' : ''}`}
          style={{ cursor: stats.productsWithNeg > 0 ? 'pointer' : 'default' }}
          onClick={() =>
            stats.productsWithNeg > 0 &&
            setStatusFilter((prev) => (prev === 'Issues' ? 'All' : 'Issues'))
          }
          title={stats.productsWithNeg > 0 ? 'Click to filter by issues' : ''}
        >
          <div className={`fs-4 fw-bold ${stats.productsWithNeg > 0 ? 'text-danger' : ''}`}>
            {stats.productsWithNeg}
          </div>
          <div className="text-muted small">Products w/ negatives</div>
        </div>
        <div className="card text-center px-4 py-2">
          <div className="fs-4 fw-bold">{stats.closedThisMonth}</div>
          <div className="text-muted small">Lots closed this month</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="d-flex gap-2 align-items-center mb-3 flex-wrap">
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="Search product or lot code…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="btn-group">
          {['All', 'Active', 'Issues'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${statusFilter === f ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="form-check form-switch mb-0 ms-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="showArchived"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="showArchived">
            Show archived
          </label>
        </div>
      </div>

      {filteredInventory.length === 0 && (
        <p className="text-muted">No inventory matches your filters.</p>
      )}

      {/* Product cards */}
      {filteredInventory.map((product) => {
        const expanded = expandedProducts.has(product.productId);
        const totalQty = product.lots.reduce((s, l) => s + l.quantity, 0);
        const activeLotCount = product.lots.filter((l) => !isArchived(l)).length;
        const negCount = product.lots.filter((l) => isNegative(l)).length;

        return (
          <div key={product.productId} className="card mb-3 shadow-sm">
            {/* Header */}
            <div
              className={`card-header d-flex align-items-center justify-content-between py-2 ${
                product.hasAnyNegative ? 'bg-danger bg-opacity-10' : 'bg-white'
              }`}
              style={{ cursor: 'pointer' }}
              onClick={() => toggleProduct(product.productId)}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {expanded ? '▼' : '▶'}
                </span>
                <strong>{product.name}</strong>
                {product.hasAnyNegative && (
                  <span className="badge bg-danger ms-1">
                    ⚠ {negCount} negative
                  </span>
                )}
              </div>
              <div className="d-flex gap-3 text-muted small">
                <span>
                  Total: <strong className="text-dark">{totalQty}</strong> units
                </span>
                <span>
                  {activeLotCount} active lot{activeLotCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Lot table */}
            {expanded && (
              <div className="card-body p-0">
                <table className="table table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Lot Code</th>
                      <th>Produced</th>
                      <th>Age</th>
                      <th>Available</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.lots.map((lot) => {
                      const lotActive =
                        activeAction?.productId === product.productId &&
                        activeAction?.lotCode === lot.lotCode;
                      const archived = isArchived(lot);
                      const negative = isNegative(lot);
                      const age = daysSince(lot.productionDate);

                      return (
                        <React.Fragment key={lot.lotCode}>
                          {/* Main lot row */}
                          <tr
                            className={
                              negative ? 'table-danger' : archived ? 'opacity-50' : ''
                            }
                          >
                            <td className="align-middle">
                              <code>{lot.lotCode}</code>
                            </td>
                            <td className="align-middle text-muted small">
                              {lot.productionDate || '—'}
                            </td>
                            <td className="align-middle text-muted small">
                              {age != null ? `${age}d` : '—'}
                            </td>
                            <td className="align-middle fw-semibold">{lot.quantity}</td>
                            <td className="align-middle">
                              <StatusBadge lot={lot} />
                            </td>
                            <td className="align-middle">
                              {!archived ? (
                                <div className="d-flex gap-1">
                                  <button
                                    className={`btn btn-sm ${
                                      lotActive && activeAction.type === 'writeoff'
                                        ? 'btn-warning'
                                        : 'btn-outline-warning'
                                    }`}
                                    onClick={() =>
                                      lotActive && activeAction.type === 'writeoff'
                                        ? closeAction()
                                        : openAction(product.productId, lot.lotCode, 'writeoff')
                                    }
                                  >
                                    Write Off
                                  </button>
                                  <button
                                    className={`btn btn-sm ${
                                      lotActive && activeAction.type === 'adjust'
                                        ? 'btn-primary'
                                        : 'btn-outline-primary'
                                    }`}
                                    onClick={() => {
                                      if (lotActive && activeAction.type === 'adjust') {
                                        closeAction();
                                      } else {
                                        openAction(product.productId, lot.lotCode, 'adjust', {
                                          adjustQty: String(lot.quantity),
                                        });
                                      }
                                    }}
                                  >
                                    Adjust
                                  </button>
                                  <button
                                    className={`btn btn-sm ${
                                      lotActive && activeAction.type === 'close'
                                        ? 'btn-secondary'
                                        : 'btn-outline-secondary'
                                    }`}
                                    onClick={() =>
                                      lotActive && activeAction.type === 'close'
                                        ? closeAction()
                                        : openAction(product.productId, lot.lotCode, 'close')
                                    }
                                  >
                                    Close
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted small">
                                  {lot.reason || (lot.closedAt ? `Closed ${lot.closedAt}` : 'Archived')}
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Write Off inline form */}
                          {lotActive && activeAction.type === 'writeoff' && (
                            <tr>
                              <td colSpan={6} className="bg-warning bg-opacity-10 p-3">
                                <div className="row g-2 align-items-end">
                                  <div className="col-auto">
                                    <label className="form-label small mb-1 fw-semibold">
                                      Qty to write off *
                                    </label>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      style={{ width: 110 }}
                                      min={1}
                                      value={actionForm.writeoffQty}
                                      onChange={(e) =>
                                        setActionForm((f) => ({ ...f, writeoffQty: e.target.value }))
                                      }
                                      autoFocus
                                    />
                                  </div>
                                  <div className="col-auto">
                                    <label className="form-label small mb-1 fw-semibold">
                                      Reason *
                                    </label>
                                    <select
                                      className="form-select form-select-sm"
                                      style={{ minWidth: 170 }}
                                      value={actionForm.reason}
                                      onChange={(e) =>
                                        setActionForm((f) => ({ ...f, reason: e.target.value }))
                                      }
                                    >
                                      <option value="">Select reason…</option>
                                      {WRITEOFF_REASONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="col">
                                    <label className="form-label small mb-1 fw-semibold">
                                      Note (optional)
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={actionForm.note}
                                      onChange={(e) =>
                                        setActionForm((f) => ({ ...f, note: e.target.value }))
                                      }
                                    />
                                  </div>
                                  <div className="col-auto">
                                    <button
                                      className="btn btn-warning btn-sm me-1"
                                      disabled={!actionForm.writeoffQty || !actionForm.reason}
                                      onClick={handleConfirmWriteoff}
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={closeAction}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Adjust inline form */}
                          {lotActive && activeAction.type === 'adjust' && (
                            <tr>
                              <td colSpan={6} className="bg-primary bg-opacity-10 p-3">
                                <div className="d-flex align-items-center gap-2">
                                  <label className="small fw-semibold mb-0">
                                    Set exact remaining quantity:
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    style={{ width: 110 }}
                                    value={actionForm.adjustQty}
                                    onChange={(e) =>
                                      setActionForm((f) => ({ ...f, adjustQty: e.target.value }))
                                    }
                                    autoFocus
                                  />
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleConfirmAdjust}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={closeAction}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Close inline confirmation */}
                          {lotActive && activeAction.type === 'close' && (
                            <tr>
                              <td colSpan={6} className="bg-secondary bg-opacity-10 p-3">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="small">
                                    Close lot <code>{lot.lotCode}</code>? Quantity will be set to 0 and the lot archived.
                                  </span>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleConfirmClose}
                                  >
                                    Confirm Close
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={closeAction}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default InventoryPage;
