// src/pages/AddLog.js
import React, { useState, useEffect, useRef } from 'react';
import logService from '../services/logService';
import ingredientService from '../services/ingredientService';
import productService from '../services/productService';

function AddLog() {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [message, setMessage] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [entries, setEntries] = useState([
    { productId: '', productName: '', quantity: '' }
  ]);
  const [productSuggestions, setProductSuggestions] = useState({});
  const [ingredientEntries, setIngredientEntries] = useState([
    { ingredientId: '', ingredientLotCode: '' }
  ]);

  // Cache product recipes so we only fetch once per product
  const cachedRecipesRef = useRef({});

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
        setMessage('Error loading data.');
        autoDismissMessage();
      }
    };
    loadInitialData();
  }, []);

  // Prefill ingredient entries based on selected products
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
        ingredientLotCode: ''
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

  const autoDismissMessage = () => {
    setTimeout(() => setMessage(''), 3000);
  };

  // --- Product‐picker handlers ---
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

  // --- Other form handlers ---
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
    setIngredientEntries(i => [...i, { ingredientId: '', ingredientLotCode: '' }]);
  const removeIngredientEntry = idx =>
    setIngredientEntries(i => i.filter((_, i2) => i2 !== idx));

  const handleSubmit = async e => {
    e.preventDefault();
    if (entries.some(en => !en.productId || !en.quantity)) {
      setMessage('Please fill out all product fields.');
      return autoDismissMessage();
    }
    if (
      ingredientEntries.some(en => !en.ingredientId || !en.ingredientLotCode)
    ) {
      setMessage('Please fill out all ingredient fields.');
      return autoDismissMessage();
    }
    try {
      await logService.addBatchLogs({
        entries: entries.map(en => ({ ...en, lotCode })),
        ingredientEntries,
        lotCode,
      });
      setMessage('Production batch submitted successfully.');
      autoDismissMessage();
      setEntries([{ productId: '', productName: '', quantity: '' }]);
      setIngredientEntries([{ ingredientId: '', ingredientLotCode: '' }]);
      setLotCode(generatePizzaciniLotCode());
    } catch (err) {
      console.error(err);
      setMessage('Error submitting batch logs.');
      autoDismissMessage();
    }
  };

  return (
    <div className="container mt-5">
      <h2>Add Production Batch</h2>

      {message && (
        <div className="fixed-top mt-5 d-flex justify-content-center">
          <div
            className="alert alert-success alert-dismissible fade show w-50"
            role="alert"
          >
            {message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage('')}
            ></button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h4>Batch Lot Code</h4>
        <div className="mb-3">
          <label>Lot Code</label>
          <input
            type="text"
            className="form-control"
            value={lotCode}
            onChange={e => setLotCode(e.target.value)}
            required
          />
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
                  onChange={e =>
                    handleProductInputChange(idx, e.target.value)
                  }
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
                  style={{
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
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
                onChange={e =>
                  handleEntryChange(idx, 'quantity', e.target.value)
                }
                required
              />
            </div>
            <div className="col-sm-2 col-12 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={() => removeEntry(idx)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary mb-3"
          onClick={addEntry}
        >
          Add Product
        </button>

        <h4>Ingredients</h4>
        {ingredientEntries.map((ingredient, idx) => (
          <div key={idx} className="row mb-3 g-1">
            <div className="col-md-5 col-12">
              <label>Ingredient</label>
              <select
                className="form-control"
                value={ingredient.ingredientId}
                onChange={e =>
                  handleIngredientChange(idx, 'ingredientId', e.target.value)
                }
                required
              >
                <option value="">Select an ingredient</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-5 col-12">
              <label>Lot Code</label>
              <input
                type="text"
                className="form-control"
                value={ingredient.ingredientLotCode}
                onChange={e =>
                  handleIngredientChange(
                    idx,
                    'ingredientLotCode',
                    e.target.value
                  )
                }
                required
              />
            </div>
            <div className="col-md-2 col-12 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={() => removeIngredientEntry(idx)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="d-flex justify-content-center gap-3 mb-5">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addIngredientEntry}
          >
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
