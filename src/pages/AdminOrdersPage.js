import React, { useState, useEffect } from 'react';
import ordersService from '../services/ordersService';

function AdminOrdersPage() {
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState({
    client: '',
    date_of_delivery: '',
    entries: [{ productId: '', quantity: '' }],
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const prods = await ordersService.getProducts();
        setProducts(prods);
      } catch (error) {
        setMessage('Error fetching products');
        setMessageType('danger');
        autoDismissMessage();
      }
    };
    fetchProducts();
  }, []);

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...order.entries];
    newEntries[index][field] = value;
    setOrder({ ...order, entries: newEntries });
  };

  const addEntry = () => {
    setOrder({
      ...order,
      entries: [...order.entries, { productId: '', quantity: '' }],
    });
  };

  const removeEntry = (index) => {
    const newEntries = order.entries.filter((_, i) => i !== index);
    setOrder({ ...order, entries: newEntries });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!order.client || !order.date_of_delivery) {
      setMessage('Client and delivery date are required.');
      setMessageType('danger');
      autoDismissMessage();
      return;
    }
    for (let { productId, quantity } of order.entries) {
      if (!productId || !quantity) {
        setMessage('Please fill out all product and quantity fields.');
        setMessageType('danger');
        autoDismissMessage();
        return;
      }
    }

    try {
      await ordersService.createOrder(order);
      setMessage('Order created successfully');
      setMessageType('success');
      // reset
      setOrder({
        client: '',
        date_of_delivery: '',
        entries: [{ productId: '', quantity: '' }],
      });
      autoDismissMessage();
    } catch (error) {
      setMessage('Error creating order');
      setMessageType('danger');
      autoDismissMessage();
    }
  };

  const autoDismissMessage = () => {
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="container mt-5">
      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}
      <h2>Submit a New Order</h2>
      <form onSubmit={handleSubmit}>
        {/* Order-level fields */}
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Client</label>
            <input
              type="text"
              className="form-control"
              value={order.client}
              onChange={(e) => setOrder({ ...order, client: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Date of Delivery</label>
            <input
              type="date"
              className="form-control"
              value={order.date_of_delivery}
              onChange={(e) => setOrder({ ...order, date_of_delivery: e.target.value })}
              required
            />
          </div>
        </div>

        <hr />

        {/* Dynamic product entries */}
        {order.entries.map((entry, idx) => (
          <div className="row g-3 align-items-end" key={idx}>
            <div className="col-md-5">
              <label className="form-label">Product</label>
              <select
                className="form-select"
                value={entry.productId}
                onChange={(e) => handleEntryChange(idx, 'productId', e.target.value)}
                required
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-5">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-control"
                value={entry.quantity}
                onChange={(e) => handleEntryChange(idx, 'quantity', e.target.value)}
                required
              />
            </div>
            <div className="col-md-2 d-flex gap-2">
              {order.entries.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  onClick={() => removeEntry(idx)}
                >
                  &minus;
                </button>
              )}
              {idx === order.entries.length - 1 && (
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={addEntry}
                >
                  +
                </button>
              )}
            </div>
          </div>
        ))}

        <button type="submit" className="btn btn-primary mt-4">
          Submit Order
        </button>
      </form>
    </div>
  );
}

export default AdminOrdersPage;
