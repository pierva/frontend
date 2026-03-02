// src/services/authService.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL;
if (!API_URL) console.warn('REACT_APP_API_URL is not defined');

const getToken = () => localStorage.getItem('token');

const clearToken = () => {
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('authChanged'));
};

const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    if (!decoded?.exp) return false;
    return decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/api/users/login`, { username, password });
  const token = response.data.token;
  localStorage.setItem('token', token);
  window.dispatchEvent(new Event('authChanged')); // ← triggers PermissionContext reload
  return token;
};

const authService = { login, getToken, clearToken, isTokenValid };
export default authService;