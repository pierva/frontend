// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import ProductionLog from './pages/ProductionLog';
import AddLog from './pages/AddLog';
import TraceabilityPage from './pages/TraceabilityPage';
import InventoryPage from './pages/InventoryPage';
import NotFoundPage from './pages/NotFoundPage';

import AdminUserManagement from './components/AdminUserManagement';
import AdminProductPage from './pages/AdminProductPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import FactoryOrdersPage from './pages/FactoryOrdersPage';
import AdminCustomerPage from './pages/AdminCustomerPage';
import TrendsAnalyticsPage from './pages/TrendsAnalyticsPage';
import NewComplaintPage from './pages/trends/NewComplaintPage';
import ProductionLaborPage from './pages/trends/ProductionLaborPage';
import EnvironmentalTrendsPage from './pages/trends/EnvironmentalTrendsPage';
import EnvironmentalConfigPage from './pages/trends/EnvironmentalConfigPage';
import EnvironmentalNewATPPage from './pages/trends/EnvironmentalNewATPPage';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public route: redirect to /traceability if already logged in */}
        <Route
          path="/"
          element={
            token
              ? <Navigate to="/traceability" replace />
              : <Login />
          }
        />

        {/* Protected routes for all authenticated users */}
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <ProductionLog />
            </ProtectedRoute>
          }
        />

        {/* Admin & factory_team can add production logs */}
        <Route
          path="/add-log"
          element={
            <ProtectedRoute allowedRoles={['admin', 'factory_team']}>
              <AddLog />
            </ProtectedRoute>
          }
        />

        {/* Admin-only pages */}
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCustomerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route path="/trends/*"
          element={<ProtectedRoute allowedRoles={['admin']}>
            <TrendsAnalyticsPage />
          </ProtectedRoute>}
        />

        <Route path="/trends/production/labor"
          element={<ProtectedRoute allowedRoles={['admin']}>
            <ProductionLaborPage />
          </ProtectedRoute>}
        />


        <Route
          path="/trends/complaints/new"
          element={<ProtectedRoute allowedRoles={['admin']}>
            <NewComplaintPage />
          </ProtectedRoute>}
        />

        <Route path="/trends/environmental"
          element={<ProtectedRoute allowedRoles={['admin', 'factory_team']}>
            <EnvironmentalTrendsPage />
          </ProtectedRoute>}
        />

        <Route path="/trends/environmental/config"
          element={<ProtectedRoute allowedRoles={['admin', 'factory_team']}>
            <EnvironmentalConfigPage />
          </ProtectedRoute>} />

        <Route path="/trends/environmental/new"
          element={<ProtectedRoute allowedRoles={['admin', 'factory_team']}>
            <EnvironmentalNewATPPage />
          </ProtectedRoute>} />

        {/* Factory and admin can view/fulfill orders */}
        <Route
          path="/factory/orders"
          element={
            <ProtectedRoute>
              <FactoryOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Traceability and Inventory for all authenticated users */}
        <Route
          path="/traceability"
          element={
            <ProtectedRoute>
              <TraceabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
