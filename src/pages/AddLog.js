import React, { useState, useEffect } from 'react';
import logService from '../services/logService'; // Single service for both products and logs

function AddLog() {
    const [products, setProducts] = useState([]); // Store available products
    const [selectedProduct, setSelectedProduct] = useState(''); // Track selected product
    const [quantity, setQuantity] = useState(''); // Track quantity
    const [lotCode, setLotCode] = useState(''); // Track lot code
    const [logs, setLogs] = useState([]); // Store production logs
    const [message, setMessage] = useState('');

    // Fetch products and logs from the backend when the component mounts
    useEffect(() => {
        const loadProductsAndLogs = async () => {
            try {
                const productsData = await logService.getProducts(); // Fetch products
                setProducts(productsData);

                const logsData = await logService.getLogs(); // Fetch production logs
                setLogs(logsData || []);
            } catch (error) {
                console.error('Error loading products or logs:', error);
            }
        };

        loadProductsAndLogs();
    }, []);

    // Handle form submission for logging production
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProduct || !quantity || !lotCode) {
            setMessage('Please fill out all fields.');
            return;
        }

        try {
            // Send the production log data to the backend using logService

            await logService.addLog({
                product: selectedProduct,   // Ensure we're sending the selected product
                quantity,                   // Sending quantity
                lotCode,                    // Ensure we're sending the lotCode
            });

            setMessage(`Production log submitted for ${selectedProduct} (Lot Code: ${lotCode}, Quantity: ${quantity})`);

            // Reload logs to reflect the newly added entry
            const logsData = await logService.getLogs();
            setLogs(logsData);

            // Reset form fields after submission
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
                    <select
                        className="form-control"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)} // Capture selected product
                        required
                    >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.name}>
                                {product.name} ({product.company})
                            </option>
                        ))}
                    </select>
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
