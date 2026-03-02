// src/components/ProtectedRoute.js
// Supports both the legacy allowedRoles check AND the new moduleKey check.
// Both can be combined: role must be allowed AND module must be granted.
//
// Usage:
//   <ProtectedRoute>                                    → any authenticated user
//   <ProtectedRoute allowedRoles={['admin','qa']}>      → role check only (legacy)
//   <ProtectedRoute moduleKey="analytics.labor">        → module permission check
//   <ProtectedRoute allowedRoles={['admin']} moduleKey="analytics.labor">  → both

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { usePermissions } from '../context/PermissionContext';

export default function ProtectedRoute({ children, allowedRoles, moduleKey }) {
  const location = useLocation();
  const { hasModule, role, loading } = usePermissions();

  // Not logged in
  if (!authService.isTokenValid()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Still loading permissions — show nothing briefly to avoid flash
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-secondary" />
      </div>
    );
  }

  // Role ceiling check (legacy allowedRoles prop)
  if (allowedRoles && role !== 'admin' && !allowedRoles.includes(role)) {
    return <Navigate to="/traceability" replace />;
  }

  // Module permission check
  if (moduleKey && !hasModule(moduleKey)) {
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-warning d-inline-block px-5 py-4">
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <h5>Access Restricted</h5>
          <p className="mb-0 text-muted" style={{ fontSize: 14 }}>
            You don't have permission to access this module.<br />
            Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return children;
}