// src/services/complaintService.js
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Existing (you already have these)
const getCategories = async () => {
  const res = await axios.get(`${API_URL}/api/complaints/categories`, { headers: authHeaders() });
  return res.data;
};

const createCategory = async (payload) => {
  const res = await axios.post(`${API_URL}/api/complaints/categories`, payload, { headers: authHeaders() });
  return res.data;
};

const updateCategory = async (id, payload) => {
  const res = await axios.put(`${API_URL}/api/complaints/categories/${id}`, payload, { headers: authHeaders() });
  return res.data;
};

const getGuidanceRules = async (categoryId = '') => {
  const res = await axios.get(`${API_URL}/api/complaints/guidance-rules`, {
    headers: authHeaders(),
    params: categoryId ? { categoryId } : {}
  });
  return res.data;
};

const createGuidanceRule = async (payload) => {
  const res = await axios.post(`${API_URL}/api/complaints/guidance-rules`, payload, { headers: authHeaders() });
  return res.data;
};

const updateGuidanceRule = async (id, payload) => {
  const res = await axios.put(`${API_URL}/api/complaints/guidance-rules/${id}`, payload, { headers: authHeaders() });
  return res.data;
};

// NEW: complaints CRUD
const createComplaint = async (payload) => {
  const res = await axios.post(`${API_URL}/api/complaints`, payload, { headers: authHeaders() });
  return res.data;
};

// NEW: products (reuse existing logService.getProducts if you prefer)
const getProducts = async () => {
  const res = await axios.get(`${API_URL}/api/products`, { headers: authHeaders() });
  return res.data;
};

// NEW: batch search by lotCode partial
// You can implement this endpoint or reuse an existing one if you already have it.
const searchBatches = async (q) => {
  const res = await axios.get(`${API_URL}/api/batch/search`, {
    headers: authHeaders(),
    params: { q }
  });
  return res.data;
};

const getComplaints = async (filters = {}) => {
  const response = await axios.get(`${API_URL}/api/complaints`, {
    headers: authHeaders(),
    params: filters,
  });
  return response.data;
};

const updateComplaint = async (id, payload) => {
  const res = await axios.put(`${API_URL}/api/complaints/${id}`, payload, { headers: authHeaders() });
  return res.data;
};

const deleteComplaint = async (id) => {
  const res = await axios.delete(`${API_URL}/api/complaints/${id}`, { headers: authHeaders() });
  return res.data;
};


export default {
  getCategories,
  createCategory,
  updateCategory,
  getGuidanceRules,
  createGuidanceRule,
  updateGuidanceRule,
  createComplaint,
  getProducts,
  searchBatches,
  getComplaints,
  updateComplaint,
  deleteComplaint
};
