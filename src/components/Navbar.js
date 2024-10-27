import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import the correct named export for decoding the token
import logo from '../media/logo_text.png'; 

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  // Check login status and role
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const decodedToken = jwtDecode(token);
      setIsAdmin(decodedToken.role === 'admin');
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  };

  // useEffect to check login status on mount and route change
  useEffect(() => {
    checkLoginStatus();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
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
      >
        <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src={logo} // Replace with your logo path
              alt="Company Logo"
              style={{ height: '40px', marginRight: '10px' }} // Adjust size as needed
            />
            quickLOG
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {isLoggedIn && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/logs">
                      Production Logs
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/add-log">
                      Add Log
                    </Link>
                  </li>
                  {isAdmin && (
                    <>
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

      {/* Spacer div to prevent content from being hidden behind fixed navbar */}
      <div style={{ paddingTop: '70px' }}></div>
    </>
  );
}

export default Navbar;
