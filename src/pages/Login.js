import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State to track error message
  const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        // Optionally, you can decode and check token expiration here
        navigate('/traceability');
      }
    }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.login(username, password);
      navigate('/logs');
    } catch (error) {
      console.error('Login failed', error);
      setErrorMessage('Invalid username or password. Please try again.');
    }
  };

  // Auto-dismiss the error message after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer); // Clear timeout if component unmounts
    }
  }, [errorMessage]);

  return (
    <div className="container mt-5">
      <h2>Login to PIZZACINI quickLOG</h2>
      <form onSubmit={handleSubmit}>
        {errorMessage && ( // Show the error message conditionally
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {errorMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setErrorMessage('')}
            ></button>
          </div>
        )}
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
