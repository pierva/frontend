import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ordersService from '../services/ordersService';
import { FaEdit, FaTrash, FaCheck } from 'react-icons/fa'; // Import icons

const API_URL = process.env.REACT_APP_API_URL;

function FactoryOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [lotCodes, setLotCodes] = useState({});
    const [suggestedLotCodes, setSuggestedLotCodes] = useState({}); // Store suggestions for each order
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const orders = await ordersService.getOrders();
                setOrders(orders);

                const token = localStorage.getItem('token');
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                setUserRole(decodedToken.role);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Failed to fetch orders.');
                autoDismissMessage('error');
            }
        };

        fetchOrders();
    }, []);

    const handleLotCodeChange = async (orderId, value, productId) => {
        setLotCodes({ ...lotCodes, [orderId]: value.trim().toUpperCase() }); // Update input value

        // Fetch suggestions if input length > 2
        if (value.trim().length > 2) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/traceability-logs/search-lot-codes`, {
                    params: { query: value.trim(), productId },
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSuggestedLotCodes({ ...suggestedLotCodes, [orderId]: response.data });
            } catch (err) {
                console.error('Error fetching lot codes:', err);
                setError('Failed to fetch lot codes.');
                autoDismissMessage('error');
            }
        } else {
            setSuggestedLotCodes({ ...suggestedLotCodes, [orderId]: [] }); // Clear suggestions if input is short
        }
    };

    const handleSelectLotCode = (orderId, lotCode) => {
        setLotCodes({ ...lotCodes, [orderId]: lotCode });
        setSuggestedLotCodes({ ...suggestedLotCodes, [orderId]: [] }); // Clear suggestions
    };

    const handleFulfillOrder = async (orderId) => {
        try {
            const lotCode = lotCodes[orderId]?.trim().toUpperCase();
            if (!lotCode) {
                setError('Lot code is required.');
                return;
            }

            await ordersService.fulfillOrder(orderId, lotCode);

            setMessage('Order fulfilled successfully.');
            setOrders(orders.filter((order) => order.id !== orderId)); // Remove the fulfilled order
        } catch (err) {
            console.error('Error fulfilling order:', err);
            setError('Failed to fulfill order.');
            autoDismissMessage('error');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            await ordersService.deleteOrder(orderId);
            setMessage('Order deleted successfully.');
            autoDismissMessage('success');
            setOrders(orders.filter((order) => order.id !== orderId)); // Remove deleted order
        } catch (err) {
            console.error('Error deleting order:', err);
            setError('Failed to delete order.');
            autoDismissMessage('error');
        }
    };

    const handleEditOrder = (order) => {
        setEditingOrder(order);
    };

    const handleUpdateOrder = async (e) => {
        e.preventDefault();
        try {            
            await ordersService.updateOrder(editingOrder.id, editingOrder);
            setMessage('Order updated successfully.');
            autoDismissMessage('success');
            setEditingOrder(null);

            const updatedOrders = await ordersService.getOrders();
            setOrders(updatedOrders);
        } catch (err) {
            console.error('Error updating order:', err);
            setError('Failed to update order.');
            autoDismissMessage('error');
        }
    };

    const autoDismissMessage = (type) => {
        setTimeout(() => {
            if (type === 'success') setMessage('');
            if (type === 'error') setError('');
        }, 3000);
    };

    return (
        <div className="container mt-5">
            <h2>Factory Orders Management</h2>

            {message && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {message}
                    <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
            )}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

{editingOrder && (
                <form onSubmit={handleUpdateOrder} className="mb-4">
                    <h4>Update Order</h4>
                    <div className="form-group mt-3">
                        <label>Product</label>
                        <input
                            type="text"
                            className="form-control"
                            value={editingOrder.Product?.name || 'N/A'}
                            disabled
                        />
                    </div>
                    <div className="form-group mt-3">
                        <label>Quantity</label>
                        <input
                            type="number"
                            className="form-control"
                            value={editingOrder.quantity}
                            onChange={(e) =>
                                setEditingOrder({ ...editingOrder, quantity: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="form-group mt-3">
                        <label>Date of Delivery</label>
                        <input
                            type="date"
                            className="form-control"
                            value={editingOrder.date_of_delivery}
                            onChange={(e) =>
                                setEditingOrder({ ...editingOrder, date_of_delivery: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="form-group mt-3">
                        <label>Client</label>
                        <input
                            type="text"
                            className="form-control"
                            value={editingOrder.client}
                            onChange={(e) =>
                                setEditingOrder({ ...editingOrder, client: e.target.value })
                            }
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary mt-3">
                        Update Order
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary mt-3 ms-3"
                        onClick={() => setEditingOrder(null)}
                    >
                        Cancel
                    </button>
                </form>
            )}

            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Date of Delivery</th>
                        <th>Client</th>
                        {userRole === 'factory_team' && <th>Lot Code</th>}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>{order.Product?.name || 'N/A'}</td>
                            <td>{order.quantity}</td>
                            <td>{order.date_of_delivery}</td>
                            <td>{order.client}</td>
                            {userRole === 'factory_team' && (
                                <td className="position-relative">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={lotCodes[order.id] || ''}
                                        onChange={(e) =>
                                            handleLotCodeChange(order.id, e.target.value, order.productId)
                                        }
                                        placeholder="Enter Lot Code"
                                    />
                                    {suggestedLotCodes[order.id]?.length > 0 && (
                                        <ul
                                            className="list-group position-absolute w-100 mt-1"
                                            style={{
                                                maxHeight: '150px',
                                                overflowY: 'auto',
                                                zIndex: 1000,
                                            }}
                                        >
                                            {suggestedLotCodes[order.id].map((lotCode, index) => (
                                                <li
                                                    key={index}
                                                    className="list-group-item list-group-item-action"
                                                    onClick={() => handleSelectLotCode(order.id, lotCode)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {lotCode}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>
                            )}
                            <td>
                                {userRole === 'admin' ? (
                                    <>
                                        <button
                                            className="btn btn-warning me-2"
                                            onClick={() => handleEditOrder(order)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteOrder(order.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleFulfillOrder(order.id)}
                                    >
                                        <FaCheck />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default FactoryOrdersPage;
