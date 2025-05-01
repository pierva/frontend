// src/components/TraceabilityForm.js
import React, { useState } from 'react';
import { BsCaretDownFill } from 'react-icons/bs';

export default function TraceabilityForm({
  userRole,
  isEditing,
  selectedDate,
  onDateChange,
  customer,
  onCustomerChange,
  customerSuggestions,
  onSelectCustomer,
  productEntries,
  onProductEntryChange,
  suggestedLotCodes,
  onLotCodeSelect,
  addProductEntry,
  removeProductEntry,
  onSubmit,
  onCancelEdit,
  products
}) {
  // track dropdown open state per entry
  const [dropdownOpen, setDropdownOpen] = useState({});

  const toggleDropdown = idx => {
    setDropdownOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleProductInputChange = (idx, value) => {
    onProductEntryChange(idx, 'productName', value);
    // always keep dropdown open when typing
    setDropdownOpen(prev => ({ ...prev, [idx]: true }));
    // if exact match, set productId
    const match = products.find(p => p.name === value);
    if (match) onProductEntryChange(idx, 'productId', match.id);
  };

  const filteredProducts = (name) => {
    if (!name) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  return (
    <form onSubmit={onSubmit} className="mb-4">
      <h3>{isEditing ? 'Edit' : 'Add a new'} traceability record</h3>
      <div className="row">
        <div className="col-md-6">
          <label>Date</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            required
          />
        </div>
        <div className="col-md-6 position-relative">
          <label>Customer</label>
          <input
            type="text"
            className="form-control"
            value={customer}
            onChange={onCustomerChange}
            required
          />
          {customerSuggestions.length > 0 && (
            <ul
              className="list-group position-absolute w-100"
              style={{ zIndex: 1000, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              {customerSuggestions.map(c => (
                <li
                  key={c.id}
                  className="list-group-item"
                  onMouseDown={() => onSelectCustomer(c)}
                  style={{ cursor: 'pointer' }}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h4 className="mt-3">Products</h4>
      {productEntries.map((ent, idx) => (
        <div key={idx} className="row mb-3 align-items-end">
          <div className="col-md-4 position-relative">
            <label>Product</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={ent.productName || ''}
                onChange={e => handleProductInputChange(idx, e.target.value)}
                onFocus={() => setDropdownOpen(prev => ({ ...prev, [idx]: true }))}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => toggleDropdown(idx)}
              >
                <BsCaretDownFill />
              </button>
            </div>
            {dropdownOpen[idx] && (
              <ul
                className="list-group position-absolute w-100 mt-1"
                style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              >
                {filteredProducts(ent.productName).map(p => (
                  <li
                    key={p.id}
                    className="list-group-item"
                    onMouseDown={() => {
                      onProductEntryChange(idx, 'productName', p.name);
                      onProductEntryChange(idx, 'productId', p.id);
                      setDropdownOpen(prev => ({ ...prev, [idx]: false }));
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-md-4 position-relative">
            <label>Lot Code</label>
            <input
              type="text"
              className="form-control"
              value={ent.lotCode}
              onChange={e => onProductEntryChange(idx, 'lotCode', e.target.value)}
              required
            />
            {(suggestedLotCodes[idx] || []).length > 0 && (
              <ul
                className="list-group position-absolute w-100 mt-1"
                style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              >
                {suggestedLotCodes[idx].map((code, i) => (
                  <li
                    key={i}
                    className="list-group-item"
                    onMouseDown={() => onLotCodeSelect(idx, code)}
                    style={{ cursor: 'pointer' }}
                  >
                    {code}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-md-2">
            <label>Quantity</label>
            <input
              type="number"
              className="form-control"
              value={ent.quantity}
              onChange={e => onProductEntryChange(idx, 'quantity', e.target.value)}
              required
            />
          </div>

          <div className="col-md-2">
            <button type="button" className="btn btn-danger w-100" onClick={() => removeProductEntry(idx)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      {!isEditing && (
        <div className="d-flex justify-content-center mb-3">
          <button type="button" className="btn btn-secondary" onClick={addProductEntry}>
            + Add Another Product
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="row">
          <div className="col-6">
            <button type="submit" className="btn w-100" style={{ backgroundColor: 'orange', borderColor: 'orange' }}>
              Update Record
            </button>
          </div>
          <div className="col-6">
            <button type="button" className="btn btn-secondary w-100" onClick={onCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="submit" className="btn btn-primary w-100">
          Add Record
        </button>
      )}
    </form>
  );
}
