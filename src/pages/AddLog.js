import React, { useState, useEffect } from 'react';
import logService from '../services/logService';

function AddLog() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [lotCode, setLotCode] = useState('');
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadProductsAndLogs = async () => {
            try {
                const productsData = await logService.getProducts();
                setProducts(productsData);

                const logsData = await logService.getLogs();
                setLogs(logsData || []);
            } catch (error) {
                console.error('Error loading products or logs:', error);
            }
        };

        loadProductsAndLogs();
    }, []);

       // Function to generate the PIZZACINI lot code
       const generatePizzaciniLotCode = () => {
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2); // Last two digits of the year
        const day = String(today.getDate()).padStart(2, '0'); // Day of the month, zero-padded
        const monthLetters = 'ABCDEFGHIJKL'; // Mapping months to letters
        const month = monthLetters[today.getMonth()]; // Get the letter for the current month

        return `${month}-1${year}${day}1`; // Format: L-1YYDD1
    };

      // Handle product change to pre-fill lot code for PIZZACINI products
      const handleProductChange = (e) => {
        const selectedProductId = e.target.value;
        setSelectedProduct(selectedProductId);

        // Find the selected product in the products list
        const selectedProductData = products.find(product => product.id === parseInt(selectedProductId));

        // Check if the selected product belongs to PIZZACINI
        if (selectedProductData && selectedProductData.Company && selectedProductData.Company.name === 'PIZZACINI') {
            setLotCode(generatePizzaciniLotCode());
        } else {
            setLotCode(''); // Clear lot code if not PIZZACINI
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!selectedProduct || !quantity || !lotCode) {
            setMessage('Please fill out all fields.');
            autoDismissMessage();
            return;
        }
    
        // Trim and convert the lot code to uppercase before saving
        const formattedLotCode = lotCode.trim().toUpperCase();
    
        try {
            await logService.addLog({
                productId: selectedProduct,
                quantity,
                lotCode: formattedLotCode, // Use the formatted lot code
            });
    
            setMessage(`Production log submitted for ${selectedProduct} (Lot Code: ${formattedLotCode}, Quantity: ${quantity})`);
            autoDismissMessage();
    
            const logsData = await logService.getLogs();
            setLogs(logsData);
    
            setSelectedProduct('');
            setQuantity('');
            setLotCode('');
        } catch (error) {
            console.error('Error submitting production log:', error);
            setMessage('Error submitting production log.');
            autoDismissMessage();
        }
    };

    const autoDismissMessage = () => {
        setTimeout(() => setMessage(''), 3000);
    };

    const handleLotCodeChange = (e) => {
        setLotCode(e.target.value.toUpperCase()); // Enforce uppercase
    };

    return (
        <div className="container mt-5">
            <h2>Add Production Log</h2>

            {/* Alert Message */}
            {message && (
                <div className="fixed-top mt-5 d-flex justify-content-center">
                    <div className="alert alert-success alert-dismissible fade show w-50" role="alert">
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                </div>
            )}

<form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Product</label>
                    <select
                        className="form-control"
                        value={selectedProduct}
                        onChange={handleProductChange}
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
                        onChange={handleLotCodeChange}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary mt-3">
                    Submit Production Log
                </button>
            </form>
        </div>
    );
}

export default AddLog;
