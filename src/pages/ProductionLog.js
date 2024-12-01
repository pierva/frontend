import React, { useState, useEffect } from 'react';
import logService from '../services/logService';

function ProductionLog() {
    const [logs, setLogs] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [sortConfig, setSortConfig] = useState({ key: 'date_logged', direction: 'ascending' });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [totalsVisible, setTotalsVisible] = useState(false);

    // Fetch logs and initialize
    useEffect(() => {
        const loadLogs = async () => {
            try {
                const logsData = await logService.getLogs();
                
                setLogs(logsData);
            } catch (error) {
                console.error('Error loading logs:', error);
            }
        };

        loadLogs();
    }, []);

    // Fetch ingredients for a specific log
    const fetchIngredients = async (batchId) => {
        try {
            const ingredientData = await logService.getIngredientsByLotCode(batchId);
            setIngredients(ingredientData);
        } catch (error) {
            console.error('Error fetching ingredients:', error);
        }
    };

    // Handle row click
    const handleRowClick = (log) => {
        setSelectedLog(log);
        
        fetchIngredients(log.batchId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedLog(null);
        setIngredients([]);
        setIsModalOpen(false);
    };

    // Filter logs by search term
    const filterLogsBySearchTerm = (logs) => {
        return logs.filter((log) => {
            const search = searchTerm.toLowerCase();
            const productName = log.Product?.name.toLowerCase() || '';
            const lotCode = log.Batch?.lotCode.toLowerCase() || '';
            return productName.includes(search) || lotCode.includes(search);
        });
    };

    // Filter logs by date range
    const filterLogsByDate = (logs) => {
        return logs.filter((log) => {
            const logDate = new Date(log.date_logged).toISOString().split('T')[0];
            const start = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
            const end = endDate ? new Date(endDate).toISOString().split('T')[0] : null;

            if (start && logDate < start) return false;
            if (end && logDate > end) return false;

            return true;
        });
    };

    // Sorting logs
    const sortLogs = (logs, key, direction) => {
        return [...logs].sort((a, b) => {
            const aValue = key === 'product' ? a.Product?.name || '' : a[key];
            const bValue = key === 'product' ? b.Product?.name || '' : b[key];

            if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getArrow = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
    };

    const sortedLogs = sortLogs(logs, sortConfig.key, sortConfig.direction);
    const filteredLogsBySearch = filterLogsBySearchTerm(sortedLogs);
    const finalFilteredLogs = filterLogsByDate(filteredLogsBySearch);

    const totalUnits = finalFilteredLogs.reduce((total, log) => total + log.quantity, 0);
    const totalByProductType = finalFilteredLogs.reduce((acc, log) => {
        const productName = log.Product?.name || 'Unknown Product';
        acc[productName] = (acc[productName] || 0) + log.quantity;
        return acc;
    }, {});

    return (
        <div className="container mt-5">
            <h2 className="text-center">Production Log</h2>

            {/* Filters */}
            <div className="mt-5">
                <h3>Filter Logs</h3>
                <div className="form-group">
                    <label>Search by Lot Code or Product Type</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Lot Code or Product Type"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="form-group mt-3">
                    <label>Date Range</label>
                    <div className="row">
                        <div className="col">
                            <input
                                type="date"
                                className="form-control"
                                placeholder="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="col">
                            <input
                                type="date"
                                className="form-control"
                                placeholder="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Totals */}
            <div className="mt-4">
                <button
                    className="btn btn-secondary"
                    onClick={() => setTotalsVisible(!totalsVisible)}
                >
                    {totalsVisible ? 'Hide Totals' : 'Show Totals'}
                </button>
                {totalsVisible && (
                    <div className="card mt-3 p-3">
                        <h4>Total Units: {totalUnits}</h4>
                        <h5>Breakdown by Product Type:</h5>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product Type</th>
                                    <th>Total Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(totalByProductType).map(([product, quantity]) => (
                                    <tr key={product}>
                                        <td>{product}</td>
                                        <td>{quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <h3 className="mt-5">Production Logs</h3>
            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('product')}>Product {getArrow('product')}</th>
                        <th onClick={() => requestSort('quantity')}>Quantity {getArrow('quantity')}</th>
                        <th onClick={() => requestSort('Batch.lotCode')}>Lot Code {getArrow('Batch.lotCode')}</th>
                        <th onClick={() => requestSort('date_logged')}>Date Logged {getArrow('date_logged')}</th>
                    </tr>
                </thead>
                <tbody>
                    {finalFilteredLogs.map((log) => (
                        <tr
                            key={log.id}
                            onClick={() => handleRowClick(log)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>{log.Product?.name || 'Unknown Product'}</td>
                            <td>{log.quantity}</td>
                            <td>{log.Batch?.lotCode || 'N/A'}</td>
                            <td>{new Date(log.date_logged).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Ingredients Modal */}
            {isModalOpen && selectedLog && (
                <div className="modal show d-block" 
                    tabIndex="-1" 
                    role="dialog"
                    style={{ marginTop: '75px' }} // Add margin from the top of the page
                    >
                    <div className="modal-dialog" 
                        style={{
                            WebkitBoxShadow: '0px -2px 17px -1px rgba(0,0,0,0.75)',
                            MozBoxShadow: '0px -2px 17px -1px rgba(0,0,0,0.75)',
                            boxShadow: '0px -2px 17px -1px rgba(0,0,0,0.75)', // Add shadow to the modal
                        }}
                    role="document">
                        <div className="modal-content">
                            <div className="modal-header"
                                style={{
                                    backgroundColor: '#1b2638', // Set background color
                                    color: 'white', // Set text color
                                }}
                            >
                                <h5 className="modal-title">
                                    Ingredients for Lot Code: {selectedLog.Batch?.lotCode || 'N/A'}
                                </h5>
                                <button type="button" 
                                    className="btn-close" 
                                    style={{
                                        filter: 'invert(1)', // Inverts the default black close button to white
                                    }}
                                    onClick={closeModal}>
                                </button>
                            </div>
                            <div className="modal-body">
                                {ingredients.length > 0 ? (
                                    <table className="table table-bordered">
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
