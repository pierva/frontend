// src/pages/TraceabilityPage.js
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Modal, Button } from 'react-bootstrap';
import TraceabilitySearchPanel from '../components/TraceabilitySearchPanel';
import TraceabilityForm from '../components/TraceabilityForm';
import TraceabilityTable from '../components/TraceabilityTable';
import Pagination from '../components/Pagination';
import PrintTraceabilityView from '../components/PrintTraceabilityView';
import { useTraceability } from '../hooks/useTraceability';
import service from '../services/traceabilityService';

export default function TraceabilityPage() {
  const token = localStorage.getItem('token');
  const { logs, page, totalPages, setPage, fetchPage } = useTraceability(20);

  // Search panel state
  const [searchLotCode, setSearchLotCode] = useState('');
  const [productSearchValue, setProductSearchValue] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);

  // Ingredient search state
  const [ingredientLotCode, setIngredientLotCode] = useState('');
  const [ingredientBreakdown, setIngredientBreakdown] = useState([]);
  const [ingredientProducts, setIngredientProducts] = useState([]);
  const [isIngredientSearchActive, setIsIngredientSearchActive] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });

  // Form state
  const [products, setProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [customer, setCustomer] = useState('');
  const [productEntries, setProductEntries] = useState([{ productId: '', lotCode: '', quantity: '' }]);
  const [suggestedLotCodes, setSuggestedLotCodes] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editLogId, setEditLogId] = useState(null);
  // User feedback messages
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Load products and customers once
  useEffect(() => {
    (async () => {
      try {
        const [prodsRes, custsRes] = await Promise.all([
          service.getProducts(token),
          service.getCustomers(token)
        ]);
        setProducts(prodsRes.data);
        setAllCustomers(custsRes.data.customers || custsRes.data);
      } catch (e) {
        console.error('Error loading products/customers', e);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Combine lot code and product name filtering
  useEffect(() => {
    if (!searchLotCode && !productSearchValue) {
      setFilteredLogs([]);
      return;
    }
    const fl = logs.filter(log => {
      const lotMatch = !searchLotCode || log.lotCode.toLowerCase().includes(searchLotCode.toLowerCase());
      const prodMatch = !productSearchValue || log.Product?.name.toLowerCase().includes(productSearchValue.toLowerCase());
      return lotMatch && prodMatch;
    });
    setFilteredLogs(fl);
  }, [searchLotCode, productSearchValue, logs]);

  // Handlers for search inputs
  const handleSearchByLotCode = e => setSearchLotCode(e.target.value);
  const handleSearchByProductName = e => setProductSearchValue(e.target.value);

  // Ingredient lot code search
  const handleIngredientSearch = async () => {
    if (!ingredientLotCode) {
      setErrorModal({ show: true, message: 'Please enter an ingredient lot code.' });
      return;
    }
    try {
      const resp = await service.searchIngredient(ingredientLotCode, token);
      const data = resp.data;
      if (!data || data.length === 0) {
        setErrorModal({ show: true, message: `No products found with ingredient '${ingredientLotCode}'.` });
        return;
      }
      const breakdown = data.map(item => ({
        productName: item.productName,
        batchLotCode: item.batchLotCode,
        quantityProduced: item.quantityProduced,
        quantityAllocated: item.quantityAllocated,
        quantityInInventory: item.quantityInInventory
      }));
      const clients = data.flatMap(item =>
        item.clients.map(c => ({
          customer: c.customer,
          productName: item.productName,
          batchLotCode: item.batchLotCode,
          quantity: c.quantity,
          date: c.date
        }))
      );
      setIngredientBreakdown(breakdown);
      setIngredientProducts(clients);
      setIsIngredientSearchActive(true);
    } catch (err) {
      console.error('Error searching by ingredient lot code', err);
      const msg = err.response?.data?.message || 'An unexpected error occurred while searching by ingredient lot code.';
      setErrorModal({ show: true, message: msg });
    }
  };
  const clearIngredientSearch = () => {
    setIngredientLotCode('');
    setIngredientBreakdown([]);
    setIngredientProducts([]);
    setIsIngredientSearchActive(false);
  };

  // Form handlers
  const handleDateChange = val => setSelectedDate(val);
  const handleCustomerChange = e => {
    const v = e.target.value;
    setCustomer(v);
    if (v.length >= 2) {
      setCustomerSuggestions(allCustomers.filter(c => c.name.toLowerCase().includes(v.toLowerCase())));
    } else {
      setCustomerSuggestions([]);
    }
  };
  const handleSelectCustomer = c => { setCustomer(c.name); setCustomerSuggestions([]); };
  const handleProductEntryChange = (i, f, v) => { const arr = [...productEntries]; arr[i][f] = v; setProductEntries(arr); };
  const handleLotCodeSelect = (i, code) => { handleProductEntryChange(i, 'lotCode', code); setSuggestedLotCodes(prev => ({ ...prev, [i]: [] })); };
  const addProductEntry = () => setProductEntries([...productEntries, { productId: '', lotCode: '', quantity: '' }]);
  const removeProductEntry = i => setProductEntries(pe => pe.filter((_, idx) => idx !== i));

  // Submit form (create or update)
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (isEditing) {
        const { productId, lotCode, quantity } = productEntries[0];
        await service.updateLog(editLogId,
          { date: selectedDate, customer, productId, lotCode, quantity }, token);
        setMessage('Traceability record updated successfully');
      } else {
        await service.createLog(
          { date: selectedDate, customer, productEntries }, token);
        setMessage('Traceability record added successfully');
      }
      setMessageType('success');
      // auto-dismiss message after 3s
      setTimeout(() => setMessage(''), 3000);

      setIsEditing(false); setEditLogId(null);
      setSelectedDate(''); setCustomer('');
      setProductEntries([{ productId: '', lotCode: '', quantity: '' }]);
      await fetchPage(1);
    } catch (err) {
      console.error('Error saving record', err);
      setErrorModal({ show: true, message: 'Error saving traceability record. Please try again.' });
    }
  };
  const handleEdit = log => {
    setSelectedDate(log.date.split('T')[0]);
    setCustomer(log.customer);
    setProductEntries([{ productId: log.productId, lotCode: log.lotCode, quantity: log.quantity }]);
    setIsEditing(true); setEditLogId(log.id);
  };
  const handleCancelEdit = () => {
    setIsEditing(false); setEditLogId(null);
    setSelectedDate(''); setCustomer('');
    setProductEntries([{ productId: '', lotCode: '', quantity: '' }]);
  };

  const printRef = useRef();
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
        logs={filteredLogs.length ? filteredLogs : logs}
        ingredientResults={ingredientBreakdown}
      />
    );
    const root = createRoot(container);
    root.render(renderedContent);
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="container mt-5 mb-4">
      {/* Feedback Messages */}
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
      <TraceabilitySearchPanel
        lotSearchValue={searchLotCode}
        onLotSearchChange={handleSearchByLotCode}
        productSearchValue={productSearchValue}
        onProductSearchChange={handleSearchByProductName}
        ingredientCode={ingredientLotCode}
        onIngredientCodeChange={setIngredientLotCode}
        onIngredientSearch={handleIngredientSearch}
        onIngredientClear={clearIngredientSearch}
        isIngredientActive={isIngredientSearchActive}
      />

      <TraceabilityForm
        userRole={JSON.parse(atob(token.split('.')[1])).role}
        isEditing={isEditing}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        customer={customer}
        onCustomerChange={handleCustomerChange}
        customerSuggestions={customerSuggestions}
        onSelectCustomer={handleSelectCustomer}
        productEntries={productEntries}
        onProductEntryChange={handleProductEntryChange}
        suggestedLotCodes={suggestedLotCodes}
        onLotCodeSelect={handleLotCodeSelect}
        addProductEntry={addProductEntry}
        removeProductEntry={removeProductEntry}
        onSubmit={handleSubmit}
        onCancelEdit={handleCancelEdit}
        products={products}
      />

      {/* Ingredient Search Results */}
      {isIngredientSearchActive && ingredientBreakdown.length > 0 && (
        <div className="mt-4">
          <h4>Products Breakdown for Ingredient {ingredientLotCode}</h4>
          <table className="table table-bordered">
            <thead><tr><th>Product</th><th>Batch</th><th>Produced</th><th>Allocated</th><th>In Inventory</th></tr></thead>
            <tbody>
              {ingredientBreakdown.map((item,i) => (
                <tr key={i}><td>{item.productName}</td><td>{item.batchLotCode}</td><td>{item.quantityProduced}</td><td>{item.quantityAllocated}</td><td>{item.quantityInInventory}</td></tr>
              ))}
            </tbody>
          </table>
          <h5 className="mt-3">Client Allocations</h5>
          <table className="table table-bordered">
            <thead><tr><th>Customer</th><th>Product</th><th>Batch</th><th>Quantity</th><th>Date</th></tr></thead>
            <tbody>
              {ingredientProducts.map((c,i) => (
                <tr key={i}><td>{c.customer}</td><td>{c.productName}</td><td>{c.batchLotCode}</td><td>{c.quantity}</td><td>{c.date.split('T')[0]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Main Logs & Pagination hidden during ingredient search */}
      {!isIngredientSearchActive && (
        <>
          <TraceabilityTable
            logs={logs}
            filteredLogs={filteredLogs}
            isFiltered={!!searchLotCode || !!productSearchValue}
            userRole={JSON.parse(atob(token.split('.')[1])).role}
            onEdit={handleEdit}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage(page - 1)}
            onNext={() => setPage(page + 1)}
          />
        </>
      )}

      {/* Error Modal */}
      <Modal show={errorModal.show} onHide={() => setErrorModal({ show: false, message: '' })}>
        <Modal.Header closeButton style={{ backgroundColor: '#007bff', color: 'white' }}>
          <Modal.Title style={{ color: 'white' }}>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>{errorModal.message}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setErrorModal({ show: false, message: '' })}>OK</Button>
        </Modal.Footer>
      </Modal>

      {/* Hidden Print Section */}
      <div ref={printRef} style={{ display: 'none' }}>
        <PrintTraceabilityView
          logs={filteredLogs.length ? filteredLogs : logs}
          ingredientResults={ingredientBreakdown}
        />
      </div>
    </div>
  );
}
