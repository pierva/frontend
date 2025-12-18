// src/services/laborService.js
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const listMonthly = async (params = {}) => {
  const res = await axios.get(`${API_URL}/api/analytics/labor/monthly`, {
    headers: authHeaders(),
    params,
  });
  return res.data;
};

const upsertMonthly = async (payload) => {
  const res = await axios.post(`${API_URL}/api/analytics/labor/monthly`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

const deleteMonthly = async (month) => {
  const res = await axios.delete(
    `${API_URL}/api/analytics/labor/monthly/${encodeURIComponent(month)}`,
    { headers: authHeaders() }
  );
  return res.data;
};

export default { listMonthly, upsertMonthly, deleteMonthly };
