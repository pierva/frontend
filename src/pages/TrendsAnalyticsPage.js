// src/pages/TrendsAnalyticsPage.js
import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import ComplaintTrendsPage from './trends/ComplaintTrendsPage';
import ComplaintConfigPage from './trends/ComplaintConfigPage';
import ProductionTrendsPage from './trends/ProductionTrendsPage';
import EnvironmentalTrendsPage from './trends/EnvironmentalTrendsPage';

export default function TrendsAnalyticsPage() {
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
              <NavLink to="complaints" className={({ isActive }) =>
                `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
              }>
                Complaints
              </NavLink>

              <NavLink to="production" className={({ isActive }) =>
                `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
              }>
                Production
              </NavLink>

              <NavLink to="environmental" className={({ isActive }) =>
                `list-group-item list-group-item-action ${isActive ? 'active' : ''}`
              }>
                Environmental
              </NavLink>
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="col-12 col-md-9 col-lg-10">
          <Routes>
            <Route path="/" element={<Navigate to="complaints" replace />} />

            {/* Complaints */}
            <Route path="complaints" element={<ComplaintTrendsPage />} />
            <Route path="complaints/config" element={<ComplaintConfigPage />} />

            {/* Production */}
            <Route path="production" element={<ProductionTrendsPage />} />

            <Route path="environmental" element={<EnvironmentalTrendsPage />} />

            <Route path="*" element={<div className="alert alert-warning">Page not found.</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
