import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import companyService from '../services/companyService';
import ingredientService from '../services/ingredientService';

// ── Recipe editor ─────────────────────────────────────────────────────────────
function RecipeEditor({ ingredients, recipeItems, onChange, priceMap = {} }) {
  const selectedIds = new Set(recipeItems.map(r => String(r.ingredientId)));

  const toggle = (ingredientId) => {
    const id = String(ingredientId);
    if (selectedIds.has(id)) {
      onChange(recipeItems.filter(r => String(r.ingredientId) !== id));
    } else {
      onChange([...recipeItems, { ingredientId: Number(id), expectedQuantityKg: '' }]);
    }
  };

  const setQty = (ingredientId, value) => {
    const id = String(ingredientId);
    onChange(recipeItems.map(r =>
      String(r.ingredientId) === id ? { ...r, expectedQuantityKg: value } : r
    ));
  };

  const getQty = (ingredientId) => {
    const row = recipeItems.find(r => String(r.ingredientId) === String(ingredientId));
    return row ? row.expectedQuantityKg : '';
  };

  // Compute estimated total cost per unit
  let estimatedTotal = null;
  for (const r of recipeItems) {
    const qty = Number(r.expectedQuantityKg);
    const price = priceMap[String(r.ingredientId)];
    if (qty > 0 && price != null) {
      estimatedTotal = (estimatedTotal || 0) + qty * price;
    }
  }

  return (
    <div>
      <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 4 }}>
        <table className="table table-sm mb-0">
          <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Ingredient</th>
              <th>Manufacturer</th>
              <th style={{ width: 150 }}>Qty / unit (kg)</th>
              <th style={{ width: 110 }} className="text-end">Cost / unit</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ing => {
              const checked = selectedIds.has(String(ing.id));
              const qty = Number(getQty(ing.id));
              const price = priceMap[String(ing.id)];
              const cost = checked && qty > 0 && price != null ? (qty * price).toFixed(4) : null;
              return (
                <tr key={ing.id} style={{ background: checked ? '#f0fff4' : undefined }}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={checked}
                      onChange={() => toggle(ing.id)}
                    />
                  </td>
                  <td style={{ fontWeight: checked ? 600 : undefined }}>{ing.name}</td>
                  <td className="text-muted" style={{ fontSize: 13 }}>{ing.manufacturer}</td>
                  <td>
                    {checked && (
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.001"
                          placeholder="0.000"
                          value={getQty(ing.id)}
                          onChange={e => setQty(ing.id, e.target.value)}
                        />
                        <span className="input-group-text">kg</span>
                      </div>
                    )}
                  </td>
                  <td className="text-end" style={{ fontSize: 13 }}>
                    {checked
                      ? (cost != null
                        ? <span className="text-success fw-semibold">${cost}</span>
                        : <span className="text-muted">—</span>)
                      : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {estimatedTotal != null && (
        <div className="mt-2 text-end">
          <span className="badge text-bg-secondary" style={{ fontSize: 13 }}>
            Estimated cost / unit: ${estimatedTotal.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function AdminProductPage() {
  const [productName, setProductName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});
  const [recipeCosts, setRecipeCosts] = useState({});

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProductCompanyId, setNewProductCompanyId] = useState('');
  const [newDefaultUnitsPerCart, setNewDefaultUnitsPerCart] = useState('');
  const [newRecipe, setNewRecipe] = useState([]);

  const [editProductId, setEditProductId] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editDefaultUnitsPerCart, setEditDefaultUnitsPerCart] = useState('');
  const [editRecipe, setEditRecipe] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  const [ingredientName, setIngredientName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [ingredientCategory, setIngredientCategory] = useState('');
  const [editIngredient, setEditIngredient] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [newPrice, setNewPrice] = useState({ pricePerKg: '', effectiveDate: '', note: '', unit: 'kg' });

  const [companiesOpen, setCompaniesOpen] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCompanies();
    loadIngredients();
    loadCurrentPrices();
    loadRecipeCosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    try { setProducts(await productService.getProducts({ includeInactive: true })); }
    catch { showAlert('Error loading products.', 'danger'); }
  };

  const loadCompanies = async () => {
    try { setCompanies(await companyService.getCompanies()); }
    catch { showAlert('Error loading companies.', 'danger'); }
  };

  const loadIngredients = async () => {
    try { setIngredients(await ingredientService.getIngredients()); }
    catch { showAlert('Error loading ingredients.', 'danger'); }
  };

  const loadCurrentPrices = async () => {
    try {
      const rows = await ingredientService.getCurrentPrices();
      const map = {};
      for (const r of rows) map[String(r.ingredientId)] = r.pricePerKg;
      setCurrentPrices(map);
    } catch { /* non-critical */ }
  };

  const loadRecipeCosts = async () => {
    try {
      const rows = await productService.getRecipeCosts();
      const map = {};
      for (const r of rows) map[r.productId] = r.estimatedCostPerUnit;
      setRecipeCosts(map);
    } catch { /* non-critical */ }
  };

  const showAlert = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { setMessage(''); setMessageType(''); }, 4000);
  };

  const normalizeRecipe = (raw) =>
    raw.map(item => ({
      ingredientId: item.ingredientId ?? item,
      expectedQuantityKg: item.expectedQuantityKg ?? '',
    }));

  const prepareRecipe = (recipe) =>
    recipe.map(r => ({
      ingredientId: Number(r.ingredientId),
      expectedQuantityKg: r.expectedQuantityKg !== '' ? Number(r.expectedQuantityKg) : null,
    }));

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      await companyService.createCompany(e.target.companyName.value);
      showAlert('Company created successfully!', 'success');
      e.target.reset();
      loadCompanies();
    } catch { showAlert('Error creating company.', 'danger'); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct(productName, newProductCompanyId, prepareRecipe(newRecipe), newDefaultUnitsPerCart);
      showAlert('Product created successfully!', 'success');
      setProductName('');
      setNewProductCompanyId('');
      setNewDefaultUnitsPerCart('');
      setNewRecipe([]);
      setShowCreateProduct(false);
      loadProducts();
      loadRecipeCosts();
    } catch { showAlert('Error creating product.', 'danger'); }
  };

  const startEdit = async (product) => {
    setEditProductId(product.id);
    setEditProductName(product.name);
    setEditCompanyId(product.Company ? product.Company.id : '');
    setEditDefaultUnitsPerCart(product.defaultUnitsPerCart != null ? String(product.defaultUnitsPerCart) : '');
    try {
      const raw = await productService.getProductRecipe(product.id);
      setEditRecipe(normalizeRecipe(raw));
    } catch { setEditRecipe([]); }
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    try {
      await productService.updateProduct(editProductId, editProductName, editCompanyId, prepareRecipe(editRecipe), editDefaultUnitsPerCart);
      showAlert('Product updated successfully!', 'success');
      setShowEditModal(false);
      loadProducts();
      loadRecipeCosts();
    } catch { showAlert('Error updating product.', 'danger'); }
  };

  const handleToggleActive = async (product) => {
    try {
      const { isActive } = await productService.toggleActive(product.id);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive } : p));
      showAlert(`Product ${isActive ? 'reactivated' : 'deactivated'}.`, 'success');
    } catch { showAlert('Error updating product status.', 'danger'); }
  };

  const handleIngredientSubmit = async (e) => {
    e.preventDefault();
    try {
      await ingredientService.createIngredient({ name: ingredientName, manufacturer, category: ingredientCategory || null });
      showAlert('Ingredient created successfully!', 'success');
      setIngredientName('');
      setManufacturer('');
      setIngredientCategory('');
      loadIngredients();
    } catch { showAlert('Error creating ingredient.', 'danger'); }
  };

  const handleIngredientUpdate = async (id) => {
    try {
      await ingredientService.updateIngredient(id, { name: editIngredient.name, manufacturer: editIngredient.manufacturer, category: editIngredient.category || null });
      showAlert('Ingredient updated successfully!', 'success');
      setEditIngredient(null);
      setPriceHistory([]);
      loadIngredients();
    } catch { showAlert('Error updating ingredient.', 'danger'); }
  };

  const startEditIngredient = async (ing) => {
    setEditIngredient(ing);
    setNewPrice({ pricePerKg: '', effectiveDate: '', note: '', unit: 'kg' });
    setLoadingPrices(true);
    try {
      setPriceHistory(await ingredientService.getPrices(ing.id));
    } catch { setPriceHistory([]); }
    finally { setLoadingPrices(false); }
  };

  const handleAddPrice = async () => {
    if (!newPrice.pricePerKg || !newPrice.effectiveDate) {
      showAlert('Price and effective date are required.', 'danger');
      return;
    }
    const LB_TO_KG = 0.453592;
    const pricePerKg = newPrice.unit === 'lb'
      ? Number(newPrice.pricePerKg) / LB_TO_KG
      : Number(newPrice.pricePerKg);
    try {
      const entry = await ingredientService.addPrice(editIngredient.id, {
        pricePerKg,
        effectiveDate: newPrice.effectiveDate,
        note: newPrice.note,
      });
      setPriceHistory(prev => [entry, ...prev]);
      setNewPrice({ pricePerKg: '', effectiveDate: '', note: '', unit: newPrice.unit });
      showAlert('Price recorded.', 'success');
      loadCurrentPrices();
      loadRecipeCosts();
    } catch { showAlert('Error recording price.', 'danger'); }
  };

  const cardHeader = (text) => (
    <div className="card-header text-white d-flex align-items-center" style={{ backgroundColor: '#1b2638' }}>
      <strong>{text}</strong>
    </div>
  );

  const fmtCost = (productId) => {
    const cost = recipeCosts[productId];
    if (cost == null) return <span className="text-muted">—</span>;
    return <span className="badge text-bg-light border">${Number(cost).toFixed(4)}</span>;
  };

  return (
    <div className="container mt-4 pb-5">
      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show fixed-top w-50 mx-auto mt-3`} role="alert" style={{ zIndex: 1050 }}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} />
        </div>
      )}

      {/* ── Products card ── */}
      <div className="card mb-4">
        {cardHeader('Products')}
        <div className="card-body">

          {/* Toggle create form */}
          <div className="mb-3">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowCreateProduct(v => !v)}
            >
              {showCreateProduct ? '− Cancel' : '+ New Product'}
            </button>
          </div>

          {showCreateProduct && (
            <form onSubmit={handleProductSubmit} className="mb-4 p-3 border rounded bg-light">
              <div className="row g-3 mb-3">
                <div className="col-md-5">
                  <label className="form-label">Product Name</label>
                  <input type="text" className="form-control" value={productName} onChange={e => setProductName(e.target.value)} required />
                </div>
                <div className="col-md-5">
                  <label className="form-label">Company</label>
                  <select className="form-select" value={newProductCompanyId} onChange={e => setNewProductCompanyId(e.target.value)} required>
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Default units / cart <small className="text-muted">(optional)</small></label>
                  <input
                    type="number" min="1" step="1" className="form-control"
                    placeholder="e.g. 12"
                    value={newDefaultUnitsPerCart}
                    onChange={e => setNewDefaultUnitsPerCart(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Recipe <small className="text-muted">— check ingredients and enter the expected quantity per unit produced</small>
                </label>
                <RecipeEditor ingredients={ingredients} recipeItems={newRecipe} onChange={setNewRecipe} priceMap={currentPrices} />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Create Product</button>
            </form>
          )}

          {/* Product list table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-sm table-bordered mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product Name</th>
                  <th>Company</th>
                  <th className="text-end" style={{ width: 140 }}>Est. Cost / unit</th>
                  <th style={{ width: 80 }} className="text-center">Status</th>
                  <th style={{ width: 140 }}></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr><td colSpan={5} className="text-muted text-center">No products yet.</td></tr>
                )}
                {products.map(product => (
                  <tr key={product.id} style={product.isActive ? undefined : { opacity: 0.55 }}>
                    <td>{product.name}</td>
                    <td className="text-muted">{product.Company?.name ?? '—'}</td>
                    <td className="text-end">{fmtCost(product.id)}</td>
                    <td className="text-center">
                      {product.isActive
                        ? <span className="badge text-bg-success">Active</span>
                        : <span className="badge text-bg-secondary">Inactive</span>}
                    </td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        {product.isActive && (
                          <button className="btn btn-outline-primary btn-sm" onClick={() => startEdit(product)}>Edit</button>
                        )}
                        <button
                          className={`btn btn-sm ${product.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => handleToggleActive(product)}
                        >
                          {product.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Ingredients card ── */}
      <div className="card mb-4">
        {cardHeader('Ingredients')}
        <div className="card-body">
          <form onSubmit={handleIngredientSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Ingredient Name</label>
                <input type="text" className="form-control" value={ingredientName} onChange={e => setIngredientName(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Manufacturer</label>
                <input type="text" className="form-control" value={manufacturer} onChange={e => setManufacturer(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Category <small className="text-muted">(optional)</small></label>
                <input type="text" className="form-control" placeholder="e.g. Flour, Oil" value={ingredientCategory} onChange={e => setIngredientCategory(e.target.value)} />
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm">Add</button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#ingredientsModal"
                >
                  Manage
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── Companies card (collapsed by default) ── */}
      <div className="card mb-4">
        <div
          className="card-header text-white d-flex align-items-center justify-content-between"
          style={{ backgroundColor: '#1b2638', cursor: 'pointer' }}
          onClick={() => setCompaniesOpen(v => !v)}
        >
          <strong>Companies</strong>
          <span style={{ fontSize: 12 }}>{companiesOpen ? '▲' : '▼'}</span>
        </div>
        {companiesOpen && (
          <div className="card-body">
            <form onSubmit={handleCompanySubmit} className="mb-3">
              <div className="row g-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label">Company Name</label>
                  <input name="companyName" type="text" className="form-control" required />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-primary btn-sm">Create Company</button>
                </div>
              </div>
            </form>
            <table className="table table-sm table-bordered mb-0">
              <thead className="table-light">
                <tr><th>Name</th></tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id}><td>{c.name}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Ingredients Modal ── */}
      <div className="modal fade" id="ingredientsModal" tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: '#1b2638' }}>
              <h5 className="modal-title text-white">Manage Ingredients</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <table className="table table-sm table-bordered mb-0">
                <thead className="table-light">
                  <tr><th>Name</th><th>Manufacturer</th><th>Category</th><th style={{ width: 80 }}></th></tr>
                </thead>
                <tbody>
                  {ingredients.map(ing => (
                    <tr key={ing.id}>
                      <td>
                        {editIngredient?.id === ing.id
                          ? <input type="text" className="form-control form-control-sm" value={editIngredient.name} onChange={e => setEditIngredient({ ...editIngredient, name: e.target.value })} />
                          : ing.name}
                      </td>
                      <td>
                        {editIngredient?.id === ing.id
                          ? <input type="text" className="form-control form-control-sm" value={editIngredient.manufacturer} onChange={e => setEditIngredient({ ...editIngredient, manufacturer: e.target.value })} />
                          : ing.manufacturer}
                      </td>
                      <td>
                        {editIngredient?.id === ing.id
                          ? <input type="text" className="form-control form-control-sm" placeholder="e.g. Flour" value={editIngredient.category || ''} onChange={e => setEditIngredient({ ...editIngredient, category: e.target.value })} />
                          : ing.category ? <span className="badge text-bg-secondary">{ing.category}</span> : <span className="text-muted" style={{ fontSize: 12 }}>—</span>}
                      </td>
                      <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                        {editIngredient?.id === ing.id ? (
                          <button className="btn btn-success btn-sm" onClick={() => handleIngredientUpdate(ing.id)}>Save</button>
                        ) : (
                          <button className="btn btn-outline-primary btn-sm" onClick={() => startEditIngredient(ing)}>Edit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Price history panel */}
              {editIngredient && (
                <div className="mt-4 p-3 border rounded bg-light">
                  <h6 className="mb-3">
                    Price History — <strong>{editIngredient.name}</strong>
                  </h6>

                  <div className="row g-2 align-items-end mb-3">
                    <div className="col-auto">
                      <label className="form-label mb-1" style={{ fontSize: 12 }}>Price / {newPrice.unit}</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text">$</span>
                        <input
                          type="number" min="0" step="0.0001"
                          className="form-control" style={{ width: 100 }}
                          placeholder="0.0000"
                          value={newPrice.pricePerKg}
                          onChange={e => setNewPrice(p => ({ ...p, pricePerKg: e.target.value }))}
                        />
                        <select
                          className="input-group-text form-select form-select-sm"
                          style={{ width: 65 }}
                          value={newPrice.unit}
                          onChange={e => setNewPrice(p => ({ ...p, unit: e.target.value }))}
                        >
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-auto">
                      <label className="form-label mb-1" style={{ fontSize: 12 }}>Effective from</label>
                      <input
                        type="date" className="form-control form-control-sm"
                        value={newPrice.effectiveDate}
                        onChange={e => setNewPrice(p => ({ ...p, effectiveDate: e.target.value }))}
                      />
                    </div>
                    <div className="col">
                      <label className="form-label mb-1" style={{ fontSize: 12 }}>Note <span className="text-muted">(optional)</span></label>
                      <input
                        type="text" className="form-control form-control-sm"
                        placeholder="e.g. new supplier, seasonal increase"
                        value={newPrice.note}
                        onChange={e => setNewPrice(p => ({ ...p, note: e.target.value }))}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={handleAddPrice}
                        disabled={!newPrice.pricePerKg || !newPrice.effectiveDate}
                      >
                        Record
                      </button>
                    </div>
                  </div>

                  {loadingPrices ? (
                    <div className="text-muted" style={{ fontSize: 13 }}>Loading…</div>
                  ) : priceHistory.length === 0 ? (
                    <div className="text-muted" style={{ fontSize: 13 }}>No prices recorded yet.</div>
                  ) : (
                    <table className="table table-sm table-bordered mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Effective from</th>
                          <th>Price / kg</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceHistory.map(p => (
                          <tr key={p.id}>
                            <td>{p.effectiveDate}</td>
                            <td>${Number(p.pricePerKg).toFixed(4)}</td>
                            <td className="text-muted">{p.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Edit Modal ── */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#1b2638' }}>
                <h5 className="modal-title text-white">Edit Product — {editProductName}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-4">
                  <div className="col-md-5">
                    <label className="form-label">Product Name</label>
                    <input type="text" className="form-control" value={editProductName} onChange={e => setEditProductName(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Company</label>
                    <select className="form-select" value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)}>
                      <option value="">Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Default units / cart</label>
                    <input
                      type="number" min="1" step="1" className="form-control"
                      placeholder="e.g. 40"
                      value={editDefaultUnitsPerCart}
                      onChange={e => setEditDefaultUnitsPerCart(e.target.value)}
                    />
                  </div>
                </div>
                <label className="form-label">
                  Recipe <small className="text-muted">— expected quantity per unit produced</small>
                </label>
                <RecipeEditor
                  ingredients={ingredients}
                  recipeItems={editRecipe}
                  onChange={setEditRecipe}
                  priceMap={currentPrices}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductPage;
