import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode as a named import

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/" />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

    // Check if token is expired
    if (decodedToken.exp < currentTime) {
      // Redirect to login if the token has expired
      return <Navigate to="/" />;
    }

    // If allowedRoles is specified and the user's role is not in it, redirect
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/" />;
    }

    // If the user is allowed, render the protected content
    return children;
  } catch (error) {
    // In case of token decoding failure, redirect to login
    return <Navigate to="/" />;
  }
};

export default ProtectedRoute;
