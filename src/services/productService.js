import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getProducts = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

const createProduct = async (name, companyId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/api/products`,
        { name, companyId },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

const updateProduct = async (id, name, companyId) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
        `${API_URL}/api/products/${id}`,
        { name, companyId },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

const productService = {
    getProducts,
    createProduct,
    updateProduct,
};

export default productService;
