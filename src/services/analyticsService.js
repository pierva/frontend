import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

const getComplaintsSummary = async (filters = {}) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/analytics/widgets/complaints.summary`, {
    headers: { Authorization: `Bearer ${token}` },
    params: filters
  });
  return response.data;
};

export default { getComplaintsSummary };
