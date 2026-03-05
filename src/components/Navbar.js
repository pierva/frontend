// components/Navbar.js

import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import logo from '../media/Pizzacini/logo_text.png';
import bakingCcpService from '../services/bakingCcpService';
import authService from '../services/authService';
import { usePermissions } from '../context/PermissionContext';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // active run state
  const [activeRunId, setActiveRunId] = useState(null);
  const [checkingActiveRun, setCheckingActiveRun] = useState(false);

  // QA queue badge count
  const [pendingQACount, setPendingQACount] = useState(0);

  const navbarRef = useRef();
  const location = useLocation();
  const { hasModule } = usePermissions();

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const nowSec = Math.floor(Date.now() / 1000);
      if (!decodedToken?.exp || decodedToken.exp <= nowSec) {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);
    } catch (e) {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsExpanded(false);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    checkLoginStatus();
    setIsExpanded(false);
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    authService.clearToken();
    window.location.href = '/';
  };

  const logoUrl = process.env.REACT_APP_LOGO_URL || logo;

  const canProduction = isLoggedIn && hasModule('ccp.baking.production');
  const canReviewQA   = isLoggedIn && hasModule('ccp.baking.qa');

  const closeAll = () => {
    setIsExpanded(false);
    setIsMenuOpen(false);
  };

  // Fetch active run
  useEffect(() => {
    let cancelled = false;
    const fetchActiveRun = async () => {
      if (!canProduction) {
        setActiveRunId(null);
        return;
      }
      setCheckingActiveRun(true);
      try {
        const res = await bakingCcpService.getActiveRun();
        const run = res?.run || null;
        if (!cancelled) setActiveRunId(run?.id ?? null);
      } catch (e) {
        if (!cancelled) setActiveRunId(null);
      } finally {
        if (!cancelled) setCheckingActiveRun(false);
      }
    };
    fetchActiveRun();
    return () => { cancelled = true; };
  }, [canProduction, location.pathname]);

  // Re-poll active run on production status change
  useEffect(() => {
    const handler = () => {
      if (!canProduction) return;
      bakingCcpService.getActiveRun()
        .then(res => setActiveRunId(res?.run?.id ?? null))
        .catch(() => setActiveRunId(null));
    };
    window.addEventListener('productionStatusChanged', handler);
    return () => window.removeEventListener('productionStatusChanged', handler);
  }, [canProduction]);

  // Refresh QA badge count on status change
  useEffect(() => {
    const handler = () => {
      if (!canReviewQA) return;
      bakingCcpService.getRuns('COMPLETED')
        .then(res => setPendingQACount(Array.isArray(res?.runs) ? res.runs.length : 0))
        .catch(() => setPendingQACount(0));
    };
    window.addEventListener('productionStatusChanged', handler);
    return () => window.removeEventListener('productionStatusChanged', handler);
  }, [canReviewQA]);

  // Fetch pending QA count
  useEffect(() => {
    let cancelled = false;
    const fetchPendingQA = async () => {
      if (!canReviewQA) {
        setPendingQACount(0);
        return;
      }
      try {
        const res = await bakingCcpService.getRuns('COMPLETED');
        const count = Array.isArray(res?.runs) ? res.runs.length : 0;
        if (!cancelled) setPendingQACount(count);
      } catch (e) {
        if (!cancelled) setPendingQACount(0);
      }
    };
    fetchPendingQA();
    return () => { cancelled = true; };
  }, [canReviewQA, location.pathname]);

  const LIVE_RUN_PATH = activeRunId ? `/ccp/baking/live/${activeRunId}` : '/ccp/baking/start';

  // Computed flags for sections that group multiple links
  const hasAnyDropdownSection =
    canReviewQA ||
    hasModule('analytics.overview') ||
    hasModule('ccp.baking.config') ||
    hasModule('admin.products') ||
    hasModule('admin.users') ||
    hasModule('admin.customers');

  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-dark"
        style={{
          backgroundColor: '#1b2638',
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 1000,
        }}
        ref={navbarRef}
      >
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to={isLoggedIn ? "/traceability" : "/"} onClick={closeAll}>
            <img src={logoUrl} alt="Company Logo" style={{ height: '40px', marginRight: '10px' }} />
            quickLOG
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            aria-controls="navbarNav"
            aria-expanded={isExpanded ? 'true' : 'false'}
            aria-label="Toggle navigation"
            onClick={() => { setIsExpanded((v) => !v); setIsMenuOpen(false); }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isExpanded ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-2">
              {!isLoggedIn ? (
                <li className="nav-item">
                  <Link className="nav-link" to="/" onClick={closeAll}>Login</Link>
                </li>
              ) : (
                <>
                  {isLoggedIn && hasModule('production.logs') && (
                    <li className="nav-item">
                      <Link className="btn btn-outline-light" to="/add-log" onClick={closeAll}>
                        Add Log
                      </Link>
                    </li>
                  )}

                  {isLoggedIn && hasModule('production.orders') && (
                    <li className="nav-item">
                      <Link className="btn btn-outline-light" to="/factory/orders" onClick={closeAll}>
                        Manage Orders
                      </Link>
                    </li>
                  )}

                  {canReviewQA && (
                    <li className="nav-item">
                      <Link
                        className="btn btn-outline-warning position-relative"
                        to="/ccp/baking/queue"
                        onClick={closeAll}
                        title="QA Review Queue"
                      >
                        QA Review
                        {pendingQACount > 0 && (
                          <span
                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                            style={{ fontSize: 10 }}
                          >
                            {pendingQACount}
                          </span>
                        )}
                      </Link>
                    </li>
                  )}

                  {canProduction && (
                    <li className="nav-item">
                      <Link
                        className={`btn ${activeRunId ? 'btn-danger' : 'btn-success'}`}
                        to={LIVE_RUN_PATH}
                        onClick={closeAll}
                        title={activeRunId ? `Open live run #${activeRunId}` : 'Start a new production run'}
                      >
                        {activeRunId ? (
                          <>
                            Production in Progress{' '}
                            <span className="badge bg-light text-dark ms-2">RUN #{activeRunId}</span>
                          </>
                        ) : (
                          <>
                            Start Production
                            {checkingActiveRun && (
                              <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true" />
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  )}

                  {isLoggedIn && hasModule('admin.orders') && (
                    <li className="nav-item">
                      <Link className="btn btn-warning" to="/admin/orders" onClick={closeAll}>
                        Submit Order
                      </Link>
                    </li>
                  )}

                  {/* MOBILE-ONLY links */}
                  <li className="nav-item d-lg-none">
                    <Link className="nav-link" to="/logs" onClick={closeAll}>Production Logs</Link>
                  </li>
                  <li className="nav-item d-lg-none">
                    <Link className="nav-link" to="/traceability" onClick={closeAll}>Traceability</Link>
                  </li>
                  <li className="nav-item d-lg-none">
                    <Link className="nav-link" to="/inventory" onClick={closeAll}>Inventory</Link>
                  </li>
                  {isLoggedIn && hasModule('production.schedule') && (
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link" to="/production-schedule" onClick={closeAll}>Production Schedule</Link>
                    </li>
                  )}
                  {isLoggedIn && hasModule('analytics.overview') && (
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link" to="/trends" onClick={closeAll}>Trends and Analytics</Link>
                    </li>
                  )}
                  {isLoggedIn && hasModule('ccp.baking.config') && (
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link" to="/ccp/baking/config" onClick={closeAll}>Baking CCP Config</Link>
                    </li>
                  )}
                  {isLoggedIn && hasModule('admin.products') && (
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link" to="/admin/products" onClick={closeAll}>Products & Ingredients</Link>
                    </li>
                  )}
                  {isLoggedIn && hasModule('admin.users') && (
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link" to="/admin/users" onClick={closeAll}>User Management</Link>
                    </li>
                  )}
                  {isLoggedIn && hasModule('admin.customers') && (
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link" to="/admin/customers" onClick={closeAll}>Customers</Link>
                    </li>
                  )}

                  <li className="nav-item d-lg-none">
                    <button className="btn btn-outline-danger w-100 mt-2" onClick={handleLogout}>Logout</button>
                  </li>

                  {/* DESKTOP DROPDOWN */}
                  <li className="nav-item dropdown d-none d-lg-block" style={{ position: 'relative' }}>
                    <button
                      className="btn btn-outline-light"
                      type="button"
                      aria-expanded={isMenuOpen ? 'true' : 'false'}
                      onClick={() => setIsMenuOpen((v) => !v)}
                      style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1, padding: '6px 12px' }}
                      title="Menu"
                    >
                      ☰
                    </button>

                    <div
                      className={`dropdown-menu ${isMenuOpen ? 'show' : ''}`}
                      style={{ position: 'absolute', right: 0, left: 'auto', minWidth: 240, maxWidth: '90vw', overflowWrap: 'break-word' }}
                    >
                      <Link className="dropdown-item" to="/logs" onClick={closeAll}>Production Logs</Link>
                      <Link className="dropdown-item" to="/traceability" onClick={closeAll}>Traceability</Link>
                      <Link className="dropdown-item" to="/inventory" onClick={closeAll}>Inventory</Link>
                      {isLoggedIn && hasModule('production.schedule') && (
                        <Link className="dropdown-item" to="/production-schedule" onClick={closeAll}>Production Schedule</Link>
                      )}

                      {hasAnyDropdownSection && <div className="dropdown-divider" />}

                      {canReviewQA && (
                        <Link className="dropdown-item d-flex justify-content-between align-items-center" to="/ccp/baking/queue" onClick={closeAll}>
                          QA Review Queue
                          {pendingQACount > 0 && (
                            <span className="badge bg-danger ms-2">{pendingQACount}</span>
                          )}
                        </Link>
                      )}
                      {isLoggedIn && hasModule('analytics.overview') && (
                        <Link className="dropdown-item" to="/trends" onClick={closeAll}>Trends and Analytics</Link>
                      )}
                      {isLoggedIn && hasModule('ccp.baking.config') && (
                        <Link className="dropdown-item" to="/ccp/baking/config" onClick={closeAll}>Baking CCP Config</Link>
                      )}
                      {isLoggedIn && hasModule('admin.products') && (
                        <Link className="dropdown-item" to="/admin/products" onClick={closeAll}>Products & Ingredients</Link>
                      )}
                      {isLoggedIn && hasModule('admin.users') && (
                        <Link className="dropdown-item" to="/admin/users" onClick={closeAll}>User Management</Link>
                      )}
                      {isLoggedIn && hasModule('admin.customers') && (
                        <Link className="dropdown-item" to="/admin/customers" onClick={closeAll}>Customers</Link>
                      )}

                      <div className="dropdown-divider" />
                      <button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button>
                    </div>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: '70px' }} />
    </>
  );
}

export default Navbar;
