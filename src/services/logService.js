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

export const aggregateLogsByDate = (
  logs,
  productIdFilter = null,
  startDate = '',
  endDate = ''
) => {
  const byDate = {};

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) {
    end.setHours(23, 59, 59, 999); // make end date inclusive
  }

  logs.forEach((log) => {
    // Prefer Batch.production_date; fallback to date_logged if needed
    const rawDate =
      log.Batch?.production_date ||
      log.Batch?.productionDate || // in case of camelCase somewhere
      log.date_logged ||
      log.createdAt;

    if (!rawDate) return;

    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return;

    // Filter by production date range
    if (start && d < start) return;
    if (end && d > end) return;

    // Optional product filter
    if (
      productIdFilter &&
      String(log.productId) !== String(productIdFilter)
    ) {
      return;
    }

    // Group by YYYY-MM-DD
    const key = d.toISOString().split('T')[0];

    if (!byDate[key]) byDate[key] = 0;
    byDate[key] += log.quantity || 0;
  });

  return byDate;
};


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
