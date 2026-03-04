import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getProducts = async ({ includeInactive = false } = {}) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: includeInactive ? { includeInactive: 'true' } : {},
    });
    return response.data;
};

const createProduct = async (name, companyId, recipe, defaultUnitsPerCart) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/api/products`,
        { name, companyId, recipe, defaultUnitsPerCart: defaultUnitsPerCart !== '' ? defaultUnitsPerCart : null },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

const updateProduct = async (id, name, companyId, recipe, defaultUnitsPerCart) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
        `${API_URL}/api/products/${id}`,
        { name, companyId, recipe, defaultUnitsPerCart: defaultUnitsPerCart !== '' ? defaultUnitsPerCart : null },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

// New: Get the product recipe (i.e. the ingredient IDs associated with the product)
const getProductRecipe = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/products/${id}/recipe`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  };
  
const getRecipeCosts = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/products/recipe-costs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // [{ productId, estimatedCostPerUnit }]
};

const reorderProducts = async (orders) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`${API_URL}/api/products/reorder`, { orders }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const toggleActive = async (id) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`${API_URL}/api/products/${id}/toggle-active`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // { id, isActive }
};

  const productService = {
    getProducts,
    createProduct,
    updateProduct,
    getProductRecipe,
    getRecipeCosts,
    reorderProducts,
    toggleActive,
  };

export default productService;
