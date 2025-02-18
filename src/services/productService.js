import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getProducts = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

const createProduct = async (name, companyId, recipe) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/api/products`,
        { name, companyId, recipe },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

const updateProduct = async (id, name, companyId, recipe) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
        `${API_URL}/api/products/${id}`,
        { name, companyId, recipe },
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
  
  const productService = {
    getProducts,
    createProduct,
    updateProduct,
    getProductRecipe,  // Add getProductRecipe to the exported service
  };

export default productService;
