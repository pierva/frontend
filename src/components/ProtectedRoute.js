import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');

  const logoutAndRedirect = () => {
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;
    const currentTime = Math.floor(Date.now() / 1000);

    // If token missing exp or expired -> clear it (prevents redirect loops)
    if (!decodedToken?.exp || decodedToken.exp <= currentTime) {
      return logoutAndRedirect();
    }

    // Role gating
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // Optional: don't clear token here because user is authenticated, just unauthorized
      // But redirecting to "/" could cause confusion if "/" redirects; better to go to a safe page:
      return <Navigate to="/traceability" replace />;
    }

    return children;
  } catch (error) {
    // Decoding failed -> token is junk -> clear it
    return logoutAndRedirect();
  }
};

export default ProtectedRoute;