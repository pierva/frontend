import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // Check if token exists

  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/" />;
  }

  // If token exists, allow access to the child component (e.g., ProductionLog)
  return children;
};

export default ProtectedRoute;
