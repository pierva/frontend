import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminUserManagement from './components/AdminUserManagement';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ProductionLog from './pages/ProductionLog';
import AddLog from './pages/AddLog';
import AdminProductPage from './pages/AdminProductPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public route for login */}
        <Route path="/" element={<Login />} />

        {/* Protected routes for logged-in users */}
        <Route path="/logs" element={<ProtectedRoute><ProductionLog /></ProtectedRoute>} />
        <Route path="/add-log" element={<ProtectedRoute><AddLog /></ProtectedRoute>} />

        {/* Admin-only routes */}
        <Route path="/admin/products" element={
          <ProtectedRoute adminOnly={true}>
            <AdminProductPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/users" element={
          <ProtectedRoute adminOnly={true}>
            <AdminUserManagement />
          </ProtectedRoute>
        } />
        
      </Routes>
    </Router>
  );
}

export default App;
