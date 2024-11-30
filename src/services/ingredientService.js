import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

const ingredientService = {
  getIngredients: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/ingredients`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  createIngredient: async (ingredient) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/ingredients`, ingredient, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  updateIngredient: async (id, ingredient) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/api/ingredients/${id}`, ingredient, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

   // Delete an ingredient (Admin only)
   deleteIngredient: async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/api/ingredients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
    },
};


export default ingredientService;

   