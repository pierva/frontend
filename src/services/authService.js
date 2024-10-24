import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/api/users/login`, { username, password });
  const token = response.data.token;
  localStorage.setItem('token', token); // Store token in local storage
  return token;
};

const authService = {
  login,
};

export default authService;
