import React from 'react';

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <div className="d-flex justify-content-between align-items-center my-3">
      <button className="btn btn-secondary" onClick={onPrev} disabled={page === 1}>&laquo; Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button className="btn btn-secondary" onClick={onNext} disabled={page >= totalPages}>Next &raquo;</button>
    </div>
  );
}