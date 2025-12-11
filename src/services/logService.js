import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getLogs = async (page = 1, limit = 50, searchTerm = '', startDate = '', endDate = '') => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/logs`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, limit, searchTerm, startDate, endDate }
  });
  return response.data;
};

const getProducts = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const addLog = async (logData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/api/logs`, logData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const addBatchLogs = async (batchData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/api/logs/batch`, batchData, {
      headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Add the getIngredientsByLotCode method
const getIngredientsByLotCode = async (batchId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/logs/${batchId}/ingredients`, {
      headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};


/**
 * Fetch all logs across pages for a given date range & searchTerm.
 * Uses the existing getLogs signature/behavior.
 */
export async function fetchAllLogsInRange(limitPerPage = 200, searchTerm = '', startDate = '', endDate = '') {
  let page = 1;
  let all = [];
  // keep paging until totalPages is reached
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { logs = [], totalPages = 1 } = await getLogs(page, limitPerPage, searchTerm, startDate, endDate);
    all = all.concat(logs);
    if (page >= totalPages) break;
    page += 1;
  }
  return all;
}

/**
 * Aggregate logs into { 'YYYY-MM-DD': totalQuantity }.
 * Optional filter by productId.
 */
export function aggregateLogsByDate(logs, productId) {
  const out = {};
  logs.forEach(l => {
    if (productId && String(l.Product?.id || l.productId) !== String(productId)) return;
    const dateRaw = l.date_logged || l.date || l.createdAt;
    if (!dateRaw) return;
    const day = new Date(dateRaw).toISOString().split('T')[0];
    const qty = Number(l.quantity) || 0;
    out[day] = (out[day] || 0) + qty;
  });
  return out;
}

const logService = {
  getLogs,
  getProducts,
  addLog,
  addBatchLogs,
  getIngredientsByLotCode,
  fetchAllLogsInRange,
  aggregateLogsByDate
};

export default logService;
