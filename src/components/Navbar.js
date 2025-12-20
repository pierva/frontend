import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import logo from '../media/Pizzacini/logo_text.png';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);   // bootstrap collapse (mobile)
  const [isMenuOpen, setIsMenuOpen] = useState(false);   // desktop dropdown (lg+)

  const navbarRef = useRef();
  const location = useLocation();

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const decodedToken = jwtDecode(token);
      setUserRole(decodedToken.role);
    } else {
      setIsLoggedIn(false);
      setUserRole('');
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
    // Close menus on route change
    setIsExpanded(false);
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole('');
    window.location.href = '/';
  };

  const logoUrl = process.env.REACT_APP_LOGO_URL || logo;

  const perms = useMemo(() => {
    const isAdmin = userRole === 'admin';
    const isFactory = userRole === 'factory_team';
    return {
      isAdmin,
      isFactory,
      canAddLog: isAdmin || isFactory,
      canManageOrders: isAdmin || isFactory,
      canSubmitOrders: isAdmin || isFactory,
    };
  }, [userRole]);

  const closeAll = () => {
    setIsExpanded(false);
    setIsMenuOpen(false);
  };

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
          <Link className="navbar-brand d-flex align-items-center" to="/" onClick={closeAll}>
            <img
              src={logoUrl}
              alt="Company Logo"
              style={{ height: '40px', marginRight: '10px' }}
            />
            quickLOG
          </Link>

          {/* Mobile collapse toggle (Bootstrap hamburger) */}
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="navbarNav"
            aria-expanded={isExpanded ? 'true' : 'false'}
            aria-label="Toggle navigation"
            onClick={() => {
              setIsExpanded((v) => !v);
              setIsMenuOpen(false);
            }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isExpanded ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-2">
              {!isLoggedIn ? (
                <li className="nav-item">
                  <Link className="nav-link" to="/" onClick={closeAll}>
                    Login
                  </Link>
                </li>
              ) : (
                <>
                  {/* Always-visible actions (as requested) */}
                  {perms.canAddLog && (
                    <li className="nav-item">
                      <Link className="btn btn-outline-light" to="/add-log" onClick={closeAll}>
                        Add Log
                      </Link>
                    </li>
                  )}

                  {perms.canManageOrders && (
                    <li className="nav-item">
                      <Link className="btn btn-outline-light" to="/factory/orders" onClick={closeAll}>
                        Manage Orders
                      </Link>
                    </li>
                  )}

                  {perms.canSubmitOrders && (
                    <li className="nav-item">
                      <Link className="btn btn-warning" to="/admin/orders" onClick={closeAll}>
                        Submit Order
                      </Link>
                    </li>
                  )}

                  {/* MOBILE-ONLY LINKS (appear in the collapsed menu) */}
                  <li className="nav-item d-lg-none">
                    <Link className="nav-link" to="/logs" onClick={closeAll}>
                      Production Logs
                    </Link>
                  </li>
                  <li className="nav-item d-lg-none">
                    <Link className="nav-link" to="/traceability" onClick={closeAll}>
                      Traceability
                    </Link>
                  </li>
                  <li className="nav-item d-lg-none">
                    <Link className="nav-link" to="/inventory" onClick={closeAll}>
                      Inventory
                    </Link>
                  </li>

                  {perms.isAdmin && (
                    <>
                      <li className="nav-item d-lg-none">
                        <Link className="nav-link" to="/trends" onClick={closeAll}>
                          Trends and Analytics
                        </Link>
                      </li>
                      <li className="nav-item d-lg-none">
                        <Link className="nav-link" to="/admin/products" onClick={closeAll}>
                          Create Product
                        </Link>
                      </li>
                      <li className="nav-item d-lg-none">
                        <Link className="nav-link" to="/admin/users" onClick={closeAll}>
                          User Management
                        </Link>
                      </li>
                      <li className="nav-item d-lg-none">
                        <Link className="nav-link" to="/admin/customers" onClick={closeAll}>
                          Customers
                        </Link>
                      </li>
                    </>
                  )}

                  <li className="nav-item d-lg-none">
                    <button className="btn btn-outline-danger w-100 mt-2" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>

                  {/* DESKTOP-ONLY DROPDOWN (lg+) */}
                  <li className="nav-item dropdown d-none d-lg-block" style={{ position: 'relative' }}>
                    <button
                      className="btn btn-outline-light"
                      type="button"
                      aria-expanded={isMenuOpen ? 'true' : 'false'}
                      onClick={() => setIsMenuOpen((v) => !v)}
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        lineHeight: 1,
                        padding: '6px 12px',
                      }}
                      title="Menu"
                    >
                      ☰
                    </button>

                    <div
                      className={`dropdown-menu ${isMenuOpen ? 'show' : ''}`}
                      style={{
                        position: 'absolute',
                        right: 0,
                        left: 'auto',
                        minWidth: 240,
                        maxWidth: '90vw',
                        overflowWrap: 'break-word',
                      }}
                    >
                      <Link className="dropdown-item" to="/logs" onClick={closeAll}>
                        Production Logs
                      </Link>
                      <Link className="dropdown-item" to="/traceability" onClick={closeAll}>
                        Traceability
                      </Link>
                      <Link className="dropdown-item" to="/inventory" onClick={closeAll}>
                        Inventory
                      </Link>

                      {perms.isAdmin && (
                        <>
                          <div className="dropdown-divider" />
                          <Link className="dropdown-item" to="/trends" onClick={closeAll}>
                            Trends and Analytics
                          </Link>
                          <Link className="dropdown-item" to="/admin/products" onClick={closeAll}>
                            Create Product
                          </Link>
                          <Link className="dropdown-item" to="/admin/users" onClick={closeAll}>
                            User Management
                          </Link>
                          <Link className="dropdown-item" to="/admin/customers" onClick={closeAll}>
                            Customers
                          </Link>
                        </>
                      )}

                      <div className="dropdown-divider" />
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        Logout
                      </button>
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
