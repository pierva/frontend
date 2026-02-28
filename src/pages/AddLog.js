// src/pages/AddLog.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import logService from '../services/logService';
import ingredientService from '../services/ingredientService';
import productService from '../services/productService';
import bakingCcpService from '../services/bakingCcpService';

function AddLog() {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' | 'danger'
  const [lotCode, setLotCode] = useState('');
  const [productionDate, setProductionDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [entries, setEntries] = useState([
    { productId: '', productName: '', quantity: '' }
  ]);
  const [productSuggestions, setProductSuggestions] = useState({});
  const [ingredientEntries, setIngredientEntries] = useState([
    { ingredientId: '', ingredientLotCode: '', quantity: '', uom: 'lb' }
  ]);

  // QA banner state
  const [pendingRuns, setPendingRuns] = useState([]);
  const [canReviewQA, setCanReviewQA] = useState(false);

  const cachedRecipesRef = useRef({});

  useEffect(() => {
    // Determine role from token
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const role = decoded?.role || '';
        setCanReviewQA(role === 'admin' || role === 'qa');
      }
    } catch (e) { /* ignore */ }
  }, []);

  // Fetch pending QA runs if user has permission
  useEffect(() => {
    if (!canReviewQA) return;
    bakingCcpService.getRuns('COMPLETED')
      .then(res => setPendingRuns(Array.isArray(res?.runs) ? res.runs : []))
      .catch(() => setPendingRuns([]));
  }, [canReviewQA]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const productsData = await logService.getProducts();
        setProducts(productsData);

        const ingredientsData = await ingredientService.getIngredients();
        setIngredients(ingredientsData);

        setLotCode(generatePizzaciniLotCode());
      } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error loading data.', 'danger');
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const updateIngredientEntries = async () => {
      const allIngredientIds = new Set();
      for (let entry of entries) {
        if (!entry.productId) continue;
        let recipe = cachedRecipesRef.current[entry.productId];
        if (!recipe) {
          try {
            recipe = await productService.getProductRecipe(entry.productId);
            cachedRecipesRef.current[entry.productId] = recipe;
          } catch (e) {
            console.error('Error fetching recipe for', entry.productId, e);
            continue;
          }
        }
        recipe.forEach(id => allIngredientIds.add(id));
      }
      const newIng = Array.from(allIngredientIds).map(id => ({
        ingredientId: id,
        ingredientLotCode: '',
        quantity: '',
        uom: 'lb',
      }));
      setIngredientEntries(newIng);
    };
    updateIngredientEntries();
  }, [entries]);

  const generatePizzaciniLotCode = () => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const day = String(today.getDate()).padStart(2, '0');
    const monthLetters = 'ABCDEFGHIJKL';
    const month = monthLetters[today.getMonth()];
    return `${month}-1${year}${day}1`;
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3500);
  };

  const toKg = (qty, uom) => {
    const n = Number(qty);
    if (!Number.isFinite(n)) return null;
    if (uom === 'kg') return n;
    if (uom === 'lb') return n * 0.45359237;
    return null;
  };

  const handleProductInputChange = (idx, value) => {
    const clone = [...entries];
    clone[idx].productName = value;
    clone[idx].productId = '';
    setEntries(clone);
    if (value.length > 0) {
      const suggestions = products.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setProductSuggestions(ps => ({ ...ps, [idx]: suggestions }));
    } else {
      setProductSuggestions(ps => ({ ...ps, [idx]: [] }));
    }
  };

  const handleSelectProduct = (idx, product) => {
    const clone = [...entries];
    clone[idx].productName = product.name;
    clone[idx].productId = product.id;
    setEntries(clone);
    setProductSuggestions(ps => ({ ...ps, [idx]: [] }));
  };

  const handleShowAllProducts = (idx) => {
    setProductSuggestions(ps => ({ ...ps, [idx]: products }));
  };

  const handleEntryChange = (idx, field, value) => {
    const clone = [...entries];
    clone[idx][field] = value;
    setEntries(clone);
  };
  const addEntry = () =>
    setEntries(e => [...e, { productId: '', productName: '', quantity: '' }]);
  const removeEntry = idx =>
    setEntries(e => e.filter((_, i) => i !== idx));

  const handleIngredientChange = (idx, field, value) => {
    const clone = [...ingredientEntries];
    clone[idx][field] = value;
    setIngredientEntries(clone);
  };
  const addIngredientEntry = () =>
    setIngredientEntries(i => [...i, { ingredientId: '', ingredientLotCode: '', quantity: '', uom: 'lb' }]);
  const removeIngredientEntry = idx =>
    setIngredientEntries(i => i.filter((_, i2) => i2 !== idx));

  const handleSubmit = async e => {
    e.preventDefault();

    if (!productionDate) {
      return showMessage('Please select a production date.', 'danger');
    }
    if (entries.some(en => !en.productId || !en.quantity)) {
      return showMessage('Please fill out all product fields.', 'danger');
    }
    if (
      ingredientEntries.some(en =>
        !en.ingredientId ||
        !en.ingredientLotCode ||
        en.quantity === '' ||
        !Number.isFinite(Number(en.quantity)) ||
        Number(en.quantity) <= 0
      )
    ) {
      return showMessage('Please fill out all ingredient fields (including quantity).', 'danger');
    }

    try {
      const ingredientPayload = ingredientEntries.map(en => {
        const uom = (en.uom || 'lb').toLowerCase();
        const qKg = toKg(en.quantity, uom);
        if (!Number.isFinite(qKg) || qKg <= 0) {
          throw new Error('Invalid ingredient quantity/unit. Please check quantities and units.');
        }
        return {
          ingredientId: Number(en.ingredientId),
          ingredientLotCode: String(en.ingredientLotCode || '').trim(),
          quantityKg: qKg,
          quantityInput: Number(en.quantity),
          uomInput: uom,
        };
      });

      await logService.addBatchLogs({
        entries: entries.map(en => ({ ...en, lotCode })),
        ingredientEntries: ingredientPayload,
        lotCode,
        production_date: productionDate,
      });

      showMessage('Production batch submitted successfully.', 'success');

      setEntries([{ productId: '', productName: '', quantity: '' }]);
      setIngredientEntries([{ ingredientId: '', ingredientLotCode: '', quantity: '', uom: 'lb' }]);
      setLotCode(generatePizzaciniLotCode());
      setProductionDate(new Date().toISOString().slice(0, 10));
    } catch (err) {
      console.error(err);
      showMessage(err?.message || 'Error submitting batch logs.', 'danger');
    }
  };

  return (
    <div className="container mt-4">

      {/* ── Floating message banner ── */}
      {message && (
        <div className="fixed-top mt-5 d-flex justify-content-center" style={{ zIndex: 1100 }}>
          <div className={`alert alert-${messageType} alert-dismissible fade show w-50`} role="alert">
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage('')} />
          </div>
        </div>
      )}

      {/* ── QA Pending Review Banner ── */}
      {canReviewQA && pendingRuns.length > 0 && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between gap-3 mb-4" role="alert">
          <div>
            <strong>⚠ {pendingRuns.length} run{pendingRuns.length > 1 ? 's' : ''} pending QA verification.</strong>
            <div style={{ fontSize: 13 }} className="mt-1">
              The following batches were completed by the production team and are waiting for QA review:{' '}
              {pendingRuns.slice(0, 3).map((r, i) => (
                <span key={r.id}>
                  <strong>{r.Batch?.lotCode || `Run #${r.id}`}</strong>
                  {i < Math.min(pendingRuns.length, 3) - 1 ? ', ' : ''}
                </span>
              ))}
              {pendingRuns.length > 3 && <span> and {pendingRuns.length - 3} more</span>}
            </div>
          </div>
          <Link
            to="/ccp/baking/queue"
            className="btn btn-warning text-dark flex-shrink-0"
            style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Go to QA Queue →
          </Link>
        </div>
      )}

      <h2>Add Production Batch</h2>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Use this form to manually log a production batch. If you completed a run through the live baking process, use the{' '}
        <Link to="/ccp/baking/queue">QA Review Queue</Link> instead.
      </p>

      <form onSubmit={handleSubmit}>
        <h4>Batch Lot & Date</h4>
        <div className="row mb-3">
          <div className="col-md-6 col-12 mb-2 mb-md-0">
            <label>Lot Code</label>
            <input
              type="text"
              className="form-control"
              value={lotCode}
              onChange={e => setLotCode(e.target.value)}
              required
            />
          </div>
          <div className="col-md-6 col-12">
            <label>Production Date</label>
            <input
              type="date"
              className="form-control"
              value={productionDate}
              onChange={e => setProductionDate(e.target.value)}
              required
            />
          </div>
        </div>

        <h4>Products</h4>
        {entries.map((entry, idx) => (
          <div key={idx} className="row mb-3 g-1">
            <div className="col-sm-5 col-12 position-relative">
              <label>Product</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={entry.productName}
                  onChange={e => handleProductInputChange(idx, e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handleShowAllProducts(idx)}
                >
                  ▾
                </button>
              </div>
              {productSuggestions[idx]?.length > 0 && (
                <ul
                  className="list-group position-absolute w-100 mt-1"
                  style={{ maxHeight: '250px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  {productSuggestions[idx].map(p => (
                    <li
                      key={p.id}
                      className="list-group-item"
                      style={{ cursor: 'pointer' }}
                      onMouseDown={() => handleSelectProduct(idx, p)}
                    >
                      {p.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="col-sm-5 col-12">
              <label>Quantity</label>
              <input
                type="number"
                className="form-control"
                value={entry.quantity}
                onChange={e => handleEntryChange(idx, 'quantity', e.target.value)}
                required
              />
            </div>
            <div className="col-sm-2 col-12 d-flex align-items-end">
              <button type="button" className="btn btn-danger w-100" onClick={() => removeEntry(idx)}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary mb-3" onClick={addEntry}>
          Add Product
        </button>

        <h4>Ingredients</h4>
        {ingredientEntries.map((ingredient, idx) => (
          <div key={idx} className="row mb-3 g-1">
            <div className="col-md-4 col-12">
              <label>Ingredient</label>
              <select
                className="form-control"
                value={ingredient.ingredientId}
                onChange={e => handleIngredientChange(idx, 'ingredientId', e.target.value)}
                required
              >
                <option value="">Select an ingredient</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3 col-12">
              <label>Lot Code</label>
              <input
                type="text"
                className="form-control"
                value={ingredient.ingredientLotCode}
                onChange={e => handleIngredientChange(idx, 'ingredientLotCode', e.target.value)}
                required
              />
            </div>

            <div className="col-md-3 col-12">
              <label>Quantity</label>
              <input
                type="number"
                className="form-control"
                value={ingredient.quantity}
                onChange={e => handleIngredientChange(idx, 'quantity', e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="col-md-1 col-6">
              <label>Unit</label>
              <select
                className="form-control"
                value={ingredient.uom}
                onChange={e => handleIngredientChange(idx, 'uom', e.target.value)}
              >
                <option value="lb">lb</option>
                <option value="kg">kg</option>
              </select>
            </div>

            <div className="col-md-1 col-6 d-flex align-items-end">
              <button type="button" className="btn btn-danger w-100" onClick={() => removeIngredientEntry(idx)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="d-flex justify-content-center gap-3 mb-5">
          <button type="button" className="btn btn-secondary" onClick={addIngredientEntry}>
            Add Ingredient
          </button>
          <button type="submit" className="btn btn-primary">
            Submit Production Batch
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddLog;