// src/pages/trends/ComplaintConfigPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import ComplaintCategoriesManager from '../../components/complaints/ComplaintCategoriesManager';
import ComplaintGuidanceRulesManager from '../../components/complaints/ComplaintGuidanceRulesManager';

export default function ComplaintConfigPage() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Complaints Configuration</h4>
          <Link to="/trends/complaints" className="btn btn-outline-secondary">
            Back to Trends
          </Link>
        </div>

        <div className="alert alert-info mt-3">
          Configure Categories first, then add Guidance Rules. Complaints cannot be created until at least one Category exists.
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-5">
            <ComplaintCategoriesManager />
          </div>
          <div className="col-12 col-lg-7">
            <ComplaintGuidanceRulesManager />
          </div>
        </div>
      </div>
    </div>
  );
}
