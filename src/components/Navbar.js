import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import the correct named export for decoding the token

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Track if the user is an admin
  const location = useLocation();

  // Function to check if the user is logged in and if they are an admin
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const decodedToken = jwtDecode(token);
      setIsAdmin(decodedToken.role === 'admin'); // Check if the user is an admin
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false); // Reset if logged out
    }
  };

  // Use useEffect to check login status when the component mounts or route changes
  useEffect(() => {
    checkLoginStatus();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    window.location.href = '/'; // Redirect to login page
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          PIZZACINI quickLOG
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
            {/* Show Production Log link only if logged in */}
            {isLoggedIn && (
              <li className="nav-item">
                <Link className="nav-link" to="/logs">
                  Production Logs
                </Link>
              </li>
            )}

            {/* Show Create Product link only if logged in and is admin */}
            {isLoggedIn && isAdmin && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin/products">
                  Create Product
                </Link>
              </li>
            )}

            {/* Show Login link if not logged in */}
            {!isLoggedIn && (
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Login
                </Link>
              </li>
            )}

            {/* Show Logout button if logged in */}
            {isLoggedIn && (
              <li className="nav-item">
                <button className="btn btn-outline-danger" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
