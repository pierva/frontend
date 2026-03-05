import React, { useEffect, useState, useMemo } from 'react';
import productService from '../services/productService';
import ingredientService from '../services/ingredientService';

const PRINT_STYLES = `
  @media print {
    nav.navbar, nav.navbar + div { display: none !important; }
    @page { size: letter portrait; margin: 18mm 20mm; }
    body { padding: 0 !important; margin: 0 !important; }
  }
`;

function ProductionSchedulePage() {
  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState({});       // { [ingredientId]: pricePerKg }
  const [recipeCache, setRecipeCache] = useState({}); // { [productId]: [{ingredientId, expectedQuantityKg, Ingredient}] }
  const [plan, setPlan] = useState([]);           // [{ productId, name, qty }]
  const [selectedProductId, setSelectedProductId] = useState('');
  const [planQty, setPlanQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null); // productId being fetched

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, currentPrices] = await Promise.all([
          productService.getProducts(),
          ingredientService.getCurrentPrices(),
        ]);
        setProducts(prods.filter(p => p.isActive !== false));
        const priceMap = {};
        currentPrices.forEach(({ ingredientId, pricePerKg }) => {
          priceMap[ingredientId] = Number(pricePerKg);
        });
        setPrices(priceMap);
      } catch (err) {
        console.error('Error loading production schedule data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Add a product to the plan (fetch recipe if not cached)
  const addToPlan = async () => {
    if (!selectedProductId || !planQty || planQty < 1) return;
    const id = Number(selectedProductId);
    setAddingId(id);
    try {
      let recipe = recipeCache[id];
      if (!recipe) {
        recipe = await productService.getProductRecipe(id);
        setRecipeCache(c => ({ ...c, [id]: recipe }));
      }
      const exists = plan.find(p => p.productId === id);
      if (exists) {
        setPlan(prev => prev.map(p => p.productId === id ? { ...p, qty: p.qty + Number(planQty) } : p));
      } else {
        const product = products.find(p => p.id === id);
        setPlan(prev => [...prev, { productId: id, name: product.name, qty: Number(planQty) }]);
      }
    } catch (err) {
      console.error('Error fetching recipe:', err);
    } finally {
      setAddingId(null);
      setSelectedProductId('');
      setPlanQty(1);
    }
  };

  const updateQty = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 1) return;
    setPlan(prev => prev.map(p => p.productId === productId ? { ...p, qty } : p));
  };

  const removeFromPlan = (productId) => {
    setPlan(prev => prev.filter(p => p.productId !== productId));
  };

  // Aggregate ingredient requirements across all plan items
  const ingredientSummary = useMemo(() => {
    const map = {};
    plan.forEach(({ productId, qty }) => {
      (recipeCache[productId] || []).forEach(({ ingredientId, expectedQuantityKg, Ingredient }) => {
        if (!map[ingredientId]) {
          map[ingredientId] = {
            name: Ingredient.name,
            totalKg: 0,
            pricePerKg: prices[ingredientId] ?? null,
          };
        }
        map[ingredientId].totalKg += expectedQuantityKg * qty;
      });
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [plan, recipeCache, prices]);

  const grandTotal = useMemo(
    () => ingredientSummary.reduce((sum, i) => {
      if (i.pricePerKg == null) return sum;
      return sum + i.totalKg * i.pricePerKg;
    }, 0),
    [ingredientSummary]
  );

  const planSummaryText = plan.map(p => `${p.name} ×${p.qty}`).join('  |  ');
  const printDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return <div className="container mt-5"><p>Loading…</p></div>;
  }

  return (
    <>
      <style>{PRINT_STYLES}</style>

      {/* Print-only header */}
      <div className="d-none d-print-block mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
          <h4 style={{ margin: 0 }}>Production Schedule</h4>
          <span style={{ fontSize: 12, color: '#555' }}>{printDate}</span>
        </div>
        {planSummaryText && (
          <p style={{ fontSize: 12, color: '#555', margin: '4px 0 0' }}>
            <strong>Plan:</strong> {planSummaryText}
          </p>
        )}
        <hr style={{ margin: '8px 0 12px' }} />
      </div>

      <div className="container-fluid mt-4 d-print-none" style={{ maxWidth: 1100 }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="mb-0">Production Schedule</h4>
          <button
            className="btn btn-outline-secondary"
            onClick={() => window.print()}
            disabled={ingredientSummary.length === 0}
          >
            Print
          </button>
        </div>
      </div>

      <div className="container-fluid d-print-none" style={{ maxWidth: 1100 }}>
        <div className="row g-4">
          {/* ── Left: Plan builder ── */}
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-header fw-semibold">Plan</div>
              <div className="card-body">
                {/* Add product */}
                <div className="mb-3">
                  <select
                    className="form-select form-select-sm mb-2"
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">Qty</span>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      value={planQty}
                      onChange={e => setPlanQty(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addToPlan()}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={addToPlan}
                      disabled={!selectedProductId || addingId != null}
                    >
                      {addingId != null ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : '+ Add'}
                    </button>
                  </div>
                </div>

                {/* Plan list */}
                {plan.length === 0 ? (
                  <p className="text-muted small">No products added yet.</p>
                ) : (
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th style={{ width: 80 }}>Qty</th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.map(item => (
                        <tr key={item.productId}>
                          <td className="align-middle small">{item.name}</td>
                          <td className="align-middle">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min={1}
                              value={item.qty}
                              onChange={e => updateQty(item.productId, e.target.value)}
                            />
                          </td>
                          <td className="align-middle">
                            <button
                              className="btn btn-link text-danger p-0"
                              onClick={() => removeFromPlan(item.productId)}
                              title="Remove"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Ingredient requirements ── */}
          <div className="col-md-8">
            <div className="card h-100">
              <div className="card-header fw-semibold">Ingredient Requirements</div>
              <div className="card-body p-0">
                {ingredientSummary.length === 0 ? (
                  <p className="text-muted small p-3">
                    Add products to the plan to see ingredient requirements.
                  </p>
                ) : (
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Ingredient</th>
                        <th className="text-end">Total (kg)</th>
                        <th className="text-end">Price / kg</th>
                        <th className="text-end">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredientSummary.map(ing => {
                        const cost = ing.pricePerKg != null ? ing.totalKg * ing.pricePerKg : null;
                        return (
                          <tr key={ing.name}>
                            <td className="align-middle">{ing.name}</td>
                            <td className="align-middle text-end">{ing.totalKg.toFixed(3)}</td>
                            <td className="align-middle text-end text-muted">
                              {ing.pricePerKg != null ? `$${ing.pricePerKg.toFixed(4)}` : '—'}
                            </td>
                            <td className="align-middle text-end fw-semibold">
                              {cost != null ? `$${cost.toFixed(2)}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan={3} className="text-end fw-bold">Grand Total</td>
                        <td className="text-end fw-bold">${grandTotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only ingredient table */}
      <div className="d-none d-print-block">
        {ingredientSummary.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Ingredient</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>Total (kg)</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>Price / kg</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {ingredientSummary.map(ing => {
                const cost = ing.pricePerKg != null ? ing.totalKg * ing.pricePerKg : null;
                return (
                  <tr key={ing.name} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '4px 8px' }}>{ing.name}</td>
                    <td style={{ textAlign: 'right', padding: '4px 8px' }}>{ing.totalKg.toFixed(3)}</td>
                    <td style={{ textAlign: 'right', padding: '4px 8px', color: '#666' }}>
                      {ing.pricePerKg != null ? `$${ing.pricePerKg.toFixed(4)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>
                      {cost != null ? `$${cost.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #333' }}>
                <td colSpan={3} style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>Grand Total</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>${grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </>
  );
}

export default ProductionSchedulePage;
