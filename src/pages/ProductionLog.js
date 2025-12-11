import React, { useState, useEffect, useMemo } from 'react';
import logService from '../services/logService';
import ProductionTrendChart from '../components/ProductionTrendChart';

function ProductionLog() {
  const [logs, setLogs] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0); // eslint-disable-line no-unused-vars

  // Effective filter state: these are used in the API call.
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Input state for the filter form
  const [inputSearch, setInputSearch] = useState('');
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'production_date',   // default sort
    direction: 'desc',        // 'asc' or 'desc'
  });

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await logService.getLogs(
          currentPage,
          50,
          searchTerm,
          startDate,
          endDate
        );
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotalLogs(data.totalLogs);
      } catch (error) {
        console.error('Error loading logs:', error);
      }
    };

    loadLogs();
  }, [currentPage, searchTerm, startDate, endDate]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(inputSearch);
    setStartDate(inputStartDate);
    setEndDate(inputEndDate);
    setCurrentPage(1);
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    logService
      .getIngredientsByLotCode(log.batchId)
      .then((data) => setIngredients(data))
      .catch((err) => console.error('Error fetching ingredients:', err));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLog(null);
    setIngredients([]);
    setIsModalOpen(false);
  };

  // --- Sorting helpers ---

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // toggle direction
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      // new key: default to ascending
      return { key, direction: 'asc' };
    });
  };

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const sortedLogs = useMemo(() => {
    const clone = [...logs];
    const { key, direction } = sortConfig;

    const dir = direction === 'asc' ? 1 : -1;

    return clone.sort((a, b) => {
      let aVal;
      let bVal;

      switch (key) {
        case 'product':
          aVal = (a.Product?.name || '').toLowerCase();
          bVal = (b.Product?.name || '').toLowerCase();
          break;
        case 'quantity':
          aVal = Number(a.quantity) || 0;
          bVal = Number(b.quantity) || 0;
          break;
        case 'date_logged':
          aVal = a.date_logged ? new Date(a.date_logged).getTime() : 0;
          bVal = b.date_logged ? new Date(b.date_logged).getTime() : 0;
          break;
        case 'production_date':
          aVal = a.Batch?.production_date
            ? new Date(a.Batch.production_date).getTime()
            : 0;
          bVal = b.Batch?.production_date
            ? new Date(b.Batch.production_date).getTime()
            : 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [logs, sortConfig]);

  return (
    <div className="container mt-5">
      <h2 className="text-center">Production Log</h2>

      {/* Analytics */}
      <ProductionTrendChart />

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
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('product')}
            >
              Product{getSortArrow('product')}
            </th>
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('quantity')}
            >
              Quantity{getSortArrow('quantity')}
            </th>
            <th>Lot Code</th>
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('date_logged')}
            >
              Date Logged{getSortArrow('date_logged')}
            </th>
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('production_date')}
            >
              Production Date{getSortArrow('production_date')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedLogs.map((log) => (
            <tr
              key={log.id}
              onClick={() => handleRowClick(log)}
              style={{ cursor: 'pointer' }}
            >
              <td>{log.Product?.name || 'Unknown Product'}</td>
              <td>{log.quantity}</td>
              <td>{log.Batch?.lotCode || 'N/A'}</td>
              <td>{new Date(log.date_logged).toLocaleString()}</td>
              <td>{log.Batch?.production_date || 'N/A'}</td>
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
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ marginTop: '75px' }}
        >
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
              <div
                className="modal-header"
                style={{ backgroundColor: '#1b2638', color: 'white' }}
              >
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
