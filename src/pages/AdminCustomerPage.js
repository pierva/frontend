import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

function AdminCustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [editCustomer, setEditCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  

  const fetchCustomers = async (page) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 30 }
      });
      // Assuming the response is in the format:
      // { customers: [...], total: x, page: y, totalPages: z }
      if (response.data.customers) {
        setCustomers(response.data.customers);
        setTotalPages(response.data.totalPages);
        
      } else {
        // fallback if response returns just an array
        setCustomers(response.data);
        setTotalPages(1);
      }
    } catch (error) {
      setMessage('Error fetching customers');
      setMessageType('danger');
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const customerData = {
        name: customerName,
        address: customerAddress,
        phone: customerPhone,
      };
      if (editCustomer) {
        await axios.put(`${API_URL}/api/customers/${editCustomer.id}`, customerData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage('Customer updated successfully');
      } else {
        await axios.post(`${API_URL}/api/customers`, customerData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage('Customer created successfully');
      }
      setMessageType('success');
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      setEditCustomer(null);
      fetchCustomers(currentPage);
    } catch (error) {
      let errorMsg = 'Error saving customer';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      setMessage(errorMsg);
      setMessageType('danger');
      console.error('Error saving customer:', error);
    }
  };

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setCustomerName(customer.name);
    setCustomerAddress(customer.address || '');
    setCustomerPhone(customer.phone || '');
  };

  const handleDelete = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Customer deleted successfully');
      setMessageType('success')
      fetchCustomers(currentPage);
    } catch (error) {
      setMessage('Error deleting customer');
      setMessageType('danger');
      console.error('Error deleting customer:', error);
    }
  };

  const autoDismissMessage = () => {
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="container mt-5">
      <h2>Manage Customers</h2>
      {message && (
        <div className={`alert alert-${messageType} alert-dismissible`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="mb-3">
          <label className="form-label">Customer Name</label>
          <input
            type="text"
            className="form-control"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Address (optional)</label>
          <input
            type="text"
            className="form-control"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone (optional)</label>
          <input
            type="text"
            className="form-control"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {editCustomer ? 'Update Customer' : 'Add Customer'}
        </button>
      </form>
      {customers.length === 0 ? (
        <div className="alert alert-info">No customers are present.</div>
      ) : (
        <CustomerTable
          customers={customers}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}
    </div>
  );
}

function CustomerTable({ customers, currentPage, totalPages, setCurrentPage, handleEdit, handleDelete }) {
  return (
    <>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>
              <td>{customer.name}</td>
              <td>{customer.address || '-'}</td>
              <td>{customer.phone || '-'}</td>
              <td>
                <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(customer)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(customer.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            &laquo; Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next &raquo;
          </button>
        </div>
      )}
    </>
  );
}

export default AdminCustomerPage;
