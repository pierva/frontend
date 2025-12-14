// src/services/complaintsService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Temporary mock fallback (so UI works immediately)
const mock = ({ month }) => {
  // create a few sample points
  const start = new Date(`${month}-01T00:00:00`);
  const points = Array.from({ length: 10 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 3);
    return { date: d.toISOString().slice(0, 10), count: Math.floor(Math.random() * 5) };
  });

  return {
    products: [],
    categories: ['Missing topping', 'Quality', 'Packaging', 'Frozen damage', 'Other'],
    kpis: { complaintsPer10k: 1.25, severity3Count: 2, capaTriggered: true },
    timeSeries: points,
    byCategory: [
      { category: 'Packaging', count: 4 },
      { category: 'Missing topping', count: 3 },
      { category: 'Quality', count: 2 },
      { category: 'Other', count: 1 }
    ]
  };
};

const getComplaintTrends = async (filters) => {
  const token = localStorage.getItem('token');

  // If you already have an endpoint, use this:
  // const response = await axios.get(`${API_URL}/api/complaints/trends`, {
  //   headers: { Authorization: `Bearer ${token}` },
  //   params: filters
  // });
  // return response.data;

  // Otherwise, return mock for now:
  return mock(filters);
};

export default { getComplaintTrends };
