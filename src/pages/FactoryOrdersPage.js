import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import ordersService from '../services/ordersService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function FactoryOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [lotCodes, setLotCodes] = useState({});
  const [suggestedLotCodes, setSuggestedLotCodes] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await ordersService.getOrders();
        setOrders(fetched);

        const token = localStorage.getItem('token');
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decoded.role);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch orders.');
        autoDismiss('error');
      }
    })();
  }, []);

  const autoDismiss = (type) => {
    setTimeout(() => {
      if (type === 'error') setError('');
      else setMessage('');
    }, 3000);
  };

  const handleLotCodeChange = async (orderId, value, productId) => {
    setLotCodes((lc) => ({ ...lc, [orderId]: value.trim().toUpperCase() }));

    if (value.trim().length > 2) {
      try {
        const token = localStorage.getItem('token');
        const resp = await axios.get(
          `${API_URL}/api/traceability-logs/search-lot-codes`,
          {
            params: { query: value.trim(), productId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuggestedLotCodes((s) => ({ ...s, [orderId]: resp.data }));
      } catch {
        setError('Failed to fetch lot codes.');
        autoDismiss('error');
      }
    } else {
      setSuggestedLotCodes((s) => ({ ...s, [orderId]: [] }));
    }
  };

  const handleSelectLotCode = (orderId, lotCode) => {
    setLotCodes((lc) => ({ ...lc, [orderId]: lotCode }));
    setSuggestedLotCodes((s) => ({ ...s, [orderId]: [] }));
  };

  const handleFulfillOrder = async (orderId) => {
    try {
      const code = lotCodes[orderId]?.trim().toUpperCase();
      if (!code) {
        setError('Lot code is required.');
        autoDismiss('error');
        return;
      }
      await ordersService.fulfillOrder(orderId, code);
      setMessage('Order fulfilled successfully.');
      setOrders((o) => o.filter((ord) => ord.id !== orderId));
      autoDismiss('success');
    } catch {
      setError('Failed to fulfill order.');
      autoDismiss('error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await ordersService.deleteOrder(orderId);
      setMessage('Order deleted successfully.');
      setOrders((o) => o.filter((ord) => ord.id !== orderId));
      autoDismiss('success');
    } catch {
      setError('Failed to delete order.');
      autoDismiss('error');
    }
  };

  const handleEditOrder = (order) => setEditingOrder(order);

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await ordersService.updateOrder(editingOrder.id, editingOrder);
      setMessage('Order updated successfully.');
      autoDismiss('success');
      setEditingOrder(null);
      const updated = await ordersService.getOrders();
      setOrders(updated);
    } catch {
      setError('Failed to update order.');
      autoDismiss('error');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Factory Orders Management</h2>

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button className="btn-close" onClick={() => setMessage('')} />
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button className="btn-close" onClick={() => setError('')} />
        </div>
      )}

      {editingOrder && (
        <form onSubmit={handleUpdateOrder} className="mb-4">
          <h4>Update Order</h4>
          {/* product (readonly) */}
          <div className="row g-3">
            <div className="col-md-6">
              <label>Product</label>
              <input
                className="form-control"
                value={editingOrder.Product?.name || 'N/A'}
                disabled
              />
            </div>
            <div className="col-md-6">
              <label>Quantity</label>
              <input
                type="number"
                className="form-control"
                value={editingOrder.quantity}
                onChange={(e) =>
                  setEditingOrder((o) => ({ ...o, quantity: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <label>Date of Delivery</label>
              <input
                type="date"
                className="form-control"
                value={editingOrder.date_of_delivery}
                onChange={(e) =>
                  setEditingOrder((o) => ({
                    ...o,
                    date_of_delivery: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="col-md-6">
              <label>Client</label>
              <input
                className="form-control"
                value={editingOrder.client}
                onChange={(e) =>
                  setEditingOrder((o) => ({ ...o, client: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="mt-3">
            <button className="btn btn-primary me-2">Update Order</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingOrder(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Date of Delivery</th>
            <th>Client</th>
            {/* show for both factory_team & admin */}
            {(userRole === 'factory_team' || userRole === 'admin') && (
              <th>Lot Code</th>
            )}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((ord) => (
            <tr key={ord.id}>
              <td>{ord.Product?.name || 'N/A'}</td>
              <td>{ord.quantity}</td>
              <td>{ord.date_of_delivery}</td>
              <td>{ord.client}</td>

              {/* Lot Code input for both roles */}
              {(userRole === 'factory_team' || userRole === 'admin') && (
                <td className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    value={lotCodes[ord.id] || ''}
                    onChange={(e) =>
                      handleLotCodeChange(ord.id, e.target.value, ord.productId)
                    }
                    placeholder="Enter Lot Code"
                  />
                  {suggestedLotCodes[ord.id]?.length > 0 && (
                    <ul
                      className="list-group position-absolute w-100 mt-1"
                      style={{
                        maxHeight: '150px',
                        overflowY: 'auto',
                        zIndex: 1000,
                      }}
                    >
                      {suggestedLotCodes[ord.id].map((code, i) => (
                        <li
                          key={i}
                          className="list-group-item list-group-item-action"
                          onClick={() => handleSelectLotCode(ord.id, code)}
                          style={{ cursor: 'pointer' }}
                        >
                          {code}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              )}

              <td>
                {userRole === 'admin' ? (
                  <>
                    {/* Admin gets Fulfill + Edit + Delete */}
                    <button
                      className="btn btn-success me-2"
                      onClick={() => handleFulfillOrder(ord.id)}
                      title="Fulfill"
                    >
                      <FaCheck />
                    </button>
                    <button
                      className="btn btn-warning me-2"
                      onClick={() => handleEditOrder(ord)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteOrder(ord.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </>
                ) : (
                  // Factory team only gets Fulfill
                  <button
                    className="btn btn-success"
                    onClick={() => handleFulfillOrder(ord.id)}
                    title="Fulfill"
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
