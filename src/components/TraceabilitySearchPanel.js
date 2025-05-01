import React from 'react';

export default function TraceabilitySearchPanel({
  lotSearchValue,
  productSearchValue,
  onLotSearchChange,
  onProductSearchChange,
  ingredientCode,
  onIngredientCodeChange,
  onIngredientSearch,
  onIngredientClear,
  isIngredientActive
}) {
  return (
    <>
      <h4>Search traceability records</h4>
    <div className="row gx-3 mb-4">
      {/* Search by Lot Code */}
      <div className="col-md-3">
        <div className="mb-3">
        <label>Lot code search</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Lot Code to search"
            value={lotSearchValue}
            onChange={onLotSearchChange}
          />
        </div>
      </div>

      {/* Search by Product Name */}
      <div className="col-md-4">
        <div className="mb-3">
        <label>Product name search</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Product Name to search"
            value={productSearchValue}
            onChange={onProductSearchChange}
          />
        </div>
      </div>

      {/* Search by Ingredient Lot Code */}
      <div className="col-md-5">
        <div className="mb-3">
            <label>Ingredient lot code search</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter Ingredient Lot Code"
              value={ingredientCode}
              onChange={e => onIngredientCodeChange(e.target.value)}
            />
            <button
              className={`btn ${isIngredientActive ? 'btn-secondary' : 'btn-primary'}`}
              onClick={isIngredientActive ? onIngredientClear : onIngredientSearch}
            >
              {isIngredientActive ? 'Clear' : 'Search'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
