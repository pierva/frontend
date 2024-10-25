import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ProductionLog from './pages/ProductionLog';
import AddLog from './pages/AddLog';
import AdminProductPage from './pages/AdminProductPage'; // Import the Admin Product Page
import ProtectedRoute from './components/ProtectedRoute'; // Import the ProtectedRoute component

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public route for login */}
        <Route path="/" element={<Login />} />

        {/* Protected route for production logs (for logged-in users) */}
        <Route path="/logs" element={<ProtectedRoute><ProductionLog /></ProtectedRoute>} />
        <Route path="/add-log" element={<ProtectedRoute><AddLog /></ProtectedRoute>} />

        {/* Protected route for creating products (Admin only) */}
        <Route path="/admin/products" element={
          <ProtectedRoute adminOnly={true}> {/* Protect the route for admins only */}
            <AdminProductPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
