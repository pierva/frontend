// src/services/bakingCcpService.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// --------------------
// CONFIG (admin)
// --------------------
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

// --------------------
// REFERENCE DATA
// --------------------
const getBatches = async () => {
  const res = await axios.get(`${API_URL}/api/analytics/bakingccp/batches`, {
    headers: authHeaders(),
  });
  return res.data;
};

// --------------------
// RUNS
// --------------------
const startRun = async (payload) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/start`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

const getActiveRun = async () => {
  const res = await axios.get(`${API_URL}/api/analytics/bakingccp/runs/active`, {
    headers: authHeaders(),
  });
  return res.data;
};

// ✅ QA review queue — fetch runs by status (default: COMPLETED)
const getRuns = async (status = 'COMPLETED') => {
  const res = await axios.get(`${API_URL}/api/analytics/bakingccp/runs`, {
    headers: authHeaders(),
    params: { status },
  });
  return res.data;
};

const getRun = async (runId) => {
  const res = await axios.get(`${API_URL}/api/analytics/bakingccp/runs/${runId}`, {
    headers: authHeaders(),
  });
  return res.data;
};

const getRunLive = async (runId) => {
  const res = await axios.get(`${API_URL}/api/analytics/bakingccp/runs/${runId}/live`, {
    headers: authHeaders(),
  });
  return res.data;
};

// Baking controls
const pauseRun = async (runId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/pause`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

const resumeRun = async (runId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/resume`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

const stopBaking = async (runId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/stop-baking`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

const completeRun = async (runId, payload) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/complete`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

// Legacy verify (kept for backward compatibility)
const verifyRun = async (runId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/verify`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

// ✅ QA: fetch ingredient lot codes for a batch
const getBatchIngredients = async (batchId) => {
  const res = await axios.get(`${API_URL}/api/logs/${batchId}/ingredients`, {
    headers: authHeaders(),
  });
  return res.data;
};

// ✅ QA: bulk-update ingredient lot codes before verifying
const updateBatchIngredients = async (batchId, ingredients) => {
  const res = await axios.put(`${API_URL}/api/logs/${batchId}/ingredients`, { ingredients }, {
    headers: authHeaders(),
  });
  return res.data;
};

// ✅ QA: verify + create ProductionLog in one transaction
const verifyAndLog = async (runId, payload) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/verify-and-log`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

// --------------------
// TEMPERATURE READINGS
// --------------------
const addTempReading = async (runId, payload) => {
  const res = await axios.post(
    `${API_URL}/api/analytics/bakingccp/runs/${runId}/temps`,
    payload,
    { headers: authHeaders() }
  );
  return res.data;
};

// --------------------
// CARTS
// --------------------
const createCart = async (runId, payload) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/carts`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

const markCartBlastIn = async (cartId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/carts/${cartId}/blast-in`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

const markCartBlastOut = async (cartId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/carts/${cartId}/blast-out`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

const bakingCcpService = {
  getConfig,
  saveConfig,
  getBatches,
  startRun,
  getActiveRun,
  getRuns,
  getRun,
  getRunLive,
  pauseRun,
  resumeRun,
  stopBaking,
  completeRun,
  verifyRun,
  verifyAndLog,
  getBatchIngredients,
  updateBatchIngredients,
  addTempReading,
  createCart,
  markCartBlastIn,
  markCartBlastOut,
};

export default bakingCcpService;