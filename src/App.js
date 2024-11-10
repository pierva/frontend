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

        <Route path="/traceability" element={<ProtectedRoute><TraceabilityPage /></ProtectedRoute>} />

        {/* Admin-only routes */}
        <Route path="/admin/products" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProductPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUserManagement />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
