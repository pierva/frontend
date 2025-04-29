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
    (async () => {
      try {
        const prods = await ordersService.getProducts();
        setProducts(prods);
      } catch {
        showMsg('Error fetching products', 'danger');
      }
    })();
  }, []);

  // Offer to prefill only product entries & quantities
  const handleClientBlur = async () => {
    const c = order.client.trim();
    if (!c) return;

    try {
      // prev is now an array of { productId, quantity }
      const prev = await ordersService.getLastOrder(c);
      if (Array.isArray(prev) && prev.length) {
        const ok = window.confirm('Prefill products/quantities from their last order?');
        if (ok) {
          setOrder(current => ({
            ...current,
            entries: prev.map(e => ({
              productId: String(e.productId),
              quantity: String(e.quantity),
            })),
          }));
        }
      }
    } catch {
      // no previous order or error → ignore
    }
  };

  const handleEntryChange = (idx, field, value) => {
    setOrder(current => {
      const entries = [...current.entries];
      entries[idx] = { ...entries[idx], [field]: value };
      return { ...current, entries };
    });
  };

  const addEntry = () => {
    setOrder(current => ({
      ...current,
      entries: [...current.entries, { productId: '', quantity: '' }],
    }));
  };

  const removeEntry = idx => {
    setOrder(current => ({
      ...current,
      entries: current.entries.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!order.client || !order.date_of_delivery) {
      return showMsg('Client and delivery date are required.', 'danger');
    }
    for (let { productId, quantity } of order.entries) {
      if (!productId || !quantity) {
        return showMsg('Please fill out every product and quantity.', 'danger');
      }
    }

    try {
      await ordersService.createOrder({
        client: order.client,
        date_of_delivery: order.date_of_delivery,
        entries: order.entries.map(e => ({
          productId: Number(e.productId),
          quantity: Number(e.quantity),
        })),
      });
      showMsg('Order created successfully', 'success');
      setOrder({
        client: '',
        date_of_delivery: '',
        entries: [{ productId: '', quantity: '' }],
      });
    } catch {
      showMsg('Error creating order', 'danger');
    }
  };

  const showMsg = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="container mt-5">
      {message && (
        <div className={`alert alert-${messageType} alert-dismissible`} role="alert">
          {message}
          <button className="btn-close" onClick={() => setMessage('')} />
        </div>
      )}

      <h2>Submit a New Order</h2>
      <form onSubmit={handleSubmit}>
        {/* Client & Date */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">Client</label>
            <input
              type="text"
              className="form-control"
              value={order.client}
              onChange={e => setOrder({ ...order, client: e.target.value })}
              onBlur={handleClientBlur}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Date of Delivery</label>
            <input
              type="date"
              className="form-control"
              value={order.date_of_delivery}
              onChange={e => setOrder({ ...order, date_of_delivery: e.target.value })}
              required
            />
          </div>
        </div>

        <hr />

        {/* Product Entries */}
        {order.entries.map((ent, idx) => (
          <div className="row g-3 align-items-end mb-2" key={idx}>
            <div className="col-md-5">
              <label className="form-label">Product</label>
              <select
                className="form-select"
                value={ent.productId}
                onChange={e => handleEntryChange(idx, 'productId', e.target.value)}
                required
              >
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={p.id} value={String(p.id)}>
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
                value={ent.quantity}
                onChange={e => handleEntryChange(idx, 'quantity', e.target.value)}
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

        <button type="submit" className="btn btn-primary mt-3">
          Submit Order
        </button>
      </form>
    </div>
  );
}

export default AdminOrdersPage;
