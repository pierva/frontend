import React, { useState, useEffect, useRef } from 'react';
import logService from '../services/logService';
import ingredientService from '../services/ingredientService';
import productService from '../services/productService'; // Ensure you have getProductRecipe

function AddLog() {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [message, setMessage] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [entries, setEntries] = useState([{ productId: '', quantity: '' }]);
  const [ingredientEntries, setIngredientEntries] = useState([{ ingredientId: '', ingredientLotCode: '' }]);
  
  // Use a ref to cache product recipes across renders.
  const cachedRecipesRef = useRef({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const productsData = await logService.getProducts();
        setProducts(productsData);

        const ingredientsData = await ingredientService.getIngredients();
        setIngredients(ingredientsData);

        // Generate default lot code for the batch
        const defaultLotCode = generatePizzaciniLotCode();
        setLotCode(defaultLotCode);
      } catch (error) {
        console.error('Error loading data:', error);
        setMessage('Error loading data.');
        autoDismissMessage();
      }
    };

    loadInitialData();
  }, []);

  // useEffect to prefill ingredientEntries based on selected products with caching
  useEffect(() => {
    const updateIngredientEntries = async () => {
      const allIngredientIds = new Set();

      // Loop through each product entry and fetch its recipe (using cache when available)
      for (let entry of entries) {
        if (entry.productId) {
          // Check if recipe is cached
          if (cachedRecipesRef.current[entry.productId]) {
            const recipe = cachedRecipesRef.current[entry.productId];
            recipe.forEach(ingredientId => allIngredientIds.add(ingredientId));
          } else {
            try {
              const recipe = await productService.getProductRecipe(entry.productId);
              // Cache the fetched recipe
              cachedRecipesRef.current[entry.productId] = recipe;
              recipe.forEach(ingredientId => allIngredientIds.add(ingredientId));
            } catch (error) {
              console.error('Error fetching recipe for product:', entry.productId, error);
            }
          }
        }
      }
      // Create ingredient entry objects for each unique ingredient ID
      const newIngredientEntries = Array.from(allIngredientIds).map(id => ({
        ingredientId: id,
        ingredientLotCode: ''
      }));
      setIngredientEntries(newIngredientEntries);
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

  const handleEntryChange = (index, field, value) => {
    const updatedEntries = [...entries];
    updatedEntries[index][field] = value;
    setEntries(updatedEntries);
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredientEntries = [...ingredientEntries];
    updatedIngredientEntries[index][field] = value;
    setIngredientEntries(updatedIngredientEntries);
  };

  const addEntry = () => {
    setEntries([...entries, { productId: '', quantity: '' }]);
  };

  const addIngredientEntry = () => {
    setIngredientEntries([...ingredientEntries, { ingredientId: '', ingredientLotCode: '' }]);
  };

  const removeEntry = (index) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const removeIngredientEntry = (index) => {
    setIngredientEntries(ingredientEntries.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (entries.some(entry => !entry.productId || !entry.quantity)) {
      setMessage('Please fill out all product fields.');
      autoDismissMessage();
      return;
    }

    if (ingredientEntries.some(entry => !entry.ingredientId || !entry.ingredientLotCode)) {
      setMessage('Please fill out all ingredient fields.');
      autoDismissMessage();
      return;
    }

    try {
      await logService.addBatchLogs({
        entries: entries.map(entry => ({ ...entry, lotCode })),
        ingredientEntries,
        lotCode,
      });
      setMessage('Production batch submitted successfully.');
      autoDismissMessage();
      setEntries([{ productId: '', quantity: '' }]);
      setIngredientEntries([{ ingredientId: '', ingredientLotCode: '' }]);
      setLotCode(generatePizzaciniLotCode()); // Reset lot code to default
    } catch (error) {
      console.error('Error submitting batch logs:', error);
      setMessage('Error submitting batch logs.');
      autoDismissMessage();
    }
  };

  const autoDismissMessage = () => {
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="container mt-5">
      <h2>Add Production Batch</h2>

      {message && (
        <div className="fixed-top mt-5 d-flex justify-content-center">
          <div className="alert alert-success alert-dismissible fade show w-50" role="alert">
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h4>Batch Lot Code</h4>
        <div className="form-group mb-3">
          <label>Lot Code</label>
          <input
            type="text"
            className="form-control"
            value={lotCode}
            onChange={(e) => setLotCode(e.target.value)}
            required
          />
        </div>

        <h4>Products</h4>
        {entries.map((entry, index) => (
          <div key={index} className="row mb-3 g-1">
            <div className="col-sm-5 col-12">
              <label className="form-label">Product</label>
              <select
                className="form-control"
                value={entry.productId}
                onChange={(e) => handleEntryChange(index, 'productId', e.target.value)}
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-5 col-12">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-control"
                value={entry.quantity}
                onChange={(e) => handleEntryChange(index, 'quantity', e.target.value)}
                required
              />
            </div>
            <div className="col-sm-2 col-12 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={() => removeEntry(index)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary mb-3" onClick={addEntry}>
          Add Product
        </button>

        <h4>Ingredients</h4>
        {ingredientEntries.map((ingredient, index) => (
          <div key={index} className="row mb-3 g-1">
            <div className="col-md-5 col-12">
              <label className="form-label">Ingredient</label>
              <select
                className="form-control"
                value={ingredient.ingredientId}
                onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
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
              <label className="form-label">Lot Code</label>
              <input
                type="text"
                className="form-control"
                value={ingredient.ingredientLotCode}
                onChange={(e) => handleIngredientChange(index, 'ingredientLotCode', e.target.value)}
                required
              />
            </div>
            <div className="col-md-2 col-12 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={() => removeIngredientEntry(index)}
              >
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
