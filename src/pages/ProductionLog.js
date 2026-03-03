// pages/ProductionLog.js

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import logService from '../services/logService';
import bakingCcpService from '../services/bakingCcpService';
import ProductionTrendChart from '../components/ProductionTrendChart';
import { usePermissions } from '../context/PermissionContext';

function ProductionLog() {
  const { hasModule } = usePermissions();
  const canViewSQF = hasModule('ccp.baking.qa');

  const [logs, setLogs] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ccpRun, setCcpRun] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0); // eslint-disable-line no-unused-vars

  // Effective filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Input state for the filter form
  const [inputSearch, setInputSearch] = useState('');
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'production_date',
    direction: 'desc',
  });

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await logService.getLogs(currentPage, 50, searchTerm, startDate, endDate);
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotalLogs(data.totalLogs);
      } catch (error) {
        console.error('Error loading logs:', error);
      }
    };
    loadLogs();
  }, [currentPage, searchTerm, startDate, endDate]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(inputSearch);
    setStartDate(inputStartDate);
    setEndDate(inputEndDate);
    setCurrentPage(1);
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setCcpRun(null);
    logService
      .getIngredientsByLotCode(log.batchId)
      .then((data) => setIngredients(data))
      .catch((err) => console.error('Error fetching ingredients:', err));
    if (canViewSQF && log.batchId) {
      bakingCcpService.getRunForBatch(log.batchId)
        .then((run) => setCcpRun(run || null))
        .catch(() => setCcpRun(null));
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLog(null);
    setIngredients([]);
    setCcpRun(null);
    setIsModalOpen(false);
  };

  // ── Ingredient deduplication ──────────────────────────────────────────────
  // The DB stores one row per (ingredientId, lotCode). When a run goes through
  // the live baking flow, a MISSING placeholder is created first, then an
  // ENTERED row is added by QA. We want to show:
  //   • All ENTERED and EXCLUDED rows (these have real data)
  //   • MISSING rows ONLY if that ingredient has no ENTERED/EXCLUDED sibling
  //     (i.e. the lot code was genuinely never filled in)
  // This preserves the multiple-lot-codes-per-ingredient feature while hiding
  // the redundant placeholder rows.
  const displayIngredients = useMemo(() => {
    if (!ingredients.length) return [];

    // Find which ingredientIds have at least one non-MISSING row
    const resolvedIds = new Set(
      ingredients
        .filter(i => i.status !== 'MISSING')
        .map(i => i.ingredientId)
    );

    return ingredients.filter(i => {
      if (i.status !== 'MISSING') return true;          // always show ENTERED / EXCLUDED
      return !resolvedIds.has(i.ingredientId);           // only show MISSING if no resolved sibling
    });
  }, [ingredients]);

  // ── Sorting ───────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const sortedLogs = useMemo(() => {
    const clone = [...logs];
    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    return clone.sort((a, b) => {
      let aVal, bVal;
      switch (key) {
        case 'product':
          aVal = (a.Product?.name || '').toLowerCase();
          bVal = (b.Product?.name || '').toLowerCase();
          break;
        case 'quantity':
          aVal = Number(a.quantity) || 0;
          bVal = Number(b.quantity) || 0;
          break;
        case 'date_logged':
          aVal = a.date_logged ? new Date(a.date_logged).getTime() : 0;
          bVal = b.date_logged ? new Date(b.date_logged).getTime() : 0;
          break;
        case 'production_date':
          aVal = a.Batch?.production_date ? new Date(a.Batch.production_date).getTime() : 0;
          bVal = b.Batch?.production_date ? new Date(b.Batch.production_date).getTime() : 0;
          break;
        default:
          aVal = 0; bVal = 0;
      }
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [logs, sortConfig]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatQty = (ing) => {
    if (ing.quantityInput == null) return '—';
    const n = Number(ing.quantityInput);
    const uom = ing.uomInput || '';
    return `${Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'} ${uom}`.trim();
  };

  const statusBadge = (status) => {
    const map = { ENTERED: 'success', MISSING: 'danger', EXCLUDED: 'secondary' };
    return (
      <span className={`badge bg-${map[status] || 'secondary'}`} style={{ fontSize: 11 }}>
        {status}
      </span>
    );
  };

  // Count how many ingredients are still MISSING after dedup
  const missingCount = useMemo(
    () => displayIngredients.filter(i => i.status === 'MISSING').length,
    [displayIngredients]
  );

  return (
    <div className="container mt-5">
      <h2 className="text-center">Production Log</h2>

      {/* Analytics */}
      <ProductionTrendChart />

      {/* Filter Form */}
      <form onSubmit={handleFilterSubmit} className="mt-4 mb-4">
        <div className="row align-items-end">
          <div className="col-md-4">
            <label htmlFor="searchInput">Search by Lot Code or Product</label>
            <input
              id="searchInput"
              type="text"
              className="form-control"
              placeholder="Enter search term"
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="startDateInput">Start Date</label>
            <input
              id="startDateInput"
              type="date"
              className="form-control"
              value={inputStartDate}
              onChange={(e) => setInputStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="endDateInput">End Date</label>
            <input
              id="endDateInput"
              type="date"
              className="form-control"
              value={inputEndDate}
              onChange={(e) => setInputEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary">Search</button>
          </div>
        </div>
      </form>

      {/* Logs Table */}
      <table className="table table-bordered table-responsive-sm">
        <thead>
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('product')}>
              Product{getSortArrow('product')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('quantity')}>
              Quantity{getSortArrow('quantity')}
            </th>
            <th>Lot Code</th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('date_logged')}>
              Date Logged{getSortArrow('date_logged')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('production_date')}>
              Production Date{getSortArrow('production_date')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedLogs.map((log) => (
            <tr key={log.id} onClick={() => handleRowClick(log)} style={{ cursor: 'pointer' }}>
              <td>{log.Product?.name || 'Unknown Product'}</td>
              <td>{log.quantity}</td>
              <td>{log.Batch?.lotCode || 'N/A'}</td>
              <td>{new Date(log.date_logged).toLocaleString()}</td>
              <td>{log.Batch?.production_date || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center my-3">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          &laquo; Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage >= totalPages}
        >
          Next &raquo;
        </button>
      </div>

      {/* Ingredients Modal */}
      {isModalOpen && selectedLog && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="modal-dialog modal-lg"
            role="document"
            style={{ marginTop: '80px' }}
          >
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#1b2638', color: 'white' }}>
                <div>
                  <h5 className="modal-title mb-0">
                    Ingredients — Lot Code: <strong>{selectedLog.Batch?.lotCode || 'N/A'}</strong>
                  </h5>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                    {selectedLog.Product?.name} · Production: {selectedLog.Batch?.production_date || '—'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  style={{ filter: 'invert(1)' }}
                  onClick={closeModal}
                />
              </div>

              <div className="modal-body p-0">
                {displayIngredients.length === 0 ? (
                  <div className="p-4 text-muted">No ingredients found for this batch.</div>
                ) : (
                  <>
                    {/* Missing ingredients warning */}
                    {missingCount > 0 && (
                      <div className="alert alert-warning rounded-0 mb-0" style={{ fontSize: 13 }}>
                        ⚠ <strong>{missingCount} ingredient{missingCount > 1 ? 's' : ''}</strong> {missingCount > 1 ? 'are' : 'is'} missing a lot code.
                      </div>
                    )}

                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ paddingLeft: 16 }}>Ingredient</th>
                            <th>Lot Code</th>
                            <th>Quantity Used</th>
                            <th style={{ width: 100 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayIngredients.map((ing) => (
                            <tr key={ing.id}>
                              <td style={{ paddingLeft: 16, fontWeight: 600 }}>
                                {ing.Ingredient?.name || `Ingredient #${ing.ingredientId}`}
                              </td>
                              <td>
                                {ing.ingredientLotCode
                                  ? <code style={{ fontSize: 13 }}>{ing.ingredientLotCode}</code>
                                  : <span className="text-danger" style={{ fontSize: 12 }}>Not recorded</span>
                                }
                              </td>
                              <td style={{ fontSize: 13 }}>{formatQty(ing)}</td>
                              <td>{statusBadge(ing.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary footer */}
                    <div className="px-3 py-2 border-top d-flex gap-3" style={{ fontSize: 12, color: '#6c757d' }}>
                      <span>{displayIngredients.filter(i => i.status === 'ENTERED').length} entered</span>
                      {missingCount > 0 && <span className="text-danger">{missingCount} missing</span>}
                      {displayIngredients.filter(i => i.status === 'EXCLUDED').length > 0 && (
                        <span>{displayIngredients.filter(i => i.status === 'EXCLUDED').length} excluded</span>
                      )}
                      <span className="ms-auto">
                        {displayIngredients.length} ingredient{displayIngredients.length !== 1 ? 's' : ''} total
                      </span>
                    </div>
                  </>
                )}
              </div>

              {canViewSQF && (
                <div className="modal-footer">
                  {ccpRun ? (
                    <Link
                      to={`/ccp/baking/verify/${ccpRun.id}`}
                      className="btn btn-outline-primary btn-sm"
                      onClick={closeModal}
                    >
                      View SQF Report
                    </Link>
                  ) : (
                    <button className="btn btn-outline-secondary btn-sm" disabled title="No CCP run found for this batch">
                      View SQF Report
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={closeModal}>Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductionLog;