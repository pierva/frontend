import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminUserManagement from './components/AdminUserManagement';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ProductionLog from './pages/ProductionLog';
import AddLog from './pages/AddLog';
import AdminProductPage from './pages/AdminProductPage';
import ProtectedRoute from './components/ProtectedRoute';
import TraceabilityPage from './pages/TraceabilityPage';
import InventoryPage from './pages/InventoryPage';
import NotFoundPage from './pages/NotFoundPage'; // Import the 404 component
import AdminOrdersPage from './pages/AdminOrdersPage';
import FactoryOrdersPage from './pages/FactoryOrdersPage';
import AdminCustomerPage from './pages/AdminCustomerPage';



function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public route for login */}
        <Route path="/" element={<Login />} />

        {/* Protected routes for all logged-in users */}
        <Route path="/logs" element={<ProtectedRoute><ProductionLog /></ProtectedRoute>} />

        {/* Protected route for adding logs (admin and factory_team only) */}
        <Route path="/add-log" element={
          <ProtectedRoute allowedRoles={['admin', 'factory_team']}>
            <AddLog />
          </ProtectedRoute>
        } />

      <Route path="/admin/orders" element={<ProtectedRoute adminOnly={true}><AdminOrdersPage /></ProtectedRoute>} />
      <Route path="/factory/orders" element={<ProtectedRoute><FactoryOrdersPage /></ProtectedRoute>} />


        <Route path="/traceability" element={<ProtectedRoute><TraceabilityPage /></ProtectedRoute>} />

        {/* Admin-only routes */}
        <Route path="/admin/products" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProductPage />
          </ProtectedRoute>
        } />

      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />

        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUserManagement />
          </ProtectedRoute>
        } />

        <Route path="/admin/customers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCustomerPage />
          </ProtectedRoute>
        } />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
