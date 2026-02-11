import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL;

const getToken = () => localStorage.getItem('token');

const clearToken = () => {
  localStorage.removeItem('token');
};

const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    // exp is in seconds
    if (!decoded?.exp) return false;

    const nowSec = Math.floor(Date.now() / 1000);
    return decoded.exp > nowSec;
  } catch (e) {
    return false;
  }
};

const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/api/users/login`, { username, password });
  const token = response.data.token;
  localStorage.setItem('token', token);
  return token;
};

const authService = {
  login,
  getToken,
  clearToken,
  isTokenValid,
};

export default authService;