// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.login(username, password);
      navigate('/logs', { replace: true });
    } catch (error) {
      console.error('Login failed', error);
      setErrorMessage('Invalid username or password. Please try again.');
    }
  };

  // Auto-dismiss error after 5s
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  return (
    <div className="container mt-5">
      <h2>Login to PIZZACINI quickLOG</h2>
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {errorMessage}
            <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
          </div>
        )}
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary mt-3">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
