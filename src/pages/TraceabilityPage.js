import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

function TraceabilityPage() {
    const [products, setProducts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [lotCode, setLotCode] = useState('');
    const [suggestedLotCodes, setSuggestedLotCodes] = useState([]);
    const [quantity, setQuantity] = useState('');
    const [customer, setCustomer] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); // New state for message type
    const [userRole, setUserRole] = useState('');
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [searchLotCode, setSearchLotCode] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editLogId, setEditLogId] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                setUserRole(decodedToken.role);

                const productsResponse = await axios.get(`${API_URL}/api/products`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProducts(productsResponse.data);

                const logsResponse = await axios.get(`${API_URL}/api/traceability-logs`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLogs(logsResponse.data);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchInitialData();
    }, []);

    const handleLotCodeInputChange = async (e) => {
        const input = e.target.value;
        setLotCode(input);

        if (input.length > 2) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/traceability-logs/search-lot-codes`, {
                    params: { query: input },
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSuggestedLotCodes(response.data);
            } catch (error) {
                console.error('Error fetching lot code suggestions:', error);
            }
        } else {
            setSuggestedLotCodes([]);
        }
    };

    const handleSelectLotCode = (code) => {
        setLotCode(code);
        setSuggestedLotCodes([]);
    };

    const handleSearchByLotCode = (e) => {
        const input = e.target.value;
        setSearchLotCode(input);

        if (input.length > 0) {
            const filtered = logs.filter((log) => log.lotCode.toLowerCase().includes(input.toLowerCase()));
            setFilteredLogs(filtered);
        } else {
            setFilteredLogs([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const newLog = {
                date: selectedDate,
                productId: selectedProduct,
                lotCode,
                quantity,
                customer,
            };

            if (isEditing) {
                await axios.put(`${API_URL}/api/traceability-logs/${editLogId}`, newLog, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessage('Traceability record updated successfully');
                setMessageType('success');
            } else {
                await axios.post(`${API_URL}/api/traceability-logs`, newLog, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessage('Traceability record added successfully');
                setMessageType('success');
            }

            autoDismissMessage();
            setIsEditing(false);
            setEditLogId(null);
            resetFormFields();

            const updatedLogs = await axios.get(`${API_URL}/api/traceability-logs`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLogs(updatedLogs.data);
        } catch (error) {
            console.error('Error adding/updating traceability record:', error);
            setMessage('Error adding/updating traceability record');
            setMessageType('error');
            autoDismissMessage();
        }
    };

    const autoDismissMessage = () => {
        setTimeout(() => setMessage(''), 3000);
    };

    const resetFormFields = () => {
        setSelectedDate('');
        setSelectedProduct('');
        setLotCode('');
        setQuantity('');
        setCustomer('');
    };

    const handleEdit = (log) => {
        setSelectedDate(new Date(log.date).toISOString().split('T')[0]);
        setSelectedProduct(log.productId);
        setLotCode(log.lotCode);
        setQuantity(log.quantity);
        setCustomer(log.customer);
        setEditLogId(log.id);
        setIsEditing(true);
    };

    return (
        <div className="container mt-5">
            {message && (
                <div className={`fixed-top mt-5 d-flex justify-content-center`}>
                    <div className={`alert alert-${messageType} alert-dismissible fade show w-50`} role="alert">
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                </div>
            )}

            <h2>Traceability Page</h2>

            {/* Search by Lot Code */}
            <div className="mb-3">
                <label>Search by Lot Code</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Lot Code to search"
                    onChange={handleSearchByLotCode}
                    value={searchLotCode}
                />
            </div>

            {/* Form to add/edit a traceability record */}
            {(userRole !== 'client' || userRole === 'client') && (
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="row">
                        <div className="col-md-3">
                            <label>Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-3">
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
                        <div className="col-md-6 position-relative">
                            <label>Lot Code</label>
                            <input
                                type="text"
                                className="form-control"
                                value={lotCode}
                                onChange={handleLotCodeInputChange}
                                placeholder="Enter or select a lot code"
                                required
                            />
                            {suggestedLotCodes.length > 0 && (
                                <ul
                                    className="list-group mt-2 position-absolute w-100"
                                    style={{
                                        maxHeight: '150px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                    }}
                                >
                                    {suggestedLotCodes.map((code, index) => (
                                        <li
                                            key={index}
                                            className="list-group-item"
                                            onClick={() => handleSelectLotCode(code)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {code}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="row mt-3">
                        <div className="col-md-3">
                            <label>Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-9">
                            <label>Customer</label>
                            <input
                                type="text"
                                className="form-control"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary mt-3">
                        {isEditing ? 'Update Record' : 'Add Record'}
                    </button>
                </form>
            )}

            {/* Display logs */}
            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Lot Code</th>
                        <th>Quantity</th>
                        <th>Customer</th>
                        <th>Logged By</th>
                        {userRole === 'admin' && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {(filteredLogs.length > 0 ? filteredLogs : logs).map((log) => (
                        <tr key={log.id}>
                            <td>{new Date(log.date).toLocaleDateString()}</td>
                            <td>{log.Product?.name || 'N/A'}</td>
                            <td>{log.lotCode}</td>
                            <td>{log.quantity}</td>
                            <td>{log.customer}</td>
                            <td>{log.logged_by || 'Unknown'}</td>
                            {userRole === 'admin' && (
                                <td>
                                    <button
                                        className="btn btn-warning btn-sm"
                                        onClick={() => handleEdit(log)}
                                    >
                                        Edit
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TraceabilityPage;
