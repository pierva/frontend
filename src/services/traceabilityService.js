import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const traceabilityService = {
  // Fetch paginated traceability logs
  async getLogs(page, limit, token) {
    const resp = await axios.get(`${API_URL}/api/traceability-logs`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp;
  },

  // Search by ingredient lot code
  async searchIngredient(ingredientLotCode, token) {
    const resp = await axios.get(
      `${API_URL}/api/traceability-logs/ingredient-lot-code`,
      {
        params: { ingredientLotCode },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return resp;
  },

  // Fetch all products
  async getProducts(token) {
    const resp = await axios.get(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp;
  },

  // Fetch all customers
  async getCustomers(token) {
    const resp = await axios.get(`${API_URL}/api/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp;
  },

  // Create a new traceability record
  async createLog(payload, token) {
    const resp = await axios.post(
      `${API_URL}/api/traceability-logs`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return resp;
  },

  // Update an existing traceability record
  async updateLog(id, payload, token) {
    const resp = await axios.put(
      `${API_URL}/api/traceability-logs/${id}`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return resp;
  },
};

export default traceabilityService;