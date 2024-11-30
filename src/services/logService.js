import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getLogs = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/logs`, {
    headers: { Authorization: `Bearer ${token}` },
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
  const response = await axios.post(`${API_URL}/api/logs/batch-logs`, batchData, {
      headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};


const logService = {
  getLogs,
  getProducts,
  addLog,
  addBatchLogs
};

export default logService;
