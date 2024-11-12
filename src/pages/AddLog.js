import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Use QRCodeCanvas or QRCodeSVG
import logService from '../services/logService';

function AddLog() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [lotCode, setLotCode] = useState('');
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState('');
    const [generatedQRCode, setGeneratedQRCode] = useState(''); // State for QR code data

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

    const generatePizzaciniLotCode = () => {
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2);
        const day = String(today.getDate()).padStart(2, '0');
        const monthLetters = 'ABCDEFGHIJKL';
        const month = monthLetters[today.getMonth()];

        return `${month}-1${year}${day}1`;
    };

    const handleProductChange = (e) => {
        const selectedProductId = e.target.value;
        setSelectedProduct(selectedProductId);

        const selectedProductData = products.find(product => product.id === parseInt(selectedProductId));
        if (selectedProductData && selectedProductData.Company && selectedProductData.Company.name === 'PIZZACINI') {
            setLotCode(generatePizzaciniLotCode());
        } else {
            setLotCode('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProduct || !quantity || !lotCode) {
            setMessage('Please fill out all fields.');
            autoDismissMessage();
            return;
        }

        try {
            const selectedProductName = products.find(product => product.id === parseInt(selectedProduct))?.name || 'Unknown Product';
            const newLog = {
                productId: selectedProduct,
                quantity,
                lotCode: lotCode.trim().toUpperCase(), // Ensure uppercase and trimmed
            };

            await logService.addLog(newLog);

            setMessage(`Production log submitted for ${selectedProductName} (Lot Code: ${lotCode}, Quantity: ${quantity})`);
            setGeneratedQRCode(`Product: ${selectedProductName}\nDate: ${new Date().toLocaleDateString()}\nLot Code: ${lotCode}`); // Set QR code data
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
        setLotCode(e.target.value.toUpperCase());
    };

    return (
        <div className="container mt-5">
            <h2>Add Production Log</h2>

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
