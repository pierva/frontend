import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode as a named import

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/" />;
  }

  // Decode the token to check the user's role
  const decodedToken = jwtDecode(token);
  const userRole = decodedToken.role;

  // If the route is adminOnly and the user is not an admin, redirect
  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/" />;
  }

  // If token exists and (if adminOnly) user is admin, allow access
  return children;
};

export default ProtectedRoute;
