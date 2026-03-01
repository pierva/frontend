// src/pages/ccp/BakingCcpQueuePage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bakingCcpService from '../../services/bakingCcpService';

export default function BakingCcpQueuePage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('COMPLETED');

  const fetchRuns = async (status) => {
    setLoading(true);
    setError('');
    try {
      const res = await bakingCcpService.getRuns(status);
      setRuns(Array.isArray(res.runs) ? res.runs : []);
    } catch (e) {
      console.error(e);
      setError('Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns(statusFilter);
  }, [statusFilter]);

  const statusBadge = (status) => {
    const map = {
      COMPLETED: 'warning',
      VERIFIED: 'success',
      BAKING: 'primary',
      BAKING_PAUSED: 'secondary',
      BAKING_STOPPED: 'danger',
    };
    return <span className={`badge bg-${map[status] || 'secondary'}`}>{status}</span>;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00` : d;
    return new Date(normalized).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h3 className="mb-0">QA Review Queue</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Baking CCP runs pending verification and production log creation.
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/ccp/baking/start">
            Baking Start
          </Link>
          <button
            className="btn btn-outline-primary"
            onClick={() => fetchRuns(statusFilter)}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="d-flex gap-2 mb-3">
        {['COMPLETED', 'VERIFIED', 'COMPLETED,VERIFIED'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'COMPLETED,VERIFIED' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && runs.length === 0 && (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <div style={{ fontSize: 48 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700 }} className="mt-2">Queue is empty</div>
            <div style={{ fontSize: 13 }} className="mt-1">
              No runs with status <strong>{statusFilter}</strong>.
            </div>
          </div>
        </div>
      )}

      {runs.length > 0 && (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 140 }}>Lot Code</th>
                    <th style={{ width: 120 }}>Prod. Date</th>
                    <th>Product</th>
                    <th style={{ width: 130 }}>Status</th>
                    <th style={{ width: 160 }}>Completed</th>
                    <th style={{ width: 160 }}>Completed By</th>
                    <th style={{ width: 160 }}>Verified By</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(run => (
                    <tr key={run.id}>
                      <td>
                        <span style={{ fontWeight: 900, fontSize: 15 }}>
                          {run.Batch?.lotCode || `Batch #${run.batchId}`}
                        </span>
                        {run.deviation && (
                          <span className="badge bg-danger ms-2" style={{ fontSize: 10 }}>DEV</span>
                        )}
                      </td>
                      <td>{formatDate(run.Batch?.production_date)}</td>
                      <td>{run.Product?.name || '—'}</td>
                      <td>{statusBadge(run.status)}</td>
                      <td style={{ fontSize: 13 }}>{formatDateTime(run.completedAt)}</td>
                      <td style={{ fontSize: 13 }}>{run.CompletedBy?.username || '—'}</td>
                      <td style={{ fontSize: 13 }}>
                        {run.VerifiedBy?.username
                          ? <span className="text-success">{run.VerifiedBy.username}</span>
                          : <span className="text-muted">Pending</span>
                        }
                      </td>
                      <td>
                        <Link
                          className={`btn btn-sm ${run.status === 'COMPLETED' ? 'btn-warning' : 'btn-outline-secondary'}`}
                          to={`/ccp/baking/verify/${run.id}`}
                          style={{ fontWeight: 700 }}
                        >
                          {run.status === 'COMPLETED' ? 'Review' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center text-muted py-5">
          <div className="spinner-border spinner-border-sm me-2" />
          Loading…
        </div>
      )}
    </div>
  );
}