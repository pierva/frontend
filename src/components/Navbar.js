import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import logo from '../media/Pizzacini/logo_text.png';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
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
      if (isExpanded && navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  useEffect(() => {
    checkLoginStatus();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole('');
    window.location.href = '/';
  };

  // Use environment variable for the logo. If not defined, fallback to local logo.
  const logoUrl = process.env.REACT_APP_LOGO_URL

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
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src={logoUrl}
              alt="Company Logo"
              style={{ height: '40px', marginRight: '10px' }}
            />
            quickLOG
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={isExpanded ? 'true' : 'false'}
            aria-label="Toggle navigation"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${isExpanded ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {isLoggedIn && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/logs">
                      Production Logs
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/traceability">
                      Traceability
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/inventory">
                      Inventory
                    </Link>
                  </li>
                  {(userRole === 'admin' || userRole === 'factory_team') && (
                    <>
                      <li className="nav-item">
                        <Link className="nav-link" to="/add-log">
                          Add Log
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/factory/orders">
                          Manage Orders
                        </Link>
                      </li>
                    </>
                  )}
                  {userRole === 'admin' && (
                    <>
                      <li className="nav-item">
                        <Link className="nav-link" to="/admin/orders">
                          Submit Orders
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/admin/products">
                          Create Product
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/admin/users">
                          User Management
                        </Link>
                      </li>
                      {/* New Customers link for admin */}
                      <li className="nav-item">
                        <Link className="nav-link" to="/admin/customers">
                          Customers
                        </Link>
                      </li>
                    </>
                  )}
                  <li className="nav-item">
                    <button className="btn btn-outline-danger" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              )}
              {!isLoggedIn && (
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
      <div style={{ paddingTop: '70px' }}></div>
    </>
  );
}

export default Navbar;
