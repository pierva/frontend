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
import EnvironmentalConfigPage from './pages/trends/EnvironmentalConfigPage';
import EnvironmentalNewATPPage from './pages/trends/EnvironmentalNewATPPage';
import authService from './services/authService';
import BakingCcpConfigPage from './pages/ccp/BakingCcpConfigPage';
import BakingCcpStartPage from './pages/ccp/BakingCcpStartPage';
import BakingCcpLivePage from './pages/ccp/BakingCcpLivePage';
import BakingCcpQueuePage from './pages/ccp/BakingCcpQueuePage';
import BakingCcpVerifyPage from './pages/ccp/BakingCcpVerifyPage';

function App() {
  const isAuthed = authService.isTokenValid();
  if (!isAuthed) authService.clearToken();

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public route */}
        <Route
          path="/"
          element={isAuthed ? <Navigate to="/traceability" replace /> : <Login />}
        />

        {/* All authenticated users */}
        <Route path="/logs" element={<ProtectedRoute><ProductionLog /></ProtectedRoute>} />

        {/* Admin & factory_team */}
        <Route
          path="/add-log"
          element={
            <ProtectedRoute allowedRoles={['admin', 'factory_team']}>
              <AddLog />
            </ProtectedRoute>
          }
        />

        {/* Admin-only */}
        <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><AdminProductPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUserManagement /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin']}><AdminCustomerPage /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrdersPage /></ProtectedRoute>} />

        <Route path="/trends/*" element={<ProtectedRoute allowedRoles={['admin']}><TrendsAnalyticsPage /></ProtectedRoute>} />
        <Route path="/trends/production/labor" element={<ProtectedRoute allowedRoles={['admin']}><ProductionLaborPage /></ProtectedRoute>} />
        <Route path="/trends/complaints/new" element={<ProtectedRoute allowedRoles={['admin']}><NewComplaintPage /></ProtectedRoute>} />
        <Route path="/trends/environmental/config" element={<ProtectedRoute allowedRoles={['admin', 'factory_team']}><EnvironmentalConfigPage /></ProtectedRoute>} />
        <Route path="/trends/environmental/new" element={<ProtectedRoute allowedRoles={['admin', 'factory_team']}><EnvironmentalNewATPPage /></ProtectedRoute>} />

        {/* CCP — baking (factory + admin) */}
        <Route path="/ccp/baking/config" element={<ProtectedRoute allowedRoles={['admin']}><BakingCcpConfigPage /></ProtectedRoute>} />
        <Route path="/ccp/baking/start" element={<ProtectedRoute allowedRoles={['admin', 'factory_team']}><BakingCcpStartPage /></ProtectedRoute>} />
        <Route path="/ccp/baking/live/:runId" element={<ProtectedRoute allowedRoles={['admin', 'factory_team']}><BakingCcpLivePage /></ProtectedRoute>} />

        {/* CCP — QA review (qa + admin) */}
        <Route
          path="/ccp/baking/queue"
          element={
            <ProtectedRoute allowedRoles={['admin', 'qa']}>
              <BakingCcpQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ccp/baking/verify/:runId"
          element={
            <ProtectedRoute allowedRoles={['admin', 'qa']}>
              <BakingCcpVerifyPage />
            </ProtectedRoute>
          }
        />

        {/* Factory orders */}
        <Route path="/factory/orders" element={<ProtectedRoute><FactoryOrdersPage /></ProtectedRoute>} />

        {/* All authenticated */}
        <Route path="/traceability" element={<ProtectedRoute><TraceabilityPage /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;