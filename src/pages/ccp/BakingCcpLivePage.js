// src/pages/ccp/BakingCcpLivePage.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import bakingCcpService from '../../services/bakingCcpService';
import logService from '../../services/logService';

export default function BakingCcpLivePage() {
  const { runId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMode = (searchParams.get('mode') || 'baking').toLowerCase();
  const [mode, setMode] = useState(initialMode === 'packaging' ? 'packaging' : 'baking');

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
  const [tempCartId, setTempCartId] = useState('');
  const [savingTemp, setSavingTemp] = useState(false);

  // cart modal
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartProductId, setCartProductId] = useState('');
  const [cartUnits, setCartUnits] = useState('');
  const [cartNotes, setCartNotes] = useState('');
  const [savingCart, setSavingCart] = useState(false);

  // packaging complete modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showBlockingModal, setShowBlockingModal] = useState(false);
  const [finLot, setFinLot] = useState('');
  const [qtyProduced, setQtyProduced] = useState('');
  const [qtyDiscarded, setQtyDiscarded] = useState('');
  const [packNotes, setPackNotes] = useState('');
  const [deviation, setDeviation] = useState(false);
  const [deviationNotes, setDeviationNotes] = useState('');
  const [correctiveNotes, setCorrectiveNotes] = useState('');
  const [answers, setAnswers] = useState({});
  const [savingComplete, setSavingComplete] = useState(false);
  const [editableProductTotals, setEditableProductTotals] = useState([]);

  // countdown tick (packaging card updates every minute)
  const [tick, setTick] = useState(0);

  // collapsed completed carts
  const [showCompletedCarts, setShowCompletedCarts] = useState(false);

  const clearBanners = () => {
    setError('');
    setSuccessMsg('');
    setWarnMsg('');
  };

  const setModeAndUrl = (next) => {
    const n = next === 'packaging' ? 'packaging' : 'baking';
    setMode(n);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('mode', n);
      return p;
    });
  };

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

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  useEffect(() => {
    const t = setInterval(() => fetchAll({ silent: true }), 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const runStatus = run?.status || '';
  const isBaking = runStatus === 'BAKING';
  const isPaused = runStatus === 'BAKING_PAUSED';
  const isStopped = runStatus === 'BAKING_STOPPED';
  const isCompleted = runStatus === 'COMPLETED';
  const isVerified = !!run?.verifiedAt;

  const canRecordTemp = mode === 'baking' && isBaking && !isVerified && !isCompleted;
  const canCreateCart = mode === 'baking' && (isBaking || isPaused) && !isVerified && !isCompleted;
  const canStopBaking = (isBaking || isPaused) && !isVerified && !isCompleted;
  const canPause = isBaking && !isVerified && !isCompleted;
  const canResume = (isPaused || isStopped) && !isVerified && !isCompleted;

  const maxMinutes = cfg?.maxMinutesBetweenTemps ?? 60;
  const maxMinutesToFreezer = cfg?.maxMinutesToFreezer ?? 360;

  const carts = useMemo(() => {
    const list = Array.isArray(run?.Carts) ? run.Carts : [];
    return [...list].sort((a, b) => (a.cartNumber || 0) - (b.cartNumber || 0));
  }, [run]);

  const activeCarts = useMemo(() => carts.filter(c => !c?.blastOutAt), [carts]);
  const completedCarts = useMemo(() => carts.filter(c => !!c?.blastOutAt), [carts]);

  const lastTempAt = useMemo(() => {
    const list = Array.isArray(run?.TempReadings) ? run.TempReadings : [];
    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => new Date(a.readingAt) - new Date(b.readingAt));
    const last = sorted[sorted.length - 1];
    return last?.readingAt ? new Date(last.readingAt) : null;
  }, [run]);

  const minutesSinceLast = useMemo(() => {
    if (!lastTempAt) return null;
    return Math.floor((Date.now() - lastTempAt.getTime()) / 60000);
  }, [lastTempAt]);

  const isOverdue = isBaking && minutesSinceLast != null && minutesSinceLast >= maxMinutes;
  const minsUntilNextTemp = useMemo(() => {
    if (!isBaking) return null;
    if (minutesSinceLast == null) return maxMinutes; // no readings yet, full interval available
    return maxMinutes - minutesSinceLast;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBaking, minutesSinceLast, maxMinutes, tick]);
  const isApproaching = minsUntilNextTemp != null && minsUntilNextTemp <= 5 && minsUntilNextTemp > 0;

  const cartsOverdueFreezer = useMemo(() => {
    const nowMs = Date.now();
    return carts.filter(c => {
      if (!c?.ovenOutAt) return false;
      if (c?.blastOutAt) return false;
      const ovenOutMs = new Date(c.ovenOutAt).getTime();
      if (!Number.isFinite(ovenOutMs)) return false;
      return Math.floor((nowMs - ovenOutMs) / 60000) > maxMinutesToFreezer;
    });
  }, [carts, maxMinutesToFreezer]);

  const runLot = run?.Batch?.lotCode || (run?.batchId ? `Batch #${run.batchId}` : '—');
  const runProdDate = run?.Batch?.production_date || '—';

  const productById = useMemo(() => {
    const m = new Map();
    (products || []).forEach(p => m.set(Number(p.id), p));
    return m;
  }, [products]);

  // Products selected at run start — used for quick-select buttons in cart modal.
  // Falls back to the single primary product for runs created before this field existed.
  const scheduledProducts = useMemo(() => {
    const ids = Array.isArray(run?.scheduledProductIdsJson) && run.scheduledProductIdsJson.length > 0
      ? run.scheduledProductIdsJson
      : run?.productId ? [run.productId] : [];
    return ids.map(id => productById.get(Number(id))).filter(Boolean);
  }, [run?.scheduledProductIdsJson, run?.productId, productById]);

  const freezerCarts = useMemo(() => {
    return carts.filter(c => c?.blastInAt && !c?.blastOutAt);
  }, [carts]);

  const blastOutTotalsByProduct = useMemo(() => {
    const totals = new Map();
    carts.forEach(c => {
      if (!c?.blastOutAt) return;
      const pid = Number(c.productId);
      const units = c.unitsInCart == null ? 0 : Number(c.unitsInCart);
      totals.set(pid, (totals.get(pid) || 0) + (Number.isFinite(units) ? units : 0));
    });
    return totals;
  }, [carts]);

  const blastOutTotalsList = useMemo(() => {
    const out = [];
    blastOutTotalsByProduct.forEach((units, pid) => {
      const name =
        productById.get(pid)?.name ||
        run?.Carts?.find(x => Number(x.productId) === pid)?.Product?.name ||
        `Product #${pid}`;
      out.push({ productId: pid, name, units });
    });
    out.sort((a, b) => b.units - a.units);
    return out;
  }, [blastOutTotalsByProduct, productById, run]);

  const totalUnitsBlastedOut = useMemo(() => {
    let sum = 0;
    blastOutTotalsByProduct.forEach(v => {
      const n = Number(v);
      if (Number.isFinite(n)) sum += n;
    });
    return sum;
  }, [blastOutTotalsByProduct]);

  // Carts blocking production completion
  const cartsNotYetFrozen = useMemo(() => {
    return carts.filter(c => !c?.blastInAt);
  }, [carts]);

  const cartsStillInFreezer = useMemo(() => {
    return carts.filter(c => c?.blastInAt && !c?.blastOutAt);
  }, [carts]);

  const hasBlockingCarts = cartsNotYetFrozen.length > 0 || cartsStillInFreezer.length > 0;

  // Derived from editable state — NO bare setState calls in render body
  const editedTotalUnits = useMemo(() => {
    return editableProductTotals.reduce((sum, r) => {
      const n = Number(r.units);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [editableProductTotals]);

  const cartsWaitingBlastIn = useMemo(() => {
    if (mode !== 'packaging') return [];
    const nowMs = Date.now();
    return carts
      .filter(c => !c?.blastInAt)
      .map(c => {
        const createdAt = c?.createdAt ? new Date(c.createdAt) : null;
        const createdMs = createdAt ? createdAt.getTime() : NaN;
        const minsElapsed = Number.isFinite(createdMs) ? Math.floor((nowMs - createdMs) / 60000) : null;
        const minsRemaining = minsElapsed == null ? null : (Number(maxMinutesToFreezer) - minsElapsed);
        return { cart: c, createdAt, minsElapsed, minsRemaining };
      })
      .filter(x => x.createdAt && Number.isFinite(x.createdAt.getTime()))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, carts, maxMinutesToFreezer, tick]);

  const oldestWaitingBlastIn = cartsWaitingBlastIn[0] || null;

  const getServerMsg = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

  const doPause = async () => {
    clearBanners();
    try {
      await bakingCcpService.pauseRun(runId);
      setSuccessMsg('Run paused.');
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      setError(getServerMsg(e, 'Failed to pause run.'));
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
      setError(getServerMsg(e, 'Failed to resume run.'));
    }
  };

  const doStopBaking = async () => {
    clearBanners();
    try {
      await bakingCcpService.stopBaking(runId);
      setWarnMsg('Baking stopped. Packaging can continue with freezer events and completion.');
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      setError(getServerMsg(e, 'Failed to stop baking.'));
    }
  };

  const openTempModal = () => {
    clearBanners();
    setTempF('');
    setTempCartId('');
    setShowTempModal(true);
  };

  const saveTemp = async () => {
    clearBanners();
    if (!isBaking) {
      setError('Temperature can only be recorded while run is in BAKING status.');
      return;
    }
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
      setError(getServerMsg(e, 'Failed to record temperature.'));
    } finally {
      setSavingTemp(false);
    }
  };

  const openCartModal = () => {
    clearBanners();
    // Default to the last cart's product (most recently used), fall back to first scheduled product
    const lastCart = carts.length > 0 ? carts[carts.length - 1] : null;
    const defaultPid = lastCart
      ? String(lastCart.productId)
      : (scheduledProducts[0] ? String(scheduledProducts[0].id) : (run?.productId ? String(run.productId) : ''));
    setCartProductId(defaultPid);
    const p = defaultPid ? productById.get(Number(defaultPid)) : null;
    setCartUnits(p?.defaultUnitsPerCart != null ? String(p.defaultUnitsPerCart) : '');
    setCartNotes('');
    setShowCartModal(true);
  };

  useEffect(() => {
    if (!showCartModal) return;
    if (!cartProductId) return;
    const p = productById.get(Number(cartProductId));
    if (!p) return;
    if (cartUnits === '' || cartUnits == null) {
      if (p.defaultUnitsPerCart != null) setCartUnits(String(p.defaultUnitsPerCart));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartProductId, showCartModal, productById]);

  const createCart = async () => {
    clearBanners();
    if (!(isBaking || isPaused)) {
      setError('Cannot create carts unless run is BAKING or BAKING_PAUSED.');
      return;
    }
    if (!cartProductId) {
      setError('Select a product for the cart.');
      return;
    }
    const units = cartUnits === '' ? null : Number(cartUnits);
    if (units != null && (!Number.isFinite(units) || units <= 0)) {
      setError('Units in cart must be a positive number.');
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
      setError(getServerMsg(e, 'Failed to create cart.'));
    } finally {
      setSavingCart(false);
    }
  };

  const blastIn = async (cartId) => {
    clearBanners();
    try {
      await bakingCcpService.markCartBlastIn(cartId);
      setSuccessMsg(`Cart marked Blast In.`);
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      setError(getServerMsg(e, 'Failed to mark Blast In.'));
    }
  };

  const blastOut = async (cartId) => {
    clearBanners();
    try {
      await bakingCcpService.markCartBlastOut(cartId);
      setSuccessMsg(`Cart marked Blast Out.`);
      fetchAll({ silent: true });
    } catch (e) {
      console.error(e);
      setError(getServerMsg(e, 'Failed to mark Blast Out.'));
    }
  };

  const questions = useMemo(() => {
    const q = run?.packagingQuestionsJson ?? cfg?.packagingQuestionsJson ?? [];
    return Array.isArray(q) ? q : [];
  }, [run, cfg]);

  const normalizedQuestions = useMemo(() => {
    return questions.map((q, idx) => {
      if (typeof q === 'string') {
        return { key: `q_${idx}`, question: q, type: 'CHECK', required: true };
      }
      const key = q.key || q.id || `q_${idx}`;
      return {
        key,
        question: q.question || q.label || `Question ${idx + 1}`,
        type: (q.type || 'CHECK').toUpperCase(),
        required: q.required !== false,
        options: Array.isArray(q.options) ? q.options : [],
      };
    });
  }, [questions]);

  const openCompleteModal = () => {
    clearBanners();

    // Block if any carts haven't completed the freezer cycle
    if (hasBlockingCarts) {
      setShowBlockingModal(true);
      return;
    }

    const fgLot = run?.Batch?.lotCode || '';
    setFinLot(fgLot);
    setQtyProduced(totalUnitsBlastedOut ? String(totalUnitsBlastedOut) : '');
    setQtyDiscarded('');
    setPackNotes(run?.packagingNotes || '');
    setDeviation(!!run?.deviation);
    setDeviationNotes(run?.deviationNotes || '');
    setCorrectiveNotes(run?.correctiveActionNotes || '');

    const seed = {};
    const prev = Array.isArray(run?.packagingAnswersJson) ? run.packagingAnswersJson : [];
    prev.forEach(a => {
      if (!a) return;
      const k = a.key || a.questionKey || a.question || null;
      if (k) seed[k] = a.value ?? a.checked ?? a.answer ?? null;
    });
    setAnswers(seed);

    // ✅ Seed editable totals here — the ONLY place this should be set
    setEditableProductTotals(blastOutTotalsList.map(r => ({ ...r })));

    setShowCompleteModal(true);
  };

  const allRequiredAnswered = useMemo(() => {
    return normalizedQuestions.every(q => {
      if (!q.required) return true;
      const v = answers[q.key];
      if (q.type === 'CHECK') return v === true;
      if (q.type === 'TEXT') return String(v || '').trim().length > 0;
      if (q.type === 'NUMBER') return Number.isFinite(Number(v));
      if (q.type === 'SELECT') return String(v || '').trim().length > 0;
      return v != null && String(v).trim() !== '';
    });
  }, [normalizedQuestions, answers]);

  const doComplete = async () => {
    clearBanners();

    if (isVerified) {
      setError('Run is verified and cannot be changed.');
      return;
    }
    if (!isStopped) {
      setError('Packaging completion requires baking to be STOPPED first.');
      return;
    }
    if (hasBlockingCarts) {
      setError('All carts must complete the blast freezer cycle before closing the run.');
      return;
    }
    if (!String(finLot || '').trim()) {
      setError('Finished Goods Lot Code is required.');
      return;
    }
    if (!allRequiredAnswered) {
      setError('Please answer all required packaging checklist questions.');
      return;
    }

    setSavingComplete(true);
    try {
      const packagingAnswersJson = normalizedQuestions.map(q => ({
        key: q.key,
        question: q.question,
        type: q.type,
        required: q.required,
        value: answers[q.key] ?? null,
        at: new Date().toISOString(),
      }));

      const disc = qtyDiscarded === '' ? null : Number(qtyDiscarded);

      await bakingCcpService.completeRun(runId, {
        packagingAnswersJson,
        finishedGoodsLotCode: String(finLot).trim(),
        quantityProduced: editedTotalUnits,
        productTotals: editableProductTotals.map(r => ({
          productId: r.productId,
          name: r.name,
          units: Number(r.units) || 0,
        })),
        quantityDiscarded: disc,
        notes: packNotes || '',
        deviation: !!deviation,
        deviationNotes: deviationNotes || '',
        correctiveActionNotes: correctiveNotes || '',
      });

      setSuccessMsg('Production completed and sent to QA for verification.');
      setShowCompleteModal(false);
      fetchAll({ silent: true });
          // Tell the navbar to refresh — run is no longer active
      window.dispatchEvent(new Event('productionStatusChanged'));
    } catch (e) {
      console.error(e);
      setError(getServerMsg(e, 'Failed to complete production.'));
    } finally {
      setSavingComplete(false);
    }
  };

  useEffect(() => {
    if (!successMsg && !warnMsg) return;
    const t = setTimeout(() => {
      setSuccessMsg('');
      setWarnMsg('');
    }, 3500);
    return () => clearTimeout(t);
  }, [successMsg, warnMsg]);

  const tempQuick = [200, 205, 210, 215, 220];
  const unitsQuick = [30, 40, 60, 80];
  const disableBakingControlsInPackaging = mode === 'packaging';

  return (
    <>
    <style>{`
      @keyframes borderFlash {
        0%, 100% { box-shadow: 0 0 0 2px transparent; }
        50% { box-shadow: 0 0 0 3px #fd7e14; }
      }
    `}</style>
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h4 className="mb-0">Baking CCP — Live Mode</h4>
            <div className="text-muted" style={{ fontSize: 12 }}>
              One run. Two modes: Baking and Packaging.
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

        {/* Mode toggle */}
        <div className="mt-3 d-flex gap-2">
          <button
            className={`btn btn-lg flex-fill ${mode === 'baking' ? 'btn-primary' : 'btn-outline-primary'}`}
            style={{ fontWeight: 900 }}
            onClick={() => setModeAndUrl('baking')}
          >
            BAKING
          </button>
          <button
            className={`btn btn-lg flex-fill ${mode === 'packaging' ? 'btn-primary' : 'btn-outline-primary'}`}
            style={{ fontWeight: 900 }}
            onClick={() => setModeAndUrl('packaging')}
          >
            PACKAGING
          </button>
        </div>

        {/* Feedback */}
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        {warnMsg && <div className="alert alert-warning mt-3 mb-0">{warnMsg}</div>}
        {successMsg && <div className="alert alert-success mt-3 mb-0">{successMsg}</div>}

        {run && (
          <>
            <div className="row mt-3 g-3">
              {/* Left card */}
              <div className="col-12 col-lg-6">
                <div className="card">
                  <div className="card-body">
                    <div className="text-muted">Batch / Lot Code</div>
                    <div style={{ fontSize: 26, fontWeight: 900 }}>{runLot}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Production date: {runProdDate}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Status: <span style={{ fontWeight: 800 }}>{runStatus || '—'}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Product (primary): {run?.Product?.name || '—'}
                    </div>

                    <div className="mt-3 d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={doPause}
                        disabled={disableBakingControlsInPackaging || !canPause}
                        title={disableBakingControlsInPackaging ? 'Baking controls are disabled in Packaging mode.' : ''}
                      >
                        Pause
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={doResume}
                        disabled={disableBakingControlsInPackaging || !canResume}
                        title={disableBakingControlsInPackaging ? 'Baking controls are disabled in Packaging mode.' : ''}
                      >
                        Resume
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={doStopBaking}
                        disabled={disableBakingControlsInPackaging || !canStopBaking}
                        title={disableBakingControlsInPackaging ? 'Baking controls are disabled in Packaging mode.' : ''}
                      >
                        Stop Baking
                      </button>
                    </div>

                    <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                      "Stop Baking" ends CCP1; packaging (freezer + checklist) continues.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right card */}
              {mode === 'baking' ? (
                <div className="col-12 col-lg-6">
                  <div
                    className="card"
                    style={isApproaching || isOverdue ? {
                      animation: 'borderFlash 1.2s ease-in-out infinite',
                    } : {}}
                  >
                    <div className="card-body">
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Temperature interval: {maxMinutes} min between readings
                      </div>

                      {!isBaking ? (
                        <div className="mt-2 text-muted" style={{ fontSize: 14 }}>
                          Temperature monitoring is active only while baking.
                        </div>
                      ) : (
                        <>
                          <div className="mt-2 d-flex align-items-baseline gap-2">
                            <div style={{ fontSize: 13, color: '#6c757d' }}>Next reading in</div>
                          </div>
                          <div style={{
                            fontSize: 48,
                            fontWeight: 900,
                            lineHeight: 1,
                            color: isOverdue ? '#dc3545' : isApproaching ? '#fd7e14' : '#212529'
                          }}>
                            {isOverdue
                              ? `+${Math.abs(minsUntilNextTemp)} min`
                              : minsUntilNextTemp != null
                                ? `${minsUntilNextTemp} min`
                                : '—'}
                          </div>
                          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                            Last reading: {lastTempAt ? lastTempAt.toLocaleString() : 'No readings yet'}
                          </div>
                          {isOverdue && (
                            <div className="alert alert-danger mt-3 mb-0" style={{ fontWeight: 800 }}>
                              TEMP OVERDUE — record a temperature now.
                            </div>
                          )}
                          {isApproaching && !isOverdue && (
                            <div className="alert alert-warning mt-3 mb-0" style={{ fontWeight: 800 }}>
                              Next temperature reading due soon.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="col-12 col-lg-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="text-muted">Cold Chain Control</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>
                        Remaining allowed time above 41°F
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Clock starts when cart is created (first pizzas placed). Must be Blast In within {maxMinutesToFreezer} minutes.
                      </div>

                      {!oldestWaitingBlastIn ? (
                        <div className="mt-3 text-muted" style={{ fontSize: 14 }}>
                          No carts currently waiting for Blast In.
                        </div>
                      ) : (
                        <div className="mt-3">
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            Oldest cart waiting for Blast In
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <div style={{ fontSize: 22, fontWeight: 900 }}>
                              Cart #{oldestWaitingBlastIn.cart.cartNumber}
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900 }}>
                              {oldestWaitingBlastIn.minsRemaining == null
                                ? '—'
                                : `${oldestWaitingBlastIn.minsRemaining} min`}
                            </div>
                          </div>
                          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                            Created: {oldestWaitingBlastIn.createdAt ? oldestWaitingBlastIn.createdAt.toLocaleString() : '—'}
                          </div>
                          {oldestWaitingBlastIn.minsRemaining != null && oldestWaitingBlastIn.minsRemaining < 0 && (
                            <div className="alert alert-danger mt-3 mb-0" style={{ fontWeight: 800 }}>
                              OVERDUE — This cart exceeded the allowed time above 41°F.
                            </div>
                          )}
                          {cartsWaitingBlastIn.length > 1 && (
                            <div className="mt-3">
                              <div className="text-muted" style={{ fontSize: 12 }}>Next carts:</div>
                              <ul className="mb-0" style={{ fontSize: 13 }}>
                                {cartsWaitingBlastIn.slice(1, 4).map(x => (
                                  <li key={x.cart.id}>
                                    Cart #{x.cart.cartNumber} — {x.minsRemaining == null ? '—' : `${x.minsRemaining} min`}
                                  </li>
                                ))}
                                {cartsWaitingBlastIn.length > 4 && (
                                  <li>…and {cartsWaitingBlastIn.length - 4} more</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Primary actions */}
              {mode === 'baking' && (
                <div className="col-12">
                  <div className="d-flex flex-column flex-md-row gap-2">
                    <button
                      className="btn btn-primary btn-lg flex-fill"
                      style={{ fontSize: 22, fontWeight: 900, padding: '14px 16px' }}
                      onClick={openTempModal}
                      disabled={!canRecordTemp}
                      title={!canRecordTemp ? 'Temp can be recorded only in BAKING status.' : ''}
                    >
                      RECORD TEMPERATURE
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-lg flex-fill"
                      style={{ fontSize: 22, fontWeight: 900, padding: '14px 16px' }}
                      onClick={openCartModal}
                      disabled={!canCreateCart}
                      title={!canCreateCart ? 'Carts can be created only while BAKING or PAUSED.' : ''}
                    >
                      NEW CART
                    </button>
                  </div>
                  <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                    Tip: baking taps NEW CART; packaging uses Blast In/Out below.
                  </div>
                </div>
              )}

              {/* Packaging action */}
              {mode === 'packaging' && (
                <div className="col-12">
                  <button
                    className="btn btn-success btn-lg w-100"
                    style={{ fontSize: 22, fontWeight: 900, padding: '14px 16px' }}
                    onClick={openCompleteModal}
                    disabled={!isStopped || isVerified || isCompleted}
                    title={!isStopped ? 'Stop Baking first, then complete production.' : ''}
                  >
                    COMPLETE PRODUCTION (CLOSE RUN)
                  </button>
                  <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                    Complete production and send to QA for verification and validation.
                  </div>
                  {!isStopped && (
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      Requirement: run status must be <b>BAKING_STOPPED</b>.
                    </div>
                  )}
                </div>
              )}

              {/* Freezer window alerts */}
              {cartsOverdueFreezer.length > 0 && (
                <div className="col-12">
                  <div className="alert alert-danger mb-0" style={{ fontWeight: 800 }}>
                    FREEZER WINDOW OVERDUE — {cartsOverdueFreezer.length} cart(s) have been out of oven more than {maxMinutesToFreezer} minutes without Blast Out.
                  </div>
                </div>
              )}

              {/* Packaging dashboard */}
              {mode === 'packaging' && (
                <>
                  <div className="col-12 col-lg-6">
                    <div className="card">
                      <div className="card-body">
                        <div style={{ fontWeight: 900, fontSize: 16 }}>In Freezer (Blast In, not Blast Out)</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          Total carts in freezer: {freezerCarts.length}
                        </div>
                        <div className="table-responsive mt-3">
                          <table className="table table-sm align-middle">
                            <thead>
                              <tr>
                                <th style={{ width: 80 }}>Cart</th>
                                <th>Product</th>
                                <th style={{ width: 90 }}>Units</th>
                                <th style={{ width: 120 }}>Blast In</th>
                                <th style={{ width: 120 }}>Minutes</th>
                                <th style={{ width: 120 }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {freezerCarts.length === 0 ? (
                                <tr><td colSpan={6} className="text-muted">No carts currently in freezer.</td></tr>
                              ) : freezerCarts.map(c => {
                                const bi = c.blastInAt ? new Date(c.blastInAt) : null;
                                const mins = bi ? Math.floor((Date.now() - bi.getTime()) / 60000) : '—';
                                const name = c?.Product?.name || productById.get(Number(c.productId))?.name || `Product #${c.productId}`;
                                return (
                                  <tr key={c.id}>
                                    <td style={{ fontWeight: 900 }}>#{c.cartNumber}</td>
                                    <td>{name}</td>
                                    <td>{c.unitsInCart ?? '—'}</td>
                                    <td>{bi ? bi.toLocaleTimeString() : '—'}</td>
                                    <td>{mins}</td>
                                    <td>
                                      <button className="btn btn-outline-success" onClick={() => blastOut(c.id)} disabled={!!c.blastOutAt}>
                                        Blast Out
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          Packaging uses Blast Out to count finished goods by product.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="card">
                      <div className="card-body">
                        <div style={{ fontWeight: 900, fontSize: 16 }}>Blast Out Totals (this run)</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          Totals update as carts are blasted out.
                        </div>
                        <div className="table-responsive mt-3">
                          <table className="table table-sm align-middle">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th style={{ width: 140 }}>Total Units</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blastOutTotalsList.length === 0 ? (
                                <tr><td colSpan={2} className="text-muted">No Blast Out totals yet.</td></tr>
                              ) : blastOutTotalsList.map(r => (
                                <tr key={r.productId}>
                                  <td style={{ fontWeight: 800 }}>{r.name}</td>
                                  <td style={{ fontWeight: 900 }}>{r.units}</td>
                                </tr>
                              ))}
                              {blastOutTotalsList.length > 0 && (
                                <tr>
                                  <td style={{ fontWeight: 900 }}>TOTAL</td>
                                  <td style={{ fontWeight: 900 }}>{totalUnitsBlastedOut}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          If some carts have blank units, totals may be undercounted.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Carts list */}
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Carts</h6>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {completedCarts.length > 0
                          ? `Active: ${activeCarts.length} | Total: ${carts.length}`
                          : `Total carts: ${carts.length}`}
                      </div>
                    </div>
                    <div className="table-responsive mt-3">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th style={{ width: 90 }}>Cart</th>
                            <th>Product</th>
                            <th>Units</th>
                            <th>Oven Out</th>
                            <th>Blast In</th>
                            <th>Blast Out</th>
                            <th style={{ width: 260 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeCarts.length === 0 && completedCarts.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-muted">No carts yet.</td>
                            </tr>
                          ) : activeCarts.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-muted">All carts have been processed.</td>
                            </tr>
                          ) : activeCarts.map((c) => {
                            const ovenOut = c.ovenOutAt ? new Date(c.ovenOutAt) : null;
                            const blastInAt = c.blastInAt ? new Date(c.blastInAt) : null;
                            const blastOutAt = c.blastOutAt ? new Date(c.blastOutAt) : null;
                            const freezerOverdue = (() => {
                              if (!ovenOut) return false;
                              if (blastOutAt) return false;
                              return Math.floor((Date.now() - ovenOut.getTime()) / 60000) > maxMinutesToFreezer;
                            })();
                            const prodName = c?.Product?.name || productById.get(Number(c.productId))?.name || '—';
                            return (
                              <tr key={c.id}>
                                <td style={{ fontWeight: 900 }}>#{c.cartNumber}</td>
                                <td>{prodName}</td>
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
                                      disabled={!!c.blastInAt || isVerified || isCompleted}
                                    >
                                      Blast In
                                    </button>
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => blastOut(c.id)}
                                      disabled={!!c.blastOutAt || isVerified || isCompleted}
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

                    {completedCarts.length > 0 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setShowCompletedCarts(v => !v)}
                        >
                          {showCompletedCarts
                            ? `▼ Hide ${completedCarts.length} completed cart${completedCarts.length !== 1 ? 's' : ''}`
                            : `▶ Show ${completedCarts.length} completed cart${completedCarts.length !== 1 ? 's' : ''}`}
                        </button>
                        {showCompletedCarts && (
                          <div className="table-responsive mt-2" style={{ opacity: 0.6 }}>
                            <table className="table table-sm align-middle">
                              <thead>
                                <tr>
                                  <th style={{ width: 90 }}>Cart</th>
                                  <th>Product</th>
                                  <th>Units</th>
                                  <th>Oven Out</th>
                                  <th>Blast In</th>
                                  <th>Blast Out</th>
                                  <th style={{ width: 110 }}>Freezer (min)</th>
                                  <th style={{ width: 70 }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {completedCarts.map((c) => {
                                  const ovenOut = c.ovenOutAt ? new Date(c.ovenOutAt) : null;
                                  const blastInAt = c.blastInAt ? new Date(c.blastInAt) : null;
                                  const blastOutAt = c.blastOutAt ? new Date(c.blastOutAt) : null;
                                  const freezerMins = blastInAt && blastOutAt
                                    ? Math.round((blastOutAt.getTime() - blastInAt.getTime()) / 60000)
                                    : null;
                                  const prodName = c?.Product?.name || productById.get(Number(c.productId))?.name || '—';
                                  return (
                                    <tr key={c.id}>
                                      <td style={{ fontWeight: 900 }}>#{c.cartNumber}</td>
                                      <td>{prodName}</td>
                                      <td>{c.unitsInCart ?? '—'}</td>
                                      <td>{ovenOut ? ovenOut.toLocaleTimeString() : '—'}</td>
                                      <td>{blastInAt ? blastInAt.toLocaleTimeString() : '—'}</td>
                                      <td>{blastOutAt ? blastOutAt.toLocaleTimeString() : '—'}</td>
                                      <td style={{ fontWeight: 700 }}>{freezerMins != null ? `${freezerMins} min` : '—'}</td>
                                      <td><span className="badge text-bg-success">Done</span></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

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
                    placeholder="e.g. 210"
                    style={{ fontSize: 22, fontWeight: 800, padding: '14px 12px' }}
                    inputMode="numeric"
                    disabled={!isBaking}
                  />
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {tempQuick.map(v => (
                      <button
                        key={v}
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setTempF(String(v))}
                        disabled={!isBaking}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="form-label mb-1">Tie to cart (optional)</label>
                    <select
                      className="form-select"
                      value={tempCartId}
                      onChange={(e) => setTempCartId(e.target.value)}
                      disabled={!isBaking}
                    >
                      <option value="">No cart</option>
                      {carts.filter(c => !c?.blastInAt).map(c => (
                        <option key={c.id} value={c.id}>Cart #{c.cartNumber}</option>
                      ))}
                    </select>
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      If you measured a specific cart, select it; otherwise leave blank.
                    </div>
                    {!isBaking && (
                      <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        Temperature recording is disabled unless status is <b>BAKING</b>.
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowTempModal(false)} disabled={savingTemp}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveTemp} disabled={savingTemp || !isBaking}>
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
                  {scheduledProducts.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label mb-2 fw-semibold">Today's Schedule</label>
                      <div className="d-flex flex-wrap gap-2">
                        {scheduledProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className={`btn btn-lg ${Number(cartProductId) === p.id ? 'btn-primary' : 'btn-outline-primary'}`}
                            style={{ fontWeight: 700 }}
                            onClick={() => {
                              setCartProductId(String(p.id));
                              if (p.defaultUnitsPerCart != null) setCartUnits(String(p.defaultUnitsPerCart));
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="form-label mb-1">
                    {scheduledProducts.length > 0 ? 'Other product' : 'Product'}
                  </label>
                  <select
                    className="form-select"
                    value={cartProductId}
                    onChange={(e) => setCartProductId(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.defaultUnitsPerCart != null ? ` (default ${p.defaultUnitsPerCart})` : ''}
                      </option>
                    ))}
                  </select>

                  <div className="mt-3">
                    <label className="form-label mb-1">Units in cart</label>
                    <input
                      type="number"
                      className="form-control"
                      value={cartUnits}
                      onChange={(e) => setCartUnits(e.target.value)}
                      placeholder="e.g. 40"
                      style={{ fontSize: 18, fontWeight: 800, padding: '12px 12px' }}
                      inputMode="numeric"
                    />
                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {unitsQuick.map(v => (
                        <button
                          key={v}
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setCartUnits(String(v))}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      Default uses Product.defaultUnitsPerCart when available.
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

        {/* BLOCKING CARTS MODAL */}
        {showBlockingModal && (
          <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header" style={{ background: '#ffc107' }}>
                  <h5 className="modal-title" >CANNOT CLOSE PRODUCTION</h5>
                  <button type="button" className="btn-close" onClick={() => setShowBlockingModal(false)} />
                </div>
                <div className="modal-body">

                     {hasBlockingCarts && (
                    <div className="alert alert-warning mt-3 mb-0">
                      <div style={{ fontWeight: 900, fontSize: 15 }}>
                        ⚠️ Production cannot be closed until all carts have completed the blast freezer cycle.
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        Every cart must be sent into the blast freezer and taken out before the run can be finalized.
                      </div>

                      {cartsNotYetFrozen.length > 0 && (
                        <div className="mt-2">
                          <div style={{ fontWeight: 800, fontSize: 13 }}>Not yet sent to freezer:</div>
                          <ul className="mb-0 mt-1" style={{ fontSize: 13 }}>
                            {cartsNotYetFrozen.map(c => {
                              const name = c?.Product?.name || productById.get(Number(c.productId))?.name || `Product #${c.productId}`;
                              return (
                                <li key={c.id}>
                                  Cart #{c.cartNumber} — {name} {c.unitsInCart != null ? `(${c.unitsInCart} units)` : ''}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {cartsStillInFreezer.length > 0 && (
                        <div className="mt-2">
                          <div style={{ fontWeight: 800, fontSize: 13 }}>Still inside the blast freezer (Blast Out pending):</div>
                          <ul className="mb-0 mt-1" style={{ fontSize: 13 }}>
                            {cartsStillInFreezer.map(c => {
                              const name = c?.Product?.name || productById.get(Number(c.productId))?.name || `Product #${c.productId}`;
                              const bi = c.blastInAt ? new Date(c.blastInAt).toLocaleTimeString() : '—';
                              return (
                                <li key={c.id}>
                                  Cart #{c.cartNumber} — {name} {c.unitsInCart != null ? `(${c.unitsInCart} units)` : ''} · Blast In: {bi}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={() => setShowBlockingModal(false)}>
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETE PRODUCTION MODAL */}
        {showCompleteModal && (
          <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Complete Production (Close Run)</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCompleteModal(false)} />
                </div>

                <div className="modal-body">
                  <div className="alert alert-secondary" style={{ fontSize: 13 }}>
                    Requirement: baking must be <b>STOPPED</b>. Checklist questions are required to close the batch for the day.
                  </div>

                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label mb-1">Finished Goods Lot Code <span className="text-danger">*</span></label>
                      <input
                        className="form-control"
                        value={finLot}
                        readOnly
                        disabled
                      />
                      <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        Auto-filled from the Batch lot code created at run start.
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label mb-1">Total Units Produced</label>
                      <input
                        className="form-control"
                        value={editedTotalUnits}
                        readOnly
                        disabled
                      />
                      <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        Auto-calculated from the editable product totals below.
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div style={{ fontWeight: 900 }}>Units by Product Type</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Pre-filled from Blast Out totals. Edit if actual counts differ.
                    </div>

                    <div className="table-responsive mt-2">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th style={{ width: 160 }}>Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editableProductTotals.length === 0 ? (
                            <tr><td colSpan={2} className="text-muted">No Blast Out totals yet.</td></tr>
                          ) : (
                            <>
                              {editableProductTotals.map((r, idx) => (
                                <tr key={r.productId}>
                                  <td style={{ fontWeight: 800 }}>{r.name}</td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={r.units}
                                      min={0}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? '' : Number(e.target.value);
                                        setEditableProductTotals(prev =>
                                          prev.map((x, i) => i === idx ? { ...x, units: val } : x)
                                        );
                                      }}
                                    />
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td style={{ fontWeight: 900 }}>TOTAL</td>
                                <td style={{ fontWeight: 900 }}>{editedTotalUnits}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="row g-2 mt-2">
                      <div className="col-12 col-md-6">
                        <label className="form-label mb-1">Discarded Units (optional)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={qtyDiscarded}
                          onChange={(e) => setQtyDiscarded(e.target.value)}
                          placeholder="e.g. 12"
                        />
                        <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                          Optional now. Future: AI inspection will populate this automatically.
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <input type="hidden" value={qtyProduced} onChange={() => { }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div style={{ fontWeight: 900 }}>Packaging Checklist</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      All required questions must be answered to complete.
                    </div>
                    <div className="mt-2">
                      {normalizedQuestions.length === 0 ? (
                        <div className="text-muted">No questions configured.</div>
                      ) : normalizedQuestions.map(q => (
                        <div key={q.key} className="border rounded p-2 mb-2">
                          <div style={{ fontWeight: 800 }}>
                            {q.question} {q.required && <span className="text-danger">*</span>}
                          </div>

                          {q.type === 'CHECK' && (
                            <div className="form-check mt-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={answers[q.key] === true}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.checked }))}
                              />
                              <label className="form-check-label">Confirmed</label>
                            </div>
                          )}

                          {q.type === 'TEXT' && (
                            <input
                              className="form-control mt-2"
                              value={answers[q.key] || ''}
                              onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                              placeholder="Enter answer"
                            />
                          )}

                          {q.type === 'NUMBER' && (
                            <input
                              type="number"
                              className="form-control mt-2"
                              value={answers[q.key] ?? ''}
                              onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                              placeholder="Enter number"
                            />
                          )}

                          {q.type === 'SELECT' && (
                            <select
                              className="form-select mt-2"
                              value={answers[q.key] ?? ''}
                              onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                            >
                              <option value="">Select…</option>
                              {q.options.map(opt => (
                                <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={deviation}
                        onChange={(e) => setDeviation(e.target.checked)}
                        id="devCheck"
                      />
                      <label className="form-check-label" htmlFor="devCheck">
                        Deviation occurred
                      </label>
                    </div>

                    {deviation && (
                      <div className="row g-2 mt-2">
                        <div className="col-12">
                          <label className="form-label mb-1">Deviation Notes</label>
                          <textarea className="form-control" value={deviationNotes} onChange={(e) => setDeviationNotes(e.target.value)} />
                        </div>
                        <div className="col-12">
                          <label className="form-label mb-1">Corrective Action Notes</label>
                          <textarea className="form-control" value={correctiveNotes} onChange={(e) => setCorrectiveNotes(e.target.value)} />
                        </div>
                      </div>
                    )}

                    <div className="mt-2">
                      <label className="form-label mb-1">Packaging Notes (optional)</label>
                      <textarea className="form-control" value={packNotes} onChange={(e) => setPackNotes(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <div className="me-auto text-muted" style={{ fontSize: 12 }}>
                    {allRequiredAnswered ? 'Checklist ready.' : 'Checklist incomplete.'}
                  </div>
                  <button className="btn btn-outline-secondary" onClick={() => setShowCompleteModal(false)} disabled={savingComplete}>
                    Cancel
                  </button>
                  <div className="d-flex flex-column align-items-end">
                    <button
                      className="btn btn-success"
                      onClick={doComplete}
                      disabled={savingComplete || !isStopped || !allRequiredAnswered}
                      title={!isStopped ? 'Stop Baking first.' : (!allRequiredAnswered ? 'Answer all required questions.' : '')}
                    >
                      {savingComplete ? 'Saving…' : 'Complete Production'}
                    </button>
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      Complete production and send to QA for verification and validation.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  );
}