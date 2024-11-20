import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import logo from '../media/logo_text.png';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isExpanded, setIsExpanded] = useState(false); // Track navbar state
  const navbarRef = useRef(); // Reference for the navbar element
  const location = useLocation();

  // Check login status and role
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

  // Handle clicks outside the navbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isExpanded &&
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setIsExpanded(false); // Collapse navbar
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Check login status on mount and route change
  useEffect(() => {
    checkLoginStatus();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole('');
    window.location.href = '/'; // Redirect to login
  };

  return (
    <>
      {/* Navbar */}
      <nav
        className="navbar navbar-expand-lg navbar-dark"
        style={{
          backgroundColor: '#1b2638',
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 1000,
        }}
        ref={navbarRef} // Attach ref to navbar
      >
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src={logo}
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
            onClick={() => setIsExpanded(!isExpanded)} // Toggle navbar state
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className={`collapse navbar-collapse ${isExpanded ? 'show' : ''}`} // Dynamically add "show" class
            id="navbarNav"
          >
            <ul className="navbar-nav ms-auto">
              {isLoggedIn && (
                <>
                  {/* Links visible to all logged-in users */}
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

                  {/* Links for factory_team and admin */}
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

                  {/* Links for admin only */}
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
                    </>
                  )}

                  {/* Logout Button */}
                  <li className="nav-item">
                    <button className="btn btn-outline-danger" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              )}
              {/* Login Link for unauthenticated users */}
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

      {/* Spacer div to prevent content from being hidden behind fixed navbar */}
      <div style={{ paddingTop: '70px' }}></div>
    </>
  );
}

export default Navbar;
