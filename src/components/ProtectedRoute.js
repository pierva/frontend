import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode as a named import

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/" />;
  }
  try {
    const decodedToken = jwtDecode(token);
    const isAdmin = decodedToken.role === 'admin';

    // If adminOnly is true and the user is not an admin, redirect to the login page or show an error
    if (adminOnly && !isAdmin) {
      return <Navigate to="/" />;
    }

    // If logged in (and has admin rights if required), render the protected content
    return children;
  } catch (error) {
    // In case of token decoding failure, redirect to login
    return <Navigate to="/" />;
  }
}

export default ProtectedRoute;