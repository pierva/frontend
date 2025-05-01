import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

export default {
  getLogs: (page, limit, token) =>
    axios.get(`${API_URL}/api/traceability-logs`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` },
    }),
  searchLotCodes: (query, productId, token) =>
    axios.get(`${API_URL}/api/traceability-logs/search-lot-codes`, {
      params: { query, productId },
      headers: { Authorization: `Bearer ${token}` },
    }),
  searchIngredient: (code, token) =>
    axios.get(`${API_URL}/api/traceability-logs/ingredient-lot-code`, {
      params: { ingredientLotCode: code },
      headers: { Authorization: `Bearer ${token}` },
    }),
  getCustomers: (token) =>
    axios.get(`${API_URL}/api/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getProducts: (token) =>
    axios.get(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  createLog: (payload, token) =>
    axios.post(`${API_URL}/api/traceability-logs`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateLog: (id, payload, token) =>
    axios.put(`${API_URL}/api/traceability-logs/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
