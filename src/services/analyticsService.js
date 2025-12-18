import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const getComplaintsSummary = async (filters = {}) => {
  const response = await axios.get(`${API_URL}/api/analytics/widgets/complaints.summary`, {
    headers: authHeaders(),
    params: filters
  });
  return response.data;
};

const getWidgetConfig = async (widgetKey) => {
  const res = await axios.get(`${API_URL}/api/analytics/widgets/config/${widgetKey}`, { headers: authHeaders() });
  return res.data;
};

const saveWidgetConfig = async (widgetKey, config) => {
  const res = await axios.put(`${API_URL}/api/analytics/widgets/config/${widgetKey}`, { config }, { headers: authHeaders() });
  return res.data;
};

export default { 
  getComplaintsSummary,
  getWidgetConfig, 
  saveWidgetConfig
};
