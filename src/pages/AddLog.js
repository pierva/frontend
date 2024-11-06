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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProduct || !quantity || !lotCode) {
            setMessage('Please fill out all fields.');
            autoDismissMessage();
            return;
        }

        console.log(selectedProduct);
        
        try {
            await logService.addLog({
                productId: selectedProduct,
                quantity,
                lotCode,
            });

            setMessage(`Production log submitted for ${selectedProduct} (Lot Code: ${lotCode}, Quantity: ${quantity})`);
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
                        onChange={(e) => setSelectedProduct(e.target.value)}
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
