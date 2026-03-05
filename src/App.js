// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { PermissionProvider } from './context/PermissionContext';

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
import EnvironmentalConfigPage from './pages/trends/EnvironmentalConfigPage';
import EnvironmentalNewATPPage from './pages/trends/EnvironmentalNewATPPage';
import authService from './services/authService';
import BakingCcpConfigPage from './pages/ccp/BakingCcpConfigPage';
import BakingCcpStartPage from './pages/ccp/BakingCcpStartPage';
import BakingCcpLivePage from './pages/ccp/BakingCcpLivePage';
import BakingCcpQueuePage from './pages/ccp/BakingCcpQueuePage';
import BakingCcpVerifyPage from './pages/ccp/BakingCcpVerifyPage';
import ProductionSchedulePage from './pages/ProductionSchedulePage';

function App() {
  const isAuthed = authService.isTokenValid();
  if (!isAuthed) authService.clearToken();

  return (
    <Router>
      <PermissionProvider>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={isAuthed ? <Navigate to="/traceability" replace /> : <Login />}
          />

          {/* Production */}
          <Route path="/logs" element={
            <ProtectedRoute moduleKey="production.logs">
              <ProductionLog />
            </ProtectedRoute>
          } />
          <Route path="/add-log" element={
            <ProtectedRoute moduleKey="production.logs">
              <AddLog />
            </ProtectedRoute>
          } />
          <Route path="/traceability" element={
            <ProtectedRoute moduleKey="production.traceability">
              <TraceabilityPage />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute moduleKey="production.inventory">
              <InventoryPage />
            </ProtectedRoute>
          } />
          <Route path="/factory/orders" element={
            <ProtectedRoute moduleKey="production.orders">
              <FactoryOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/production-schedule" element={
            <ProtectedRoute moduleKey="production.schedule">
              <ProductionSchedulePage />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/products" element={
            <ProtectedRoute moduleKey="admin.products">
              <AdminProductPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute moduleKey="admin.users">
              <AdminUserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/customers" element={
            <ProtectedRoute moduleKey="admin.customers">
              <AdminCustomerPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute moduleKey="admin.orders">
              <AdminOrdersPage />
            </ProtectedRoute>
          } />

          {/* Analytics */}
          <Route path="/trends/*" element={
            <ProtectedRoute moduleKey="analytics.overview">
              <TrendsAnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/trends/production/labor" element={
            <ProtectedRoute moduleKey="analytics.labor">
              <ProductionLaborPage />
            </ProtectedRoute>
          } />
          <Route path="/trends/complaints/new" element={
            <ProtectedRoute moduleKey="analytics.complaints">
              <NewComplaintPage />
            </ProtectedRoute>
          } />
          <Route path="/trends/environmental/config" element={
            <ProtectedRoute moduleKey="analytics.environmental">
              <EnvironmentalConfigPage />
            </ProtectedRoute>
          } />
          <Route path="/trends/environmental/new" element={
            <ProtectedRoute moduleKey="analytics.environmental">
              <EnvironmentalNewATPPage />
            </ProtectedRoute>
          } />

          {/* CCP — Production */}
          <Route path="/ccp/baking/config" element={
            <ProtectedRoute moduleKey="ccp.baking.config">
              <BakingCcpConfigPage />
            </ProtectedRoute>
          } />
          <Route path="/ccp/baking/start" element={
            <ProtectedRoute moduleKey="ccp.baking.production">
              <BakingCcpStartPage />
            </ProtectedRoute>
          } />
          <Route path="/ccp/baking/live/:runId" element={
            <ProtectedRoute moduleKey="ccp.baking.production">
              <BakingCcpLivePage />
            </ProtectedRoute>
          } />

          {/* CCP — QA */}
          <Route path="/ccp/baking/queue" element={
            <ProtectedRoute moduleKey="ccp.baking.qa">
              <BakingCcpQueuePage />
            </ProtectedRoute>
          } />
          <Route path="/ccp/baking/verify/:runId" element={
            <ProtectedRoute moduleKey="ccp.baking.qa">
              <BakingCcpVerifyPage />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PermissionProvider>
    </Router>
  );
}

export default App;