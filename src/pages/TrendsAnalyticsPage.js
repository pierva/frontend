// src/pages/TrendsAnalyticsPage.js
import React, { useMemo, useState } from 'react';
import ComplaintTrendsPanel from '../components/trends/ComplaintTrendsPanel';

const NAV_ITEMS = [
  { key: 'complaints', label: 'Complaints', enabled: true },
  { key: 'production', label: 'Production', enabled: true },
  { key: 'lab', label: 'Lab Tests', enabled: false },
  { key: 'environmental', label: 'Environmental', enabled: true },
];

export default function TrendsAnalyticsPage() {
  const [active, setActive] = useState('complaints');

  const ActivePanel = useMemo(() => {
    switch (active) {
      case 'complaints':
        return <ComplaintTrendsPanel />;
      case 'production':
        return (
          <div className="card">
            <div className="card-body">
              <h5 className="mb-1">Production Trends</h5>
              <div className="text-muted">Coming next. We can reuse your existing ProductionTrendChart here.</div>
            </div>
          </div>
        );
      case 'environmental':
        return (
          <div className="card">
            <div className="card-body">
              <h5 className="mb-1">Environmental Monitoring</h5>
              <div className="text-muted">Coming soon. This will support zone, site, swab type, pass/fail, and CAPA triggers.</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [active]);

  return (
    <div className="container-fluid mt-4">
      <div className="row g-3">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-3">Trends</h5>

              <div className="list-group">
                {NAV_ITEMS.map(item => {
                  const isActive = active === item.key;
                  const disabled = !item.enabled;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={[
                        'list-group-item',
                        'list-group-item-action',
                        isActive ? 'active' : '',
                      ].join(' ')}
                      disabled={disabled}
                      onClick={() => setActive(item.key)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{item.label}</span>
                      {!item.enabled && (
                        <span className="badge bg-secondary">Coming soon</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-muted mt-3" style={{ fontSize: 12 }}>
                Tip: Keep filters consistent across modules (month, product, shift, etc.) for easy comparisons.
              </div>
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="col-12 col-md-9 col-lg-10">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h3 className="mb-0">Trends & Analytics</h3>
          </div>

          {ActivePanel}
        </div>
      </div>
    </div>
  );
}

