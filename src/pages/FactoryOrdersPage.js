import React, { useEffect, useState } from 'react';
import ordersService from '../services/ordersService';

function FactoryOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [lotCodes, setLotCodes] = useState({});
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');
    const [editingOrder, setEditingOrder] = useState(null); // Holds the order being edited

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

    const handleLotCodeChange = (id, value) => {
        setLotCodes({ ...lotCodes, [id]: value.trim().toUpperCase() }); // Enforce uppercase
    };

    const handleFulfillOrder = async (orderId) => {
        try {
            const lotCode = lotCodes[orderId]?.trim().toUpperCase();
    
            if (!lotCode) {
                setError('Lot code is required.');
                return;
            }
    
            // Use the updated ordersService method
            await ordersService.fulfillOrder(orderId, lotCode);
    
            setMessage('Order fulfilled successfully.');
            setOrders(orders.filter((order) => order.id !== orderId)); // Remove the fulfilled order from the list
        } catch (err) {
            console.error('Error fulfilling order:', err);
            setError('Failed to fulfill order.');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            await ordersService.deleteOrder(orderId);
            setMessage('Order deleted successfully.');
            autoDismissMessage('success');
            setOrders(orders.filter((order) => order.id !== orderId)); // Remove deleted order from the list
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
            setEditingOrder(null); // Exit edit mode

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

            {/* Editing Form */}
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

            {/* Orders Table */}
            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Date of Delivery</th>
                        <th>Lot Code</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>{order.Product?.name || 'N/A'}</td>
                            <td>{order.quantity}</td>
                            <td>{new Date(order.date_of_delivery).toLocaleDateString()}</td>
                            <td>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={lotCodes[order.id] || ''}
                                    onChange={(e) => handleLotCodeChange(order.id, e.target.value)}
                                    placeholder="Enter Lot Code"
                                />
                            </td>
                            <td>
                                {userRole === 'admin' ? (
                                    <>
                                        <button
                                            className="btn btn-warning me-2"
                                            onClick={() => handleEditOrder(order)}
                                        >
                                            Update
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteOrder(order.id)}
                                        >
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleFulfillOrder(order.id)}
                                    >
                                        Fulfill
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
