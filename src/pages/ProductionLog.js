import React, { useState, useEffect } from 'react';
import logService from '../services/logService';

function ProductionLog() {
  const [logs, setLogs] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Effective filter state: these are used in the API call.
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Input state for the filter form
  const [inputSearch, setInputSearch] = useState('');
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');

  // Fetch logs whenever pagination or effective filters change
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await logService.getLogs(currentPage, 50, searchTerm, startDate, endDate);
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotalLogs(data.totalLogs);
      } catch (error) {
        console.error('Error loading logs:', error);
      }
    };

    loadLogs();
  }, [currentPage, searchTerm, startDate, endDate]);

  // Handle the filter form submission
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // When the form is submitted, update the effective filters
    setSearchTerm(inputSearch);
    setStartDate(inputStartDate);
    setEndDate(inputEndDate);
    // Reset to first page
    setCurrentPage(1);
  };

  // Open modal and load ingredients for a specific log
  const handleRowClick = (log) => {
    setSelectedLog(log);
    logService.getIngredientsByLotCode(log.batchId)
      .then((data) => setIngredients(data))
      .catch((err) => console.error('Error fetching ingredients:', err));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLog(null);
    setIngredients([]);
    setIsModalOpen(false);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Production Log</h2>

      {/* Filter Form */}
      <form onSubmit={handleFilterSubmit} className="mt-4 mb-4">
        <div className="row align-items-end">
          <div className="col-md-4">
            <label htmlFor="searchInput">Search by Lot Code or Product</label>
            <input
              id="searchInput"
              type="text"
              className="form-control"
              placeholder="Enter search term"
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="startDateInput">Start Date</label>
            <input
              id="startDateInput"
              type="date"
              className="form-control"
              value={inputStartDate}
              onChange={(e) => setInputStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="endDateInput">End Date</label>
            <input
              id="endDateInput"
              type="date"
              className="form-control"
              value={inputEndDate}
              onChange={(e) => setInputEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Logs Table */}
      <table className="table table-bordered table-responsive-sm">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Lot Code</th>
            <th>Date Logged</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} onClick={() => handleRowClick(log)} style={{ cursor: 'pointer' }}>
              <td>{log.Product?.name || 'Unknown Product'}</td>
              <td>{log.quantity}</td>
              <td>{log.Batch?.lotCode || 'N/A'}</td>
              <td>{new Date(log.date_logged).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="d-flex justify-content-between align-items-center my-3">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          &laquo; Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage >= totalPages}
        >
          Next &raquo;
        </button>
      </div>

      {/* Ingredients Modal */}
      {isModalOpen && selectedLog && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ marginTop: '75px' }}>
          <div
            className="modal-dialog"
            role="document"
            style={{
              WebkitBoxShadow: '0px -2px 17px -1px rgba(0,0,0,0.75)',
              MozBoxShadow: '0px -2px 17px -1px rgba(0,0,0,0.75)',
              boxShadow: '0px -2px 17px -1px rgba(0,0,0,0.75)',
            }}
          >
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#1b2638', color: 'white' }}>
                <h5 className="modal-title">
                  Ingredients for Lot Code: {selectedLog.Batch?.lotCode || 'N/A'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  style={{ filter: 'invert(1)' }}
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                {ingredients.length > 0 ? (
                  <table className="table table-bordered table-responsive-sm">
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Lot Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map((ingredient) => (
                        <tr key={ingredient.id}>
                          <td>{ingredient.Ingredient?.name || 'Unknown'}</td>
                          <td>{ingredient.ingredientLotCode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No ingredients found for this log.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductionLog;
