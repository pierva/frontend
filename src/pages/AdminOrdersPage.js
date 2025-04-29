import React, { useState, useEffect } from 'react';
import ordersService from '../services/ordersService';

function AdminOrdersPage() {
  const [products, setProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);

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
        const [prods, customers] = await Promise.all([
          ordersService.getProducts(),
          ordersService.getAllCustomers(),
        ]);
        setProducts(prods);
        setAllCustomers(customers);
      } catch {
        showMsg('Error fetching initial data', 'danger');
      }
    })();
  }, []);

  const handleClientChange = (e) => {
    const val = e.target.value;
    setOrder((o) => ({ ...o, client: val }));
    if (val.length >= 2) {
      const suggestions = allCustomers.filter((c) =>
        c.name.toLowerCase().includes(val.toLowerCase())
      );
      setCustomerSuggestions(suggestions);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const selectCustomer = (name) => {
    setOrder((o) => ({ ...o, client: name }));
    setCustomerSuggestions([]);
  };

  const handleClientBlur = async () => {
    const c = order.client.trim();
    if (!c) return;
    try {
      const prev = await ordersService.getLastOrder(c);
      if (Array.isArray(prev) && prev.length) {
        const ok = window.confirm(
          'Prefill products/quantities from their last order?'
        );
        if (ok) {
          setOrder((cur) => ({
            ...cur,
            entries: prev.map((e) => ({
              productId: String(e.productId),
              quantity: String(e.quantity),
            })),
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleEntryChange = (idx, field, value) => {
    setOrder((cur) => {
      const ents = [...cur.entries];
      ents[idx] = { ...ents[idx], [field]: value };
      return { ...cur, entries: ents };
    });
  };

  const addEntry = () => {
    setOrder((cur) => ({
      ...cur,
      entries: [...cur.entries, { productId: '', quantity: '' }],
    }));
  };

  const removeEntry = (idx) => {
    setOrder((cur) => ({
      ...cur,
      entries: cur.entries.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order.client || !order.date_of_delivery)
      return showMsg('Client & delivery date required', 'danger');

    for (let { productId, quantity } of order.entries) {
      if (!productId || !quantity)
        return showMsg('Fill out every product & quantity', 'danger');
    }

    try {
      await ordersService.createOrder({
        client: order.client,
        date_of_delivery: order.date_of_delivery,
        entries: order.entries.map((e) => ({
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

  const showMsg = (txt, type) => {
    setMessage(txt);
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
        {/* CLIENT & DATE ON SAME ROW */}
        <div className="row mb-3">
          <div className="col-6 position-relative">
            <label className="form-label">Client</label>
            <input
              type="text"
              className="form-control"
              value={order.client}
              onChange={handleClientChange}
              onBlur={handleClientBlur}
              required
            />
            {customerSuggestions.length > 0 && (
              <ul
                className="list-group position-absolute w-100"
                style={{ zIndex: 1000, maxHeight: '150px', overflowY: 'auto' }}
              >
                {customerSuggestions.map((c) => (
                  <li
                    key={c.id}
                    className="list-group-item list-group-item-action"
                    onMouseDown={() => selectCustomer(c.name)}
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="col-6">
            <label className="form-label">Date of Delivery</label>
            <input
              type="date"
              className="form-control"
              value={order.date_of_delivery}
              onChange={(e) =>
                setOrder((o) => ({ ...o, date_of_delivery: e.target.value }))
              }
              required
            />
          </div>
        </div>

        <hr />

        {/* PRODUCT ENTRIES */}
        {order.entries.map((ent, idx) => (
          <div className="row g-3 align-items-end mb-2" key={idx}>
            <div className="col-md-5">
              <label className="form-label">Product</label>
              <select
                className="form-select"
                value={ent.productId}
                onChange={(e) => handleEntryChange(idx, 'productId', e.target.value)}
                required
              >
                <option value="">Select a product</option>
                {products.map((p) => (
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

        <button type="submit" className="btn btn-primary mt-3">
          Submit Order
        </button>
      </form>
    </div>
  );
}

export default AdminOrdersPage;
