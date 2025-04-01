import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import PrintTraceabilityView from '../components/PrintTraceabilityView';
import moment from 'moment';
import { createRoot } from 'react-dom/client';
const API_URL = process.env.REACT_APP_API_URL;

function TraceabilityPage() {
  // Main data states
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);

  // Pagination state for traceability logs
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

   // New state: load all customers once and filter them for suggestions
   const [allCustomers, setAllCustomers] = useState([]);
   const [customerSuggestions, setCustomerSuggestions] = useState([]);

  // Form and search states for traceability log creation/editing
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [suggestedLotCodes, setSuggestedLotCodes] = useState({});
  const [customer, setCustomer] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [userRole, setUserRole] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchLotCode, setSearchLotCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editLogId, setEditLogId] = useState(null);

  // Ingredient lot code search states
  const [ingredientLotCode, setIngredientLotCode] = useState('');
  const [ingredientProducts, setIngredientProducts] = useState([]);
  const [ingredientBreakdown, setIngredientBreakdown] = useState([]);
  const [isIngredientSearchActive, setIsIngredientSearchActive] = useState(false);

  // New state for handling multiple product entries
  const [productEntries, setProductEntries] = useState([{ productId: '', lotCode: '', quantity: '' }]);

  // Handler to update a specific product entry field
  const handleProductEntryChange = (index, field, value) => {
    const updatedEntries = [...productEntries];
    updatedEntries[index][field] = value;
    setProductEntries(updatedEntries);
  };

  // Updated lot code input handler for a specific row
  const handleLotCodeInputChange = async (index, value) => {
    handleProductEntryChange(index, 'lotCode', value);
    if (value.length > 2) {
      try {
        const token = localStorage.getItem('token');
        const params = { query: value };
        // Optionally include productId if selected for this row
        if (productEntries[index].productId) {
          params.productId = productEntries[index].productId;
        }
        const response = await axios.get(`${API_URL}/api/traceability-logs/search-lot-codes`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuggestedLotCodes(prev => ({ ...prev, [index]: response.data }));
      } catch (error) {
        console.error('Error fetching lot code suggestions:', error);
      }
    } else {
      setSuggestedLotCodes(prev => ({ ...prev, [index]: [] }));
    }
  };
  

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/traceability-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 20 },
      });
      setLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
      setTotalLogs(response.data.totalLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !customer) {
      setMessage('Date and customer are required.');
      setMessageType('danger');
      return;
    }
    for (const entry of productEntries) {
      if (!entry.productId || !entry.lotCode || !entry.quantity) {
        setMessage('Please fill out all fields for each product.');
        setMessageType('danger');
        return;
      }
    }
    try {
      const token = localStorage.getItem('token');
      const newLog = {
        date: selectedDate,
        customer,
        productEntries, // sending the array of product entries
      };
      if (isEditing) {
        const editLog = { ...newLog, ...productEntries[0] };
        await axios.put(`${API_URL}/api/traceability-logs/${editLogId}`, editLog, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage('Traceability record updated successfully');
      } else {
        await axios.post(`${API_URL}/api/traceability-logs`, newLog, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage('Traceability record added successfully');
      }
      setMessageType('success');
      autoDismissMessage();
      setIsEditing(false);
      setEditLogId(null);
      resetFormFields();
      // Re-fetch logs immediately after submission
      await fetchLogs();
    } catch (error) {
      console.error('Error adding/updating traceability record:', error);
      setMessage('Error adding/updating traceability record');
      setMessageType('danger');
      autoDismissMessage();
    }
  };

  const addProductEntry = () => {
    setProductEntries([...productEntries, { productId: '', lotCode: '', quantity: '' }]);
  };

  const removeProductEntry = (index) => {
    setProductEntries(productEntries.filter((_, i) => i !== index));
  };


  const printRef = useRef();

  // Fetch products once on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        // Decode token to set user role
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
        const productsResponse = await axios.get(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(productsResponse.data);
      } catch (error) {
        setMessage('Error fetching products');
        setMessageType('danger');
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

   // Fetch all customers once on mount (for suggestions)
   useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Assume the response returns an array (or an object with a key 'customers')
        setAllCustomers(response.data.customers || response.data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchAllCustomers();
  }, []);

  // Fetch paginated traceability logs when currentPage changes
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/traceability-logs`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: currentPage, limit: 20 },
        });
        // The backend returns an object with logs, currentPage, totalPages, totalLogs
        setLogs(response.data.logs);
        setTotalPages(response.data.totalPages);
        setTotalLogs(response.data.totalLogs);
      } catch (error) {
        setMessage('Error fetching logs');
        setMessageType('danger');
        console.error('Error fetching logs:', error);
      }
    };
    fetchLogs();
  }, [currentPage]);

  // Customer input change: filter the locally stored allCustomers array
  const handleCustomerInputChange = (e) => {
    const value = e.target.value;
    setCustomer(value);
    if (value.length >= 2) {
      const suggestions = allCustomers.filter((cust) =>
        cust.name.toLowerCase().includes(value.toLowerCase())
      );
      setCustomerSuggestions(suggestions);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleSelectCustomer = (selectedCust) => {
    setCustomer(selectedCust.name);
    setCustomerSuggestions([]);
  };

  const handleSelectLotCode = (index, code) => {
    // Update the lotCode field for the specific product entry at index
    handleProductEntryChange(index, 'lotCode', code);
    // Clear the suggestions for this row so the dropdown closes
    setSuggestedLotCodes(prev => ({ ...prev, [index]: [] }));
  };

  // Handle in-page filtering of the main traceability logs table by lot code
  const handleSearchByLotCode = (e) => {
    const input = e.target.value;
    setSearchLotCode(input);
    if (input.length > 0) {
      const filtered = logs.filter((log) =>
        log.lotCode.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs([]);
    }
  };

  // Ingredient lot code search: fetch products and allocations using an ingredient lot code
  const handleSearchIngredientLotCode = async () => {
    if (!ingredientLotCode) {
      setMessage('Please enter an ingredient lot code');
      setMessageType('danger');
      autoDismissMessage();
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/traceability-logs/ingredient-lot-code`, {
        params: { ingredientLotCode },
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      // Create a breakdown summary for each product
      const breakdown = data.map((item) => ({
        productName: item.productName,
        batchLotCode: item.batchLotCode,
        quantityProduced: item.quantityProduced,
        quantityAllocated: item.quantityAllocated,
        quantityInInventory: item.quantityInInventory,
      }));
      // Flatten client allocations for detailed view
      const clients = data.flatMap((item) =>
        item.clients.map((client) => ({
          customer: client.customer,
          productName: item.productName,
          batchLotCode: item.batchLotCode,
          quantity: client.quantity,
          date: client.date,
        }))
      );
      setIngredientBreakdown(breakdown);
      setIngredientProducts(clients);
      setIsIngredientSearchActive(true);
    } catch (error) {
      console.error('Error searching by ingredient lot code:', error);
      if (error.response) {
        if (error.response.status === 404) {
          setMessage(error.response.data.message || 'No data found for the given ingredient lot code.');
        } else {
          setMessage('An error occurred: ' + (error.response.data.message || 'Please try again later.'));
        }
      } else {
        setMessage('Unable to fetch data. Please check your internet connection.');
      }
      setMessageType('danger');
      autoDismissMessage();
    }
  };

  const clearIngredientSearch = () => {
    setIngredientLotCode('');
    setIngredientProducts([]);
    setIngredientBreakdown([]);
    setIsIngredientSearchActive(false);
  };

  const autoDismissMessage = () => {
    setTimeout(() => setMessage(''), 3000);
  };

  const resetFormFields = () => {
    setSelectedDate('');
    setSelectedProduct('');
    setCustomer('');
    setProductEntries([{ productId: '', lotCode: '', quantity: '' }])
  };

  const handleEdit = (log) => {
    setSelectedDate(new Date(log.date).toISOString().split('T')[0]);
    setCustomer(log.customer);
    setProductEntries([{ productId: log.productId, lotCode: log.lotCode, quantity: log.quantity }]);
    setEditLogId(log.id);
    setIsEditing(true);
  };
  

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditLogId(null);
    resetFormFields();
  };
  

  const handlePrint = () => {
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Traceability Logs</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f4f4f4; }
          </style>
      </head>
      <body>
          <div id="print-content"></div>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    const container = printWindow.document.getElementById('print-content');
    const renderedContent = (
      <PrintTraceabilityView
        logs={filteredLogs.length > 0 ? filteredLogs : logs}
        ingredientBreakdown={ingredientBreakdown}
        ingredientProducts={ingredientProducts}
        isIngredientSearchActive={isIngredientSearchActive}
        ingredientLotCode={ingredientLotCode}
      />
    );
    const root = createRoot(container);
    root.render(renderedContent);
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="container mt-5">
      {message && (
        <div className="fixed-top mt-5 d-flex justify-content-center">
          <div className={`alert alert-${messageType} alert-dismissible fade show w-50`} role="alert">
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
          </div>
        </div>
      )}

      <h2>Traceability Page</h2>

      {/* Print Button */}
      {logs.length > 0 && (
        <button className="btn btn-secondary mt-3" onClick={handlePrint}>
          Print View
        </button>
      )}
      <hr/>
      {/* Search by Lot Code for traceability logs */}
      <div className="mb-3">
        <h4>Search by Lot Code</h4>
        <input
          type="text"
          className="form-control"
          placeholder="Enter Lot Code to search"
          onChange={handleSearchByLotCode}
          value={searchLotCode}
        />
      </div>
       {/* Ingredient Lot Code Search */}
       <div className="mb-4">
        <h4>Search Products by Ingredient Lot Code</h4>
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter Ingredient Lot Code"
            value={ingredientLotCode}
            onChange={(e) => setIngredientLotCode(e.target.value)}
          />
          <button
            className={`btn ${isIngredientSearchActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={isIngredientSearchActive ? clearIngredientSearch : handleSearchIngredientLotCode}
          >
            {isIngredientSearchActive ? 'Clear Search' : 'Search'}
          </button>
        </div>
      </div>
      <hr className='mt-5'/>
      <br/>
      {/* Form to add or edit a traceability record */}
      {(userRole !== 'client' || userRole === 'client') && (
        <form onSubmit={handleSubmit} className="mb-4">
          {/* Common fields */}
          <h3>Add a new traceability record</h3>
          <div className="row">
            <div className="col-md-6 col-12">
              <label>Date</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6 col-12" style={{ position: 'relative' }}>
            <label>Customer</label>
            <input
              type="text"
              className="form-control"
              value={customer}
              onChange={handleCustomerInputChange}
              required
            />
            {customerSuggestions.length > 0 && (
              <ul
                className="list-group position-absolute"
                style={{
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '150px',
                  overflowY: 'auto',
                  zIndex: 1000,
                }}
              >
                {customerSuggestions.map((cust) => (
                  <li
                    key={cust.id}
                    className="list-group-item"
                    style={{ cursor: 'pointer' }}
                    onMouseDown={() => handleSelectCustomer(cust)}
                  >
                    {cust.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>

          {/* Dynamic product entries */}
          <h4 className="mt-3">Products</h4>
          {productEntries.map((entry, index) => (
            <div key={index} className="row mb-3 align-items-end">
              <div className="col-md-4 col-12">
                <label>Product</label>
                <select
                  className="form-control"
                  value={entry.productId}
                  onChange={(e) => handleProductEntryChange(index, 'productId', e.target.value)}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 col-12 position-relative">
                <label>Lot Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={entry.lotCode}
                  onChange={(e) => handleLotCodeInputChange(index, e.target.value)}
                  required
                />
                {(suggestedLotCodes[index] || []).length > 0 && (
                  <ul
                    className="list-group mt-2 position-absolute w-100"
                    style={{ maxHeight: '150px', overflowY: 'auto', zIndex: 1000 }}
                  >
                    {(suggestedLotCodes[index] || []).map((code, idx) => (
                      <li
                        key={idx}
                        className="list-group-item"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={() => handleSelectLotCode(index, code)}
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                )}


              </div>
              <div className="col-md-2 col-12">
                <label>Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  value={entry.quantity}
                  onChange={(e) => handleProductEntryChange(index, 'quantity', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2 col-12">
                <button
                  type="button"
                  className="btn btn-danger w-100"
                  onClick={() => removeProductEntry(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
           {!isEditing && (
              <div className="d-flex justify-content-center mb-3">
                <button type="button" className="btn btn-secondary" onClick={addProductEntry}>
                  + Add Another Product
                </button>
              </div>
            )}
          {/* <button type="submit" className="btn btn-primary w-50"
            style={{ backgroundColor: isEditing ? 'orange' : undefined, borderColor: isEditing ? 'orange' : undefined }}
          >
            {isEditing ? 'Update Record' : 'Add Record'}
          </button> */}
         {isEditing ? (
  <div className="row">
    <div className="col-6">
      <button
        type="submit"
        className="btn w-100"
        style={{ backgroundColor: 'orange', borderColor: 'orange' }}
      >
        Update Record
      </button>
    </div>
    <div className="col-6">
      <button
        type="button"
        className="btn btn-secondary w-100"
        onClick={handleCancelEdit}
      >
        Cancel
      </button>
    </div>
  </div>
) : (
  <button type="submit" className="btn btn-primary w-100">
    Add Record
  </button>
)}

        </form>
      )}


      {/* Display Ingredient Search Results */}
      {isIngredientSearchActive && ingredientBreakdown.length > 0 && (
        <div className="mt-4">
          <h4>
            Products Breakdown with Ingredient LOT: <b>{ingredientLotCode}</b>
          </h4>
          <table className="table table-bordered table-responsive-sm">
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch Lot Code</th>
                <th>Quantity Produced</th>
                <th>Quantity Allocated</th>
                <th>Quantity in Inventory</th>
              </tr>
            </thead>
            <tbody>
              {ingredientBreakdown.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td>{item.batchLotCode}</td>
                  <td>{item.quantityProduced}</td>
                  <td>{item.quantityAllocated}</td>
                  <td>{item.quantityInInventory}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ingredientProducts.length > 0 && (
        <div className="mt-4">
          <h4>Products Distributed to Clients</h4>
          <table className="table table-bordered table-responsive-sm">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Batch Lot Code</th>
                <th>Quantity</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {ingredientProducts.map((client, index) => (
                <tr key={index}>
                  <td>{client.customer}</td>
                  <td>{client.productName}</td>
                  <td>{client.batchLotCode}</td>
                  <td>{client.quantity}</td>
                  <td>{moment.utc(client.date).format('MM/DD/YYYY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Main Traceability Logs Table with Pagination */}
      {!isIngredientSearchActive && (
        <div>
          <h3 className="mt-3">Traceability Table</h3>
          <table className="table table-bordered table-responsive-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Lot Code</th>
                <th>Quantity</th>
                <th>Customer</th>
                <th className="d-none d-md-table-cell">Logged By</th>
                {userRole === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(filteredLogs.length > 0 ? filteredLogs : logs).map((log) => (
                <tr key={log.id}>
                  <td>{moment.utc(log.date).format('MM/DD/YYYY')}</td>
                  <td>{log.Product?.name || 'N/A'}</td>
                  <td>{log.lotCode}</td>
                  <td>{log.quantity}</td>
                  <td>{log.customer}</td>
                  <td className="d-none d-md-table-cell">{log.logged_by || 'Unknown'}</td>
                  {userRole === 'admin' && (
                    <td>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEdit(log)}>
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center my-3">
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
              >
                &laquo; Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages}
              >
                Next &raquo;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden Print Section */}
      <div ref={printRef} style={{ display: 'none' }}>
        {/* <PrintTraceabilityView logs={filteredLogs.length > 0 ? filteredLogs : logs} /> */}
      </div>
    </div>
  );
}

export default TraceabilityPage;
