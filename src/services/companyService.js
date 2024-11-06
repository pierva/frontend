import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Get all companies
const getCompanies = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/companies`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

// Create a new company
const createCompany = async (name) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/api/companies`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

const companyService = {
    getCompanies,
    createCompany,
};

export default companyService;
