// src/pages/TrendsAnalyticsPage.js
import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import ComplaintTrendsPage from './trends/ComplaintTrendsPage';
import ComplaintConfigPage from './trends/ComplaintConfigPage';
import ProductionTrendsPage from './trends/ProductionTrendsPage';
import EnvironmentalTrendsPage from './trends/EnvironmentalTrendsPage';
import IngredientTrendsPage from './trends/IngredientTrendsPage';
import { usePermissions } from '../context/PermissionContext';

const AccessDenied = () => (
  <div className="text-center mt-5">
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

export default function TrendsAnalyticsPage() {
  const { hasModule } = usePermissions();

  const canComplaints   = hasModule('analytics.complaints');
  const canLabor        = hasModule('analytics.labor');
  const canEnvironmental = hasModule('analytics.environmental');
  const canIngredients  = hasModule('analytics.overview');

  // Redirect to the first accessible tab
  const defaultTab =
    canComplaints   ? 'complaints' :
    canLabor        ? 'production' :
    canEnvironmental ? 'environmental' :
    canIngredients  ? 'ingredients' :
    null;

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2 mb-3">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: '#1b2638', color: 'white' }}>
              Trends & Analytics
            </div>
            <div className="list-group list-group-flush">
              {canComplaints && (
                <NavLink to="complaints" className={({ isActive }) =>
                  `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }>
                  Complaints
                </NavLink>
              )}

              {canLabor && (
                <NavLink to="production" className={({ isActive }) =>
                  `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }>
                  Production
                </NavLink>
              )}

              {canEnvironmental && (
                <NavLink to="environmental" className={({ isActive }) =>
                  `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }>
                  Environmental
                </NavLink>
              )}

              {canIngredients && (
                <NavLink to="ingredients" className={({ isActive }) =>
                  `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
                }>
                  Ingredients
                </NavLink>
              )}
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="col-12 col-md-9 col-lg-10">
          <Routes>
            <Route path="/" element={defaultTab ? <Navigate to={defaultTab} replace /> : <AccessDenied />} />

            <Route path="complaints" element={canComplaints ? <ComplaintTrendsPage /> : <AccessDenied />} />
            <Route path="complaints/config" element={canComplaints ? <ComplaintConfigPage /> : <AccessDenied />} />

            <Route path="production" element={canLabor ? <ProductionTrendsPage /> : <AccessDenied />} />

            <Route path="environmental" element={canEnvironmental ? <EnvironmentalTrendsPage /> : <AccessDenied />} />

            <Route path="ingredients" element={canIngredients ? <IngredientTrendsPage /> : <AccessDenied />} />

            <Route path="*" element={<div className="alert alert-warning">Page not found.</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
