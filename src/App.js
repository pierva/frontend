import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ProductionLog from './pages/ProductionLog';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public route for login */}
        <Route path="/" element={<Login />} />

        {/* Protected route for production logs */}
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <ProductionLog />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
