// src/pages/trends/ComplaintTrendsPage.js
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import analyticsService from '../../services/analyticsService';
import logService from '../../services/logService';
import complaintService from '../../services/complaintService';
import TrendLineChart from '../../components/charts/TrendLineChart';
import TrendBarChart from '../../components/charts/TrendBarChart';


export default function ComplaintTrendsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [guidanceRules, setGuidanceRules] = useState([]);

    const [sort, setSort] = useState({ key: 'complaint_date', dir: 'desc' }); // default
    const [page, setPage] = useState(1);
    const pageSize = 25;
    const [widgetConfig, setWidgetConfig] = useState(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        productId: '',
        categoryId: '',
        severityLevel: '',
        granularity: 'day',
    });

    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        complaint_date: '',
        productId: '',
        batchId: '',
        categoryId: '',
        guidanceRuleId: '',
        riskType: '',
        severityLevel: '',
        capaRequired: false,
        capaReason: '',
        source: 'CUSTOMER',
        customer_name: '',
        notes: ''
    });


    const openComplaint = (c) => {
        setSelectedComplaint(c);
        setIsModalOpen(true);
        setIsEditing(false);

        setEditForm({
            complaint_date: c.complaint_date || '',
            severityLevel: c.severityLevel ? String(c.severityLevel) : '',
            categoryId: c.categoryId ? String(c.categoryId) : '',
            productId: c.productId ? String(c.productId) : '',
            batchId: c.batchId ? String(c.batchId) : '',
            guidanceRuleId: c.guidanceRuleId ? String(c.guidanceRuleId) : '',
            riskType: c.riskType || '',
            capaRequired: !!c.capaRequired,
            capaReason: c.capaReason || '',
            source: c.source || 'CUSTOMER',
            customer_name: c.customer_name || '',
            notes: c.notes || '',
        });
    };

    const toNull = (v) => (v === '' || v === undefined ? null : v);
    const toIntOrNull = (v) => {
        if (v === '' || v === null || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    const saveEdit = async () => {
        if (!selectedComplaint) return;

        try {
            const payload = {
                complaint_date: editForm.complaint_date || null,
                productId: toIntOrNull(editForm.productId),
                batchId: toIntOrNull(editForm.batchId),
                categoryId: toIntOrNull(editForm.categoryId),          // likely required
                guidanceRuleId: toIntOrNull(editForm.guidanceRuleId),  // FIX
                riskType: toNull(editForm.riskType),
                severityLevel: toIntOrNull(editForm.severityLevel),
                capaRequired: !!editForm.capaRequired,
                capaReason: editForm.capaRequired ? (editForm.capaReason || null) : null,
                source: toNull(editForm.source) || 'CUSTOMER',
                customer_name: toNull(editForm.customer_name),
                notes: toNull(editForm.notes),
            };

            const updated = await complaintService.updateComplaint(selectedComplaint.id, payload);

            setSelectedComplaint((prev) => ({ ...prev, ...updated }));
            setIsEditing(false);
            fetchWidget();
        } catch (e) {
            console.error(e);
            alert('Error saving complaint.');
        }
    };

    const confirmDelete = async () => {
        if (!selectedComplaint) return;
        const ok = window.confirm(`Delete complaint #${selectedComplaint.id}? This cannot be undone.`);
        if (!ok) return;

        try {
            await complaintService.deleteComplaint(selectedComplaint.id);
            closeComplaint();
            fetchWidget(); // refresh KPIs/charts
            // If you have a list of complaints loaded on this page, also remove it from state here.
        } catch (e) {
            console.error(e);
            alert('Error deleting complaint.');
        }
    };

    const closeComplaint = () => {
        setSelectedComplaint(null);
        setIsModalOpen(false);
    };

    const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : '—');

    const [loading, setLoading] = useState(false);
    const [widget, setWidget] = useState(null);
    const lineRef = useRef(null);
    const barRef = useRef(null);

    const SEVERITY_COLORS = {
        1: '#2ecc71', // green
        2: '#f2c94c', // yellow
        3: '#eb5757', // red
    };

    const CATEGORY_PALETTE = [
        '#2f80ed', '#56ccf2', '#9b51e0', '#27ae60',
        '#f2994a', '#eb5757', '#f2c94c', '#6fcf97',
        '#bb6bd9', '#219653'
    ];

    const severityBadgeStyle = (lvl) => ({
        backgroundColor: SEVERITY_COLORS[lvl] || '#adb5bd',
        color: '#fff',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
    });

    const COMPLAINTS_PER_10K_THRESHOLDS = {
        greenMax: 1.0,   // < 1.0 / 10k
        amberMax: 2.0    // 1.0–2.0 / 10k, >2.0 red
    };

    function getComplaintsPer10kStatus(value) {
        const v = Number(value);
        if (!Number.isFinite(v)) return { label: '—', color: '#6c757d' }; // grey
        if (v < COMPLAINTS_PER_10K_THRESHOLDS.greenMax) return { label: 'Green', color: '#198754' };
        if (v <= COMPLAINTS_PER_10K_THRESHOLDS.amberMax) return { label: 'Warning', color: '#fd7e14' };
        return { label: 'Action', color: '#dc3545' };
    }


    useEffect(() => {
        (async () => {
            try {
                const prods = await logService.getProducts();
                setProducts(prods || []);

                const cats = await complaintService.getCategories();
                setCategories(cats || []);

                const rules = await complaintService.getGuidanceRules();
                setGuidanceRules(rules || []);

                const cfgRes = await analyticsService.getWidgetConfig('complaints.summary');
                setWidgetConfig(cfgRes?.config || null)
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    useEffect(() => {
        return () => {
            if (lineRef.current) {
                lineRef.current.destroy();
                lineRef.current = null;
            }
            if (barRef.current) {
                barRef.current.destroy();
                barRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const fetchComplaints = async () => {
            setListLoading(true);
            try {
                const rows = await complaintService.getComplaints({
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    productId: filters.productId,
                    categoryId: filters.categoryId,
                    severityLevel: filters.severityLevel,
                });
                setComplaints(rows || []);
                setPage(1); // reset page when filters change
            } catch (e) {
                console.error('Error loading complaints list', e);
                setComplaints([]);
            } finally {
                setListLoading(false);
            }
        };

        fetchComplaints();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.startDate, filters.endDate, filters.productId, filters.categoryId, filters.severityLevel]);

    const sortedComplaints = useMemo(() => {
        const rows = [...complaints];

        const getVal = (c) => {
            switch (sort.key) {
                case 'complaint_date': return c.complaint_date || '';
                case 'product': return c.Product?.name || '';
                case 'category': return c.Category?.name || '';
                case 'severity': return Number(c.severityLevel || 0);
                case 'riskType': return c.riskType || '';
                case 'capaRequired': return c.capaRequired ? 1 : 0;
                case 'lotCode': return c.Batch?.lotCode || '';
                default: return '';
            }
        };

        rows.sort((a, b) => {
            const va = getVal(a);
            const vb = getVal(b);

            if (typeof va === 'number' && typeof vb === 'number') {
                return sort.dir === 'asc' ? va - vb : vb - va;
            }
            return sort.dir === 'asc'
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });

        return rows;
    }, [complaints, sort]);

    const totalPages = Math.max(1, Math.ceil(sortedComplaints.length / pageSize));

    const pageRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedComplaints.slice(start, start + pageSize);
    }, [sortedComplaints, page]);

    const header = (label, key) => {
        const active = sort.key === key;
        const arrow = active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';
        return (
            <span
                role="button"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() =>
                    setSort((s) => ({
                        key,
                        dir: s.key === key ? (s.dir === 'asc' ? 'desc' : 'asc') : 'asc',
                    }))
                }
            >
                {label}{arrow}
            </span>
        );
    };

    const fetchWidget = async () => {
        setLoading(true);
        try {
            const data = await analyticsService.getComplaintsSummary({
                ...filters
            });;
            setWidget(data);
        } catch (e) {
            console.error(e);
            setWidget(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWidget();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.startDate, filters.endDate, filters.productId, filters.categoryId, filters.severityLevel]);

    const kpis = widget?.kpis;
    const complaintsRate = kpis?.complaintsPer10k;
    const complaintsRateStatus = getComplaintsPer10kStatus(complaintsRate);
    const complaintsPer10k = Number(widget?.kpis?.complaintsPer10k ?? 0);

const thresholds = widgetConfig?.thresholds?.complaintsPer10k || { greenMax: 1, amberMax: 2 };

const getThresholdStatus = (value) => {
  const g = Number(thresholds.greenMax);
  const a = Number(thresholds.amberMax);

  if (Number.isFinite(g) && value <= g) return 'green';
  if (Number.isFinite(a) && value <= a) return 'amber';
  return 'red';
};

const status = getThresholdStatus(complaintsPer10k);

const statusColor = status === 'green'
  ? '#27ae60'
  : status === 'amber'
  ? '#f2994a'
  : '#eb5757';


    return (
        <div className="card">
            <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <h4 className="mb-0">Complaint Trends</h4>
                    <div className="d-flex gap-2">
                        <Link to="/trends/complaints/config" className="btn btn-outline-secondary">
                            Configuration
                        </Link>
                        <Link to="/trends/complaints/new" className="btn btn-outline-primary">
                            New Complaint
                        </Link>
                        <button className="btn btn-outline-primary" onClick={fetchWidget} disabled={loading}>
                            {loading ? 'Loading…' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="row mt-3 g-2">
                    <div className="col-12 col-sm-4">
                        <label className="form-label mb-1">Start Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.startDate}
                            onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                        />
                    </div>
                    <div className="col-12 col-sm-4">
                        <label className="form-label mb-1">End Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.endDate}
                            onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                        />
                    </div>
                    <div className="col-12 col-sm-4">
                        <label className="form-label mb-1">Product</label>
                        <select
                            className="form-select"
                            value={filters.productId}
                            onChange={e => setFilters(f => ({ ...f, productId: e.target.value }))}
                        >
                            <option value="">All products</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="row mt-3 g-2">
                    <div className="col-12 col-sm-4">
                        <label className="form-label mb-1">Category</label>
                        <select
                            className="form-select"
                            value={filters.categoryId}
                            onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value }))}
                        >
                            <option value="">All categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="col-12 col-sm-4">
                        <label className="form-label mb-1">Severity</label>
                        <select
                            className="form-select"
                            value={filters.severityLevel}
                            onChange={e => setFilters(f => ({ ...f, severityLevel: e.target.value }))}
                        >
                            <option value="">All</option>
                            <option value="1">1 – Low</option>
                            <option value="2">2 – Medium</option>
                            <option value="3">3 – High</option>
                        </select>
                    </div>

                    <div className="col-12 col-sm-4">
                        <label className="form-label mb-1">View</label>
                        <select
                            className="form-select"
                            value={filters.granularity}
                            onChange={e => setFilters(f => ({ ...f, granularity: e.target.value }))}
                        >
                            <option value="day">Daily</option>
                            <option value="month">Monthly</option>
                        </select>
                    </div>

                </div>

                {/* KPI Tiles */}
                <div className="row mt-3 g-2">
                    <div className="col-12 col-md-3">

                        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 6,
      background: statusColor
    }}
  />
  <div className="card-body" style={{ paddingLeft: 18 }}>
    <div className="text-muted">Complaints / 10,000 units</div>
    <div style={{ fontSize: 22, fontWeight: 600 }}>
      {kpis ? kpis.complaintsPer10k : '—'}
    </div>
    <div className="text-muted" style={{ fontSize: 12 }}>
      Green ≤ {thresholds.greenMax} • Amber ≤ {thresholds.amberMax} • Red &gt; {thresholds.amberMax}
    </div>
  </div>
</div>

                        {/* <div
                            className="card"
                            style={{
                                borderLeft: `8px solid ${complaintsRateStatus.color}`,
                            }}
                        >
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div className="text-muted">Complaints / 10,000 units</div>
                                    <span
                                        className="badge"
                                        style={{ backgroundColor: complaintsRateStatus.color }}
                                    >
                                        {complaintsRateStatus.label}
                                    </span>
                                </div>

                                <div style={{ fontSize: 22, fontWeight: 600 }}>
                                    {kpis ? kpis.complaintsPer10k : '—'}
                                </div>

                                <div className="text-muted" style={{ fontSize: 12 }}>
                                    Green &lt; {COMPLAINTS_PER_10K_THRESHOLDS.greenMax} • Warning ≤ {COMPLAINTS_PER_10K_THRESHOLDS.amberMax} • Red &gt; {COMPLAINTS_PER_10K_THRESHOLDS.amberMax}
                                </div>
                            </div>
                        </div> */}
                    </div>

                    <div className="col-12 col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="text-muted">Severity 3 count</div>
                                <div style={{ fontSize: 22, fontWeight: 600 }}>
                                    {kpis ? kpis.severity3Count : '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-3">
                        <div className="card" style={{ borderLeft: `4px solid ${kpis?.capaTriggered ? SEVERITY_COLORS[3] : SEVERITY_COLORS[1]}` }}>
                            <div className="card-body">
                                <div className="text-muted">CAPA triggered</div>
                                <div style={{ fontSize: 22, fontWeight: 600 }}>
                                    {kpis ? (kpis.capaTriggered ? 'Yes' : 'No') : '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-3">
                        <div className="card">
                            <div className="card-body">
                                <div className="text-muted">Produced units</div>
                                <div style={{ fontSize: 22, fontWeight: 600 }}>
                                    {kpis ? kpis.producedUnits : '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="row mt-3 g-3">
                    <div className="col-12 col-lg-7">
                        <div className="card">
                            <div className="card-body">
                                <TrendLineChart
                                    title="Complaints over time"
                                    points={widget?.charts?.complaintsOverTime || []}
                                    label="Complaints"
                                    color="#1b2638"
                                    yAxisTitle="Complaints"
                                    granularity={filters.granularity}   // <-- restores day/month behavior
                                />

                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-lg-5">
                        <div className="card">
                            <div className="card-body">
                                <TrendBarChart
                                    title="By category"
                                    labels={(widget?.charts?.complaintsByCategory || []).map(r => r.categoryName)}
                                    values={(widget?.charts?.complaintsByCategory || []).map(r => r.count)}
                                    // optional: give each bar a different color (simple deterministic palette)
                                    colors={(widget?.charts?.complaintsByCategory || []).map((_, idx) =>
                                        CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length]
                                    )}
                                    yAxisTitle="Complaints"
                                />

                            </div>
                        </div>
                    </div>
                </div>

                {/* Complaints List */}
                <div className="card mt-3">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                            <div style={{ fontWeight: 600 }}>Complaints List</div>
                            <div className="text-muted" style={{ fontSize: 13 }}>
                                {listLoading ? 'Loading…' : `${sortedComplaints.length} record(s)`}
                            </div>
                        </div>

                        <div className="table-responsive mt-2">
                            <table className="table table-sm table-bordered align-middle">
                                <thead>
                                    <tr>
                                        <th style={{ whiteSpace: 'nowrap' }}>{header('Date', 'complaint_date')}</th>
                                        <th className="d-none d-md-table-cell">{header('Product', 'product')}</th>
                                        <th>{header('Category', 'category')}</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>{header('Severity', 'severity')}</th>
                                        <th className="d-none d-lg-table-cell">{header('Risk Type', 'riskType')}</th>
                                        <th className="d-none d-md-table-cell">{header('CAPA', 'capaRequired')}</th>
                                        <th className="d-none d-lg-table-cell">{header('Lot Code', 'lotCode')}</th>
                                        <th className="d-none d-lg-table-cell">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listLoading ? (
                                        <tr><td colSpan={8} className="text-muted">Loading…</td></tr>
                                    ) : pageRows.length === 0 ? (
                                        <tr><td colSpan={8} className="text-muted">No complaints for the selected filters.</td></tr>
                                    ) : (
                                        pageRows.map((c) => (
                                            <tr
                                                key={c.id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openComplaint(c)}
                                            >
                                                <td style={{ whiteSpace: 'nowrap' }}>{c.complaint_date}</td>
                                                <td className="d-none d-md-table-cell">{c.Product?.name || '—'}</td>
                                                <td>{c.Category?.name || '—'}</td>
                                                <td>
                                                    <span style={severityBadgeStyle(Number(c.severityLevel))}>
                                                        {c.severityLevel}
                                                    </span>
                                                </td>
                                                <td className="d-none d-lg-table-cell">{c.riskType || '—'}</td>
                                                <td className="d-none d-md-table-cell">{c.capaRequired ? 'Yes' : 'No'}</td>
                                                <td className="d-none d-lg-table-cell">{c.Batch?.lotCode || '—'}</td>
                                                <td className="d-none d-lg-table-cell" style={{ maxWidth: 420 }}>
                                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {c.notes || '—'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                « Prev
                            </button>
                            <div className="text-muted" style={{ fontSize: 13 }}>
                                Page {page} of {totalPages}
                            </div>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next »
                            </button>
                        </div>
                    </div>
                </div>


            </div>

            {isModalOpen && selectedComplaint && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ marginTop: '75px' }}>
                    <div
                        className="modal-dialog modal-lg"
                        role="document"
                        style={{
                            boxShadow: '0px -2px 17px -1px rgba(0,0,0,0.35)',
                        }}
                    >
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: '#1b2638', color: 'white' }}>
                                <h5 className="modal-title">
                                    Complaint #{selectedComplaint.id}
                                </h5>
                                <div className="d-flex gap-2 ms-3">
                                    {!isEditing ? (
                                        <button type="button" className="btn btn-sm btn-warning" onClick={() => setIsEditing(true)}>
                                            Edit
                                        </button>
                                    ) : (
                                        <>
                                            <button type="button" className="btn btn-sm btn-light" onClick={() => setIsEditing(false)}>
                                                Cancel
                                            </button>
                                            <button type="button" className="btn btn-sm btn-warning" onClick={saveEdit}>
                                                Save
                                            </button>
                                        </>
                                    )}

                                    <button type="button" className="btn btn-sm btn-danger" onClick={confirmDelete}>
                                        Delete
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    style={{ filter: 'invert(1)' }}
                                    onClick={closeComplaint}
                                />
                            </div>

                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Complaint Date</div>
                                        {!isEditing ? (
                                            <div style={{ fontWeight: 600 }}>{selectedComplaint.complaint_date || '—'}</div>
                                        ) : (
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={editForm.complaint_date || ''}
                                                onChange={(e) => setEditForm(f => ({ ...f, complaint_date: e.target.value }))}
                                            />
                                        )}
                                    </div>


                                    <div className="col-12 col-md-6">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Severity</div>
                                        {!isEditing ? (
                                            <span style={severityBadgeStyle(Number(selectedComplaint.severityLevel))}>
                                                {selectedComplaint.severityLevel || '—'}
                                            </span>
                                        ) : (
                                            <select
                                                className="form-select"
                                                value={editForm.severityLevel}
                                                onChange={(e) => setEditForm(f => ({ ...f, severityLevel: e.target.value }))}
                                            >
                                                <option value="">Select…</option>
                                                <option value="1">1 – Low</option>
                                                <option value="2">2 – Medium</option>
                                                <option value="3">3 – High</option>
                                            </select>
                                        )}
                                    </div>


                                    <div className="col-12 col-md-6">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Category</div>
                                        {!isEditing ? (
                                            <div style={{ fontWeight: 600 }}>{selectedComplaint.Category?.name || '—'}</div>
                                        ) : (
                                            <select
                                                className="form-select"
                                                value={editForm.categoryId}
                                                onChange={(e) => setEditForm(f => ({ ...f, categoryId: e.target.value }))}
                                            >
                                                <option value="">Select…</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        )}
                                    </div>


                                    <div className="col-12 col-md-6">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Product</div>
                                        <div style={{ fontWeight: 600 }}>{selectedComplaint.Product?.name || '—'}</div>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Risk Type</div>
                                        <div style={{ fontWeight: 600 }}>{selectedComplaint.riskType || '—'}</div>
                                    </div>


                                    <div className="col-12 col-md-6">
                                        <div className="text-muted" style={{ fontSize: 12 }}>CAPA Required</div>

                                        {!isEditing ? (
                                            <div style={{ fontWeight: 600 }}>{selectedComplaint.capaRequired ? 'Yes' : 'No'}</div>
                                        ) : (
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={editForm.capaRequired}
                                                    onChange={(e) =>
                                                        setEditForm(f => ({
                                                            ...f,
                                                            capaRequired: e.target.checked,
                                                            // Optional: clear reason when unchecked
                                                            capaReason: e.target.checked ? f.capaReason : ''
                                                        }))
                                                    }
                                                    id="capaRequired"
                                                />
                                                <label className="form-check-label" htmlFor="capaRequired">Yes</label>
                                            </div>
                                        )}
                                    </div>

                                    {/* CAPA Reason */}
                                    <div className="col-12">
                                        <div className="text-muted" style={{ fontSize: 12 }}>CAPA Reason</div>

                                        {!isEditing ? (
                                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                                {selectedComplaint.capaReason || '—'}
                                            </div>
                                        ) : editForm.capaRequired ? (
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={editForm.capaReason}
                                                onChange={(e) => setEditForm(f => ({ ...f, capaReason: e.target.value }))}
                                                placeholder="Why was CAPA triggered?"
                                            />
                                        ) : (
                                            <div className="text-muted">Enable “CAPA Required” to enter a reason.</div>
                                        )}
                                    </div>



                                    <div className="col-12 col-md-6">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Batch Lot Code</div>
                                        <div style={{ fontWeight: 600 }}>{selectedComplaint.Batch?.lotCode || '—'}</div>
                                        {selectedComplaint.Batch?.production_date ? (
                                            <div className="text-muted" style={{ marginTop: 4 }}>
                                                Production date: {selectedComplaint.Batch.production_date}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Guidance Rule</div>
                                        {!isEditing ? (
                                            <div style={{ fontWeight: 600 }}>{selectedComplaint.GuidanceRule?.label || '—'}</div>
                                        ) : (
                                            <select
                                                className="form-select"
                                                value={editForm.guidanceRuleId ?? ''}
                                                onChange={(e) => setEditForm(f => ({ ...f, guidanceRuleId: e.target.value }))}
                                            >
                                                <option value="">None</option>
                                                {guidanceRules
                                                    .filter(r => !editForm.categoryId || String(r.categoryId) === String(editForm.categoryId))
                                                    .map(r => (
                                                        <option key={r.id} value={r.id}>{r.label}</option>
                                                    ))}
                                            </select>
                                        )}
                                    </div>


                                    <div className="col-12">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Customer / Source</div>
                                        <div style={{ fontWeight: 600 }}>
                                            {selectedComplaint.source || '—'}
                                            {selectedComplaint.customer_name ? ` — ${selectedComplaint.customer_name}` : ''}
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div className="text-muted" style={{ fontSize: 12 }}>Notes</div>
                                        {!isEditing ? (
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{selectedComplaint.notes || '—'}</div>
                                        ) : (
                                            <textarea
                                                className="form-control"
                                                rows={5}
                                                value={editForm.notes}
                                                onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                            />
                                        )}
                                    </div>


                                    <div className="col-12">
                                        <hr />
                                        <div className="text-muted" style={{ fontSize: 12 }}>
                                            Created: {formatDateTime(selectedComplaint.createdAt)} • Updated: {formatDateTime(selectedComplaint.updatedAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeComplaint}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
