import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const ordersService = {
    // Fetch all orders
    getOrders: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/orders`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Fetch products for orders
    getProducts: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/products`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Create a new order
    createOrder: async (order) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/api/orders`, order, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Fulfill an order by adding a lot code
    fulfillOrder: async (orderId, lotCode) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            `${API_URL}/api/orders/fulfill/${orderId}`, // Correct route and method
            { lotCode },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    },

    // Update an order (Admin only)
    updateOrder: async (orderId, updatedOrder) => {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/api/orders/${orderId}`, updatedOrder, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    // Delete an order (Admin only)
    deleteOrder: async (orderId) => {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_URL}/api/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};

export default ordersService;
