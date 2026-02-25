// src/pages/ccp/BakingCcpLivePage.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import bakingCcpService from '../../services/bakingCcpService';
import logService from '../../services/logService';

export default function BakingCcpLivePage() {
  const { runId } = useParams();

  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');

  // feedback banners
  const [successMsg, setSuccessMsg] = useState('');
  const [warnMsg, setWarnMsg] = useState('');

  // products for cart creation
  const [products, setProducts] = useState([]);

  // temp modal
  const [showTempModal, setShowTempModal] = useState(false);
  const [tempF, setTempF] = useState('');
  const [tempCartId, setTempCartId] = useState(''); // optional: tie temp to a cart
  const [savingTemp, setSavingTemp] = useState(false);

  // cart modal
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartProductId, setCartProductId] = useState('');
  const [cartUnits, setCartUnits] = useState('');
  const [cartNotes, setCartNotes] = useState('');
  const [savingCart, setSavingCart] = useState(false);

  const runStatus = run?.status || '';

  const canPause = runStatus === 'BAKING';
  const canResume = runStatus === 'BAKING_PAUSED';
  const canStopBaking = ['BAKING', 'BAKING_PAUSED'].includes(runStatus);

  // ✅ Baking actions allowed only while baking is active/paused
  const canBakingActions = ['BAKING'].includes(runStatus);


  const clearBanners = () => {
    setError('');
    setSuccessMsg('');
    setWarnMsg('');
  };

  const productById = useMemo(() => {
    const m = new Map();
    (products || []).forEach(p => m.set(Number(p.id), p));
    return m;
  }, [products]);

  const selectedProductDefaultUnits = useMemo(() => {
    if (!cartProductId) return null;
    const p = productById.get(Number(cartProductId));
    const def = p?.defaultUnitsPerCart;
    const n = def == null || def === '' ? null : Number(def);
    return Number.isFinite(n) ? n : null;
  }, [cartProductId, productById]);


  const fetchAll = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      clearBanners();
    }

    try {
      const [cfgRes, productsRes] = await Promise.all([
        bakingCcpService.getConfig(),
        logService.getProducts().catch(() => []),
      ]);

      setCfg(cfgRes?.config || null);
      setProducts(Array.isArray(productsRes) ? productsRes : []);

      // Prefer live endpoint if present; fallback gracefully
      try {
        const liveRes = await bakingCcpService.getRunLive(runId);
        setRun(liveRes?.run || null);
      } catch (e) {
        const runRes = await bakingCcpService.getRun(runId);
        setRun(runRes?.run || null);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load live production run.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  // polling for live updates
  useEffect(() => {
    const t = setInterval(() => {
      fetchAll({ silent: true });
    }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const maxMinutes = cfg?.maxMinutesBetweenTemps ?? 60;
  const maxMinutesToFreezer = cfg?.maxMinutesToFreezer ?? 360;

  const carts = useMemo(() => {
    const list = Array.isArray(run?.Carts) ? run.Carts : [];
    return [...list].sort((a, b) => (a.cartNumber || 0) - (b.cartNumber || 0));
  }, [run]);

  const lastTempAt = useMemo(() => {
    const list = Array.isArray(run?.TempReadings) ? run.TempReadings : [];
    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => new Date(a.readingAt) - new Date(b.readingAt));
    const last = sorted[sorted.length - 1];
    return last?.readingAt ? new Date(last.readingAt) : null;
  }, [run]);

  const minutesSinceLast = useMemo(() => {
    if (!lastTempAt) return null;
    const diffMs = Date.now() - lastTempAt.getTime();
    return Math.floor(diffMs / 60000);
  }, [lastTempAt]);

  const isOverdue = minutesSinceLast != null && minutesSinceLast > maxMinutes;

  const cartsOverdueFreezer = useMemo(() => {
    const nowMs = Date.now();
    return carts.filter(c => {
      if (!c?.ovenOutAt) return false;
      if (c?.blastOutAt) return false;
      const ovenOutMs = new Date(c.ovenOutAt).getTime();
      if (!Number.isFinite(ovenOutMs)) return false;
      const mins = Math.floor((nowMs - ovenOutMs) / 60000);
      return mins > maxMinutesToFreezer;
    });
  }, [carts, maxMinutesToFreezer]);

  const runLot = run?.Batch?.lotCode || (run?.batchId ? `Batch #${run.batchId}` : '—');
  const runProdDate = run?.Batch?.production_date || '—';

  // --------------------
  // Actions
  // --------------------
  const doPause = async () => {
    clearBanners();
    try {
      await bakingCcpService.pauseRun(runId);
      setSuccessMsg('Run paused.');
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      setError('Failed to pause run (endpoint missing or server error).');
    }
  };

  const doResume = async () => {
    clearBanners();
    try {
      await bakingCcpService.resumeRun(runId);
      setSuccessMsg('Run resumed.');
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      setError('Failed to resume run (endpoint missing or server error).');
    }
  };

  const doStopBaking = async () => {
    clearBanners();

    // extra guard (button should be disabled anyway)
    if (!['BAKING', 'BAKING_PAUSED'].includes(run?.status)) {
      setWarnMsg('Baking is already stopped (or run is not in a stoppable state).');
      return;
    }
    try {
      await bakingCcpService.stopBaking(runId);
      setWarnMsg('Baking stopped. Packaging can continue with freezer events and completion.');
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Failed to stop baking.';
      setError(msg);
    }
  };

  const openTempModal = () => {
    clearBanners();
    if (!['BAKING'].includes(run?.status)) {
      setWarnMsg('Baking is stopped. Temperature readings are disabled.');
      return;
    }
    setTempF('');
    setTempCartId('');

    // Nice UX: if run has primary product default units and cartUnits is empty, prefill it
    if (cartUnits === '' && run?.productId) {
      const p = productById.get(Number(run.productId));
      const def = p?.defaultUnitsPerCart;
      if (def != null && def !== '' && Number.isFinite(Number(def))) {
        setCartUnits(String(Number(def)));
      }
    }

    setShowTempModal(true);
  };

  const saveTemp = async () => {
    clearBanners();
    const n = Number(tempF);
    if (!Number.isFinite(n) || n <= 0) {
      setError('Please enter a valid temperature in °F.');
      return;
    }

    setSavingTemp(true);
    try {
      await bakingCcpService.addTempReading(runId, {
        temperatureF: n,
        cartId: tempCartId ? Number(tempCartId) : null,
      });

      setSuccessMsg('Temperature recorded.');
      setShowTempModal(false);
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || 'Failed to record temperature.';
      setError(msg);
    } finally {
      setSavingTemp(false);
    }
  };

  const openCartModal = () => {
    clearBanners();
    if (!['BAKING'].includes(run?.status)) {
      setWarnMsg('Baking is stopped. Creating new carts is disabled.');
      return;
    }
    // Default product = run product if available
    const pid = run?.productId ? String(run.productId) : '';
    setCartProductId(pid);

    // ✅ Prefill units from product.defaultUnitsPerCart
    if (pid) {
      const p = productById.get(Number(pid));
      const def = p?.defaultUnitsPerCart;
      if (def != null && def !== '' && Number.isFinite(Number(def))) {
        setCartUnits(String(Number(def)));
      } else {
        setCartUnits('');
      }
    } else {
      setCartUnits('');
    }

    setCartNotes('');
    setShowCartModal(true);
  };

  // ✅ If user changes product in cart modal, update units from that product default
  useEffect(() => {
    if (!showCartModal) return;
    if (!cartProductId) return;

    const p = productById.get(Number(cartProductId));
    const def = p?.defaultUnitsPerCart;

    if (def != null && def !== '' && Number.isFinite(Number(def))) {
      setCartUnits(String(Number(def)));
    } else {
      setCartUnits('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartProductId, showCartModal]);

  // ✅ If user ties temperature to a cart, prefill units with that cart's units (if present)
  useEffect(() => {
    if (!showTempModal) return;
    if (!tempCartId) return;

    const c = carts.find(x => String(x.id) === String(tempCartId));
    if (c?.unitsInCart != null && c.unitsInCart !== '' && Number.isFinite(Number(c.unitsInCart))) {
      setCartUnits(String(Number(c.unitsInCart)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempCartId, showTempModal]);

  const createCart = async () => {
    clearBanners();
    if (!cartProductId) {
      setError('Select a product for the cart.');
      return;
    }
    const units = cartUnits === '' ? null : Number(cartUnits);
    if (units != null && (!Number.isFinite(units) || units < 0)) {
      setError('Units in cart must be a valid number.');
      return;
    }

    setSavingCart(true);
    try {
      await bakingCcpService.createCart(runId, {
        productId: Number(cartProductId),
        unitsInCart: units,
        notes: cartNotes || null,
      });

      setSuccessMsg('Cart created.');
      setShowCartModal(false);
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || 'Failed to create cart.';
      setError(msg);
    } finally {
      setSavingCart(false);
    }
  };

  const blastIn = async (cartId) => {
    clearBanners();
    try {
      await bakingCcpService.markCartBlastIn(cartId);
      setSuccessMsg(`Cart #${cartId} marked Blast In.`);
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      setError('Failed to mark Blast In.');
    }
  };

  const blastOut = async (cartId) => {
    clearBanners();
    try {
      await bakingCcpService.markCartBlastOut(cartId);
      setSuccessMsg(`Cart #${cartId} marked Blast Out.`);
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      setError('Failed to mark Blast Out.');
    }
  };

  // optional: auto-dismiss banners
  useEffect(() => {
    if (!successMsg && !warnMsg) return;
    const t = setTimeout(() => {
      setSuccessMsg('');
      setWarnMsg('');
    }, 3500);
    return () => clearTimeout(t);
  }, [successMsg, warnMsg]);

  const quickTemps = [200, 205, 210, 215, 220];
  const quickUnits = [30, 40, 60, 80];

  const renderQuickButtons = (values, onPick, { activeValue = null } = {}) => (
    <div className="d-flex flex-wrap gap-2 mt-2">
      {values.map(v => {
        const isActive =
          activeValue != null &&
          Number.isFinite(Number(activeValue)) &&
          Number(activeValue) === Number(v);

        return (
          <button
            key={v}
            type="button"
            className={`btn ${isActive ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => onPick(v)}
            style={{ fontWeight: 800 }}
          >
            {v}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h4 className="mb-0">Baking CCP — Live Mode</h4>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Big buttons, minimal typing. Baking + Packaging can run in parallel.
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/ccp/baking/start">
              Start Page
            </Link>
            <Link className="btn btn-outline-secondary" to="/ccp/baking/config">
              Config
            </Link>
            <button className="btn btn-outline-primary" onClick={() => fetchAll()} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        {warnMsg && <div className="alert alert-warning mt-3 mb-0">{warnMsg}</div>}
        {successMsg && <div className="alert alert-success mt-3 mb-0">{successMsg}</div>}

        {run && (
          <>
            <div className="row mt-3 g-3">
              <div className="col-12 col-lg-6">
                <div className="card">
                  <div className="card-body">
                    <div className="text-muted">Batch / Lot Code</div>
                    <div style={{ fontSize: 26, fontWeight: 900 }}>
                      {runLot}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Production date: {runProdDate}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Product (primary): {run?.Product?.name || '—'}
                    </div>

                    <div className="mt-3 d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={doPause}
                        disabled={!canPause}
                        title={!canPause ? `Cannot pause when status is ${runStatus || '—'}` : 'Pause'}
                      >
                        Pause
                      </button>

                      <button
                        className="btn btn-outline-secondary"
                        onClick={doResume}
                        disabled={!canResume}
                        title={!canResume ? `Cannot resume when status is ${runStatus || '—'}` : 'Resume'}
                      >
                        Resume
                      </button>

                      <button
                        className="btn btn-outline-danger"
                        onClick={doStopBaking}
                        disabled={!canStopBaking}
                        title={!canStopBaking ? `Nothing to stop (status is ${runStatus || '—'})` : 'Stop Baking'}
                      >
                        Stop Baking
                      </button>
                    </div>


                    <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                      “Stop Baking” ends CCP1 activity; packaging (CCP2) continues.
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="card">
                  <div className="card-body">
                    <div className="text-muted">Temperature interval rule</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>
                      Max {maxMinutes} min between readings
                    </div>

                    <div className="mt-2">
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Last reading:
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {lastTempAt ? lastTempAt.toLocaleString() : 'No readings yet'}
                      </div>

                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Minutes since last: {minutesSinceLast == null ? '—' : minutesSinceLast}
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="alert alert-danger mt-3 mb-0" style={{ fontWeight: 800 }}>
                        TEMP OVERDUE — record a temperature now.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary actions */}
              <div className="col-12">
                <div className="d-flex flex-column flex-md-row gap-2">
                  <button
                    className="btn btn-primary btn-lg flex-fill"
                    style={{ fontSize: 22, fontWeight: 900, padding: '14px 16px' }}
                    onClick={openTempModal}
                    disabled={!canBakingActions}
                    title={!canBakingActions ? `Cannot record temps when status is ${runStatus || '—'}` : 'Record Temperature'}
                  >
                    RECORD TEMPERATURE
                  </button>

                  <button
                    className="btn btn-outline-secondary btn-lg flex-fill"
                    style={{ fontSize: 22, fontWeight: 900, padding: '14px 16px' }}
                    onClick={openCartModal}
                    disabled={!canBakingActions}
                    title={!canBakingActions ? `Cannot create carts when status is ${runStatus || '—'}` : 'New Cart'}
                  >
                    NEW CART
                  </button>
                </div>

                <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                  Tip: baking team taps NEW CART; packaging team uses Blast In/Out below.
                </div>
              </div>

              {/* Freezer window alerts */}
              {cartsOverdueFreezer.length > 0 && (
                <div className="col-12">
                  <div className="alert alert-danger mb-0" style={{ fontWeight: 800 }}>
                    FREEZER WINDOW OVERDUE — {cartsOverdueFreezer.length} cart(s) have been out of oven more than {maxMinutesToFreezer} minutes without Blast Out.
                  </div>
                </div>
              )}

              {/* Carts list */}
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Carts</h6>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Total carts: {carts.length}
                      </div>
                    </div>

                    <div className="table-responsive mt-3">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th style={{ width: 90 }}>Cart</th>
                            <th>Units</th>
                            <th>Oven Out</th>
                            <th>Blast In</th>
                            <th>Blast Out</th>
                            <th style={{ width: 260 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {carts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-muted">No carts yet.</td>
                            </tr>
                          ) : carts.map((c) => {
                            const ovenOut = c.ovenOutAt ? new Date(c.ovenOutAt) : null;
                            const blastInAt = c.blastInAt ? new Date(c.blastInAt) : null;
                            const blastOutAt = c.blastOutAt ? new Date(c.blastOutAt) : null;

                            const freezerOverdue = (() => {
                              if (!ovenOut) return false;
                              if (blastOutAt) return false;
                              const mins = Math.floor((Date.now() - ovenOut.getTime()) / 60000);
                              return mins > maxMinutesToFreezer;
                            })();

                            return (
                              <tr key={c.id}>
                                <td style={{ fontWeight: 900 }}>#{c.cartNumber}</td>
                                <td>{c.unitsInCart ?? '—'}</td>
                                <td>{ovenOut ? ovenOut.toLocaleTimeString() : '—'}</td>
                                <td>{blastInAt ? blastInAt.toLocaleTimeString() : '—'}</td>
                                <td>
                                  {blastOutAt ? blastOutAt.toLocaleTimeString() : (
                                    freezerOverdue ? <span className="badge bg-danger">OVERDUE</span> : '—'
                                  )}
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-outline-primary"
                                      onClick={() => blastIn(c.id)}
                                      disabled={!!c.blastInAt}
                                    >
                                      Blast In
                                    </button>
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => blastOut(c.id)}
                                      disabled={!!c.blastOutAt}
                                    >
                                      Blast Out
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="text-muted" style={{ fontSize: 12 }}>
                      SQF intent: carts provide a production cross-check and ensure freezer timing control.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        {!run && !loading && !error && (
          <div className="text-muted mt-3">Run not found.</div>
        )}

        {/* TEMP MODAL */}
        {showTempModal && (
          <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Record Temperature</h5>
                  <button type="button" className="btn-close" onClick={() => setShowTempModal(false)} />
                </div>
                <div className="modal-body">
                  <label className="form-label mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={tempF}
                    onChange={(e) => setTempF(e.target.value)}
                    placeholder="e.g. 200"
                    style={{ fontSize: 22, fontWeight: 800, padding: '14px 12px' }}
                    inputMode="numeric"
                  />

                  {/* ✅ Quick temp buttons */}
                  <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                    Quick temps
                  </div>
                  {renderQuickButtons(quickTemps, (v) => setTempF(String(v)))}

                  <div className="mt-3">
                    <label className="form-label mb-1">Tie to cart (optional)</label>
                    <select
                      className="form-select"
                      value={tempCartId}
                      onChange={(e) => setTempCartId(e.target.value)}
                    >
                      <option value="">No cart</option>
                      {carts.map(c => (
                        <option key={c.id} value={c.id}>Cart #{c.cartNumber}</option>
                      ))}
                    </select>
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      If you measured a specific cart, select it; otherwise leave blank.
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowTempModal(false)} disabled={savingTemp}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveTemp} disabled={savingTemp}>
                    {savingTemp ? 'Saving…' : 'Save Temperature'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CART MODAL */}
        {showCartModal && (
          <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">New Cart</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCartModal(false)} />
                </div>
                <div className="modal-body">
                  <label className="form-label mb-1">Product</label>
                  <select
                    className="form-select"
                    value={cartProductId}
                    onChange={(e) => setCartProductId(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <div className="mt-3">
                    <label className="form-label mb-1">Units in cart (auto from product)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={cartUnits}
                      onChange={(e) => setCartUnits(e.target.value)}
                      placeholder="e.g. 40"
                      style={{ fontSize: 18, fontWeight: 800, padding: '12px 12px' }}
                      inputMode="numeric"
                    />

                    <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                      Quick units
                    </div>
                    {renderQuickButtons(
                      quickUnits,
                      (v) => setCartUnits(String(v)),
                      {
                        // highlight current units if set; otherwise highlight product default
                        activeValue: cartUnits !== '' ? cartUnits : selectedProductDefaultUnits,
                      }
                    )}

                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      Set default units per cart in product config, or use quick buttons above.
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label mb-1">Notes (optional)</label>
                    <input
                      className="form-control"
                      value={cartNotes}
                      onChange={(e) => setCartNotes(e.target.value)}
                      placeholder="Quick note"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowCartModal(false)} disabled={savingCart}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={createCart} disabled={savingCart}>
                    {savingCart ? 'Saving…' : 'Create Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
