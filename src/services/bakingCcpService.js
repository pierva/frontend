// src/services/bakingCcpService.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const getConfig = async () => {
  const res = await axios.get(`${API_URL}/api/analytics/ccp/baking/config`, {
    headers: authHeaders(),
  });
  return res.data;
};

const saveConfig = async (config) => {
  const res = await axios.put(`${API_URL}/api/analytics/ccp/baking/config`, config, {
    headers: authHeaders(),
  });
  return res.data;
};

const bakingCcpService = {
  getConfig,
  saveConfig,
};

export default bakingCcpService;