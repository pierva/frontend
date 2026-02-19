// src/pages/ccp/BakingCcpStartPage.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bakingCcpService from '../../services/bakingCcpService';
import logService from '../../services/logService';
import ingredientService from '../../services/ingredientService';
import productService from '../../services/productService';

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const nowLocalTimeHHMM = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

// productionDate: "YYYY-MM-DD", timeHHMM: "HH:mm" -> ISO string
const combineDateAndTimeToISO = (productionDate, timeHHMM) => {
  if (!productionDate || !timeHHMM) return null;
  // Create a local datetime string, then Date() interprets it as local time.
  const dtLocal = `${productionDate}T${timeHHMM}`;
  const d = new Date(dtLocal);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const generatePizzaciniLotCode = () => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const day = String(today.getDate()).padStart(2, '0');
  const monthLetters = 'ABCDEFGHIJKL';
  const month = monthLetters[today.getMonth()];
  return `${month}-1${year}${day}1`;
};

export default function BakingCcpStartPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [products, setProducts] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);

  const ingredientById = useMemo(() => {
    const m = new Map();
    (allIngredients || []).forEach(i => m.set(Number(i.id), i));
    return m;
  }, [allIngredients]);

  // Multi-product selection
  const [entries, setEntries] = useState([{ productId: '', productName: '' }]);
  const [productSuggestions, setProductSuggestions] = useState({});

  // Cache recipes
  const cachedRecipesRef = useRef({});

  // Ingredient lot codes
  const [ingredientEntries, setIngredientEntries] = useState([]);
  const [confirmMissingLots, setConfirmMissingLots] = useState(false);

  const [form, setForm] = useState({
    lotCode: generatePizzaciniLotCode(),
    productionDate: todayISO(),
    productionStartTime: nowLocalTimeHHMM(), // TIME ONLY
    ovenTempStartF: '', // REQUIRED
  });

  const fetchInitial = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const [prods, ings] = await Promise.all([
        logService.getProducts(),
        ingredientService.getIngredients(),
      ]);
      setProducts(prods || []);
      setAllIngredients(ings || []);
      setForm(f => ({
        ...f,
        lotCode: f.lotCode || generatePizzaciniLotCode(),
        productionStartTime: f.productionStartTime || nowLocalTimeHHMM(),
      }));
    } catch (e) {
      console.error(e);
      setError('Failed to load products/ingredients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Product picker
  const handleProductInputChange = (idx, value) => {
    const clone = [...entries];
    clone[idx].productName = value;
    clone[idx].productId = '';
    setEntries(clone);

    if (value.length > 0) {
      const suggestions = products.filter(p =>
        (p.name || '').toLowerCase().includes(value.toLowerCase())
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

  const addEntry = () => setEntries(e => [...e, { productId: '', productName: '' }]);
  const removeEntry = (idx) => setEntries(e => e.filter((_, i) => i !== idx));

  // Prefill ingredient list from selected products (dedup)
  useEffect(() => {
    const updateIngredientEntries = async () => {
      try {
        const selectedProductIds = entries
          .map(e => e.productId)
          .filter(Boolean)
          .map(x => Number(x));

        if (!selectedProductIds.length) {
          setIngredientEntries([]);
          return;
        }

        const allIngredientIds = new Set();

        for (const pid of selectedProductIds) {
          let recipe = cachedRecipesRef.current[pid];
          if (!recipe) {
            try {
              recipe = await productService.getProductRecipe(pid);
              cachedRecipesRef.current[pid] = recipe;
            } catch (e) {
              console.error('Error fetching recipe for productId', pid, e);
              continue;
            }
          }
          (recipe || []).forEach(id => allIngredientIds.add(Number(id)));
        }

        const next = Array.from(allIngredientIds)
          .filter(Boolean)
          .sort((a, b) => {
            const an = ingredientById.get(a)?.name || '';
            const bn = ingredientById.get(b)?.name || '';
            return an.localeCompare(bn);
          })
          .map(id => {
            const existing = ingredientEntries.find(x => Number(x.ingredientId) === Number(id));
            return { ingredientId: id, ingredientLotCode: existing?.ingredientLotCode || '' };
          });

        setIngredientEntries(next);
      } catch (e) {
        console.error(e);
        setError('Failed to build ingredient list from selected products.');
      }
    };

    updateIngredientEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, ingredientById]);

  const selectedProductIds = useMemo(() => {
    return entries.map(e => e.productId).filter(Boolean).map(x => Number(x));
  }, [entries]);

  const missingLots = useMemo(() => {
    return (ingredientEntries || []).filter(x => !String(x.ingredientLotCode || '').trim());
  }, [ingredientEntries]);

  const canStart = useMemo(() => {
    if (!form.lotCode || String(form.lotCode).trim() === '') return false;
    if (!form.productionDate) return false;
    if (!form.productionStartTime) return false;
    if (!selectedProductIds.length) return false;

    const oven = Number(form.ovenTempStartF);
    if (!Number.isFinite(oven) || oven <= 0) return false;

    // Validate computed startAt
    const startISO = combineDateAndTimeToISO(form.productionDate, form.productionStartTime);
    if (!startISO) return false;

    return true;
  }, [form.lotCode, form.productionDate, form.productionStartTime, form.ovenTempStartF, selectedProductIds.length]);

  const doStart = async () => {
    setStarting(true);
    setError('');
    setNotice('');
    try {
      const productionStartAt = combineDateAndTimeToISO(form.productionDate, form.productionStartTime);
      if (!productionStartAt) {
        setError('Invalid production start time.');
        return;
      }

      const payload = {
        lotCode: String(form.lotCode).trim(),
        productionDate: form.productionDate || null,
        productionStartAt,
        productIds: selectedProductIds,
        ovenTempStartF: Number(form.ovenTempStartF), // REQUIRED
        ingredientLots: (ingredientEntries || []).map(x => ({
          ingredientId: Number(x.ingredientId),
          ingredientLotCode: String(x.ingredientLotCode || '').trim() || null,
        })),
      };

      const res = await bakingCcpService.startRun(payload);
      const runId = res?.run?.id;

      if (!runId) {
        setError('Start succeeded but run id was not returned.');
        return;
      }

      setNotice('Production started.');
      navigate(`/ccp/baking/live/${runId}`, { replace: true });
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Failed to start production run.';
      setError(msg);

      const existingRunId = e?.response?.data?.runId;
      if (existingRunId) {
        navigate(`/ccp/baking/live/${existingRunId}`, { replace: true });
      }
    } finally {
      setStarting(false);
      setConfirmMissingLots(false);
    }
  };

  const handleStart = async () => {
    setError('');
    setNotice('');
    if (missingLots.length > 0 && !confirmMissingLots) {
      setConfirmMissingLots(true);
      return;
    }
    await doStart();
  };

  const regenerateLotCode = () => setForm(f => ({ ...f, lotCode: generatePizzaciniLotCode() }));

  const ingredientName = (ingredientId) =>
    ingredientById.get(Number(ingredientId))?.name || `Ingredient #${ingredientId}`;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h4 className="mb-0">Baking CCP — Start Production</h4>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Create the lot (Batch) and start a live CCP run (1 run = 1 batch).
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/traceability">Home</Link>
            <Link className="btn btn-outline-secondary" to="/ccp/baking/config">Config</Link>
            <button className="btn btn-outline-primary" onClick={fetchInitial} disabled={loading || starting}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        {notice && <div className="alert alert-success mt-3 mb-0">{notice}</div>}

        {confirmMissingLots && missingLots.length > 0 && (
          <div className="alert alert-warning mt-3 mb-0">
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              Ingredient lot codes are missing ({missingLots.length})
            </div>
            <div className="mt-1" style={{ fontSize: 13 }}>
              You can start production, but this will be flagged for traceability completion before QA verification.
            </div>
            <div className="mt-2" style={{ fontSize: 13 }}>
              Missing:
              <ul className="mb-2">
                {missingLots.slice(0, 8).map((i) => (
                  <li key={i.ingredientId}>{ingredientName(i.ingredientId)}</li>
                ))}
                {missingLots.length > 8 && <li>…and {missingLots.length - 8} more</li>}
              </ul>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-secondary" onClick={() => setConfirmMissingLots(false)} disabled={starting}>
                Go Back
              </button>
              <button className="btn btn-warning" onClick={doStart} disabled={starting}>
                {starting ? 'Starting…' : 'Start Anyway'}
              </button>
            </div>
          </div>
        )}

        <div className="row mt-3 g-3">
          <div className="col-12 col-lg-6">
            <label className="form-label mb-1">Lot Code (Auto)</label>
            <div className="input-group">
              <input
                className="form-control"
                value={form.lotCode}
                onChange={(e) => setForm((f) => ({ ...f, lotCode: e.target.value }))}
              />
              <button type="button" className="btn btn-outline-secondary" onClick={regenerateLotCode} disabled={starting || loading}>
                Regenerate
              </button>
            </div>
          </div>

          <div className="col-12 col-lg-3">
            <label className="form-label mb-1">Production Date</label>
            <input
              type="date"
              className="form-control"
              value={form.productionDate}
              onChange={(e) => setForm((f) => ({ ...f, productionDate: e.target.value }))}
            />
          </div>

          <div className="col-12 col-lg-3">
            <label className="form-label mb-1">Production Start Time</label>
            <input
              type="time"
              className="form-control"
              value={form.productionStartTime}
              onChange={(e) => setForm((f) => ({ ...f, productionStartTime: e.target.value }))}
            />
            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
              Default is now. Adjust if production started earlier.
            </div>
          </div>

          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Products (Select 1+)</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Add multiple products if needed. Ingredients will auto-populate from all selected recipes.
                </div>
              </div>
              <button type="button" className="btn btn-outline-secondary" onClick={addEntry} disabled={starting || loading}>
                + Add Product
              </button>
            </div>

            {entries.map((entry, idx) => (
              <div key={idx} className="row mt-2 g-2 align-items-end">
                <div className="col-12 col-lg-8 position-relative">
                  <label className="form-label mb-1">Product</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={entry.productName}
                      onChange={(e) => handleProductInputChange(idx, e.target.value)}
                      placeholder="Type to search product…"
                      style={{ fontSize: 18, fontWeight: 700 }}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => handleShowAllProducts(idx)}>
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
                      {productSuggestions[idx].map((p) => (
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

                <div className="col-12 col-lg-4 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger w-100"
                    onClick={() => removeEntry(idx)}
                    disabled={entries.length === 1 || starting || loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="col-12 col-lg-6">
            <label className="form-label mb-1">Oven Temperature at Start (°F) — Required</label>
            <input
              type="number"
              className="form-control form-control-lg"
              value={form.ovenTempStartF}
              onChange={(e) => setForm((f) => ({ ...f, ovenTempStartF: e.target.value }))}
              placeholder="e.g. 900"
              style={{ fontSize: 18, fontWeight: 700 }}
              required
            />
          </div>

          <div className="col-12">
            <div style={{ fontWeight: 800, fontSize: 16 }}>Ingredient Lot Codes</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Auto-built from selected product recipes. Deduped.
            </div>

            {ingredientEntries.length > 0 ? (
              <div className="table-responsive mt-2">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Ingredient</th>
                      <th>Lot Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientEntries.map((ing) => {
                      const isMissing = !String(ing.ingredientLotCode || '').trim();
                      return (
                        <tr key={ing.ingredientId}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{ingredientName(ing.ingredientId)}</div>
                            {isMissing && <div className="text-danger" style={{ fontSize: 12 }}>Missing</div>}
                          </td>
                          <td>
                            <input
                              className="form-control form-control-lg"
                              value={ing.ingredientLotCode}
                              onChange={(e) => {
                                const v = e.target.value;
                                setIngredientEntries(prev =>
                                  prev.map(x =>
                                    Number(x.ingredientId) === Number(ing.ingredientId)
                                      ? { ...x, ingredientLotCode: v }
                                      : x
                                  )
                                );
                              }}
                              placeholder="Enter / scan lot code"
                              style={{ fontSize: 18, fontWeight: 700 }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted mt-2" style={{ fontSize: 13 }}>
                No ingredients loaded.
              </div>
            )}
          </div>

          <div className="col-12">
            <button
              className="btn btn-success btn-lg w-100"
              style={{ fontSize: 22, fontWeight: 800, padding: '14px 16px' }}
              onClick={handleStart}
              disabled={!canStart || starting || loading || (confirmMissingLots && missingLots.length > 0)}
            >
              {starting ? 'Starting…' : 'START PRODUCTION'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
