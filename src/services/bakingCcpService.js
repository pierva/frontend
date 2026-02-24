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
// (legacy - you can keep it even if you move to lotCode-first)
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
  // NEW expected payload: { batchId, productionDate, notes? }
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

const getRun = async (runId) => {
  const res = await axios.get(`${API_URL}/api/analytics/bakingccp/runs/${runId}`, {
    headers: authHeaders(),
  });
  return res.data;
};

// Live payload for iPad (run + carts + last temp + alerts meta)
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

// Complete / Verify
const completeRun = async (runId, payload) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/complete`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

const verifyRun = async (runId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/verify`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

// --------------------
// TEMPERATURE READINGS
// --------------------
// payload: { temperatureF, cartId?, takenAt? }
const addTempReading = async (runId, payload) => {
  console.log(payload);
  
  const res = await axios.post(
    `${API_URL}/api/analytics/bakingccp/runs/${runId}/temps`,
    payload,
    { headers: authHeaders() }
  );
  return res.data;
};

// --------------------
// CARTS (baking creates; packaging processes)
// --------------------

// Create new cart (baking team)
// payload: { productId, unitsInCart?, notes? }
const createCart = async (runId, payload) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/runs/${runId}/carts`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

// Mark cart blast-in (packaging team)
const markCartBlastIn = async (cartId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/carts/${cartId}/blast-in`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

// Mark cart blast-out (packaging team)
const markCartBlastOut = async (cartId) => {
  const res = await axios.post(`${API_URL}/api/analytics/bakingccp/carts/${cartId}/blast-out`, {}, {
    headers: authHeaders(),
  });
  return res.data;
};

const bakingCcpService = {
  // config
  getConfig,
  saveConfig,

  // legacy reference
  getBatches,

  // runs
  startRun,
  getActiveRun,
  getRun,
  getRunLive,
  pauseRun,
  resumeRun,
  stopBaking,
  completeRun,
  verifyRun,
  addTempReading,

  // carts
  createCart,
  markCartBlastIn,
  markCartBlastOut,
};

export default bakingCcpService;
