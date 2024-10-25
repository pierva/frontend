import React, { useState } from 'react';
import logService from '../services/logService';

function AddLog() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [message, setMessage] = useState('');

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !lotCode) {
      setMessage('Please fill out all fields.');
      return;
    }

    try {
      await logService.addLog({
        product: selectedProduct,
        quantity,
        lotCode,
      });

      setMessage(`Production log submitted for ${selectedProduct} (Lot Code: ${lotCode}, Quantity: ${quantity})`);

      // Clear form fields
      setSelectedProduct('');
      setQuantity('');
      setLotCode('');
    } catch (error) {
      console.error('Error submitting production log:', error);
      setMessage('Error submitting production log.');
    }
  };

  return (
    <div className="container mt-5">
        
      <h2>Add Production Log</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product</label>
          <input
            type="text"
            className="form-control"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            required
          />
        </div>

        <div className="form-group mt-3">
          <label>Quantity</label>
          <input
            type="number"
            className="form-control"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="form-group mt-3">
          <label>Lot Code</label>
          <input
            type="text"
            className="form-control"
            value={lotCode}
            onChange={(e) => setLotCode(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary mt-3">
          Submit Production Log
        </button>
      </form>

      {message && <div className="mt-3 alert alert-info">{message}</div>}
    </div>
  );
}

export default AddLog;
