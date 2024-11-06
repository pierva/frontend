import React, { useState, useEffect } from 'react';
import logService from '../services/logService';

function ProductionLog() {
    const [products, setProducts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState('');

    // State for search, date range, and sorting
    const [sortConfig, setSortConfig] = useState({ key: 'date_logged', direction: 'ascending' });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [totalsVisible, setTotalsVisible] = useState(false);

    // Fetch products and logs
    useEffect(() => {
        const loadProductsAndLogs = async () => {
            try {
                const productsData = await logService.getProducts();
                setProducts(productsData);

                const logsData = await logService.getLogs();
                setLogs(logsData);
            } catch (error) {
                console.error('Error loading products or logs:', error);
            }
        };

        loadProductsAndLogs();
    }, []);

    // Search by Lot Code or Product Type
    const filterLogsBySearchTerm = (logs) => {
        return logs.filter((log) => {
            const search = searchTerm.toLowerCase();
            const productName = log.Product ? log.Product.name.toLowerCase() : '';
            return (
                log.lotCode.toLowerCase().includes(search) ||
                productName.includes(search)
            );
        });
    };

    // Filter by date range
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

    // Sorting function
    const sortLogs = (logs, key, direction) => {
        return [...logs].sort((a, b) => {
            const aValue = key === 'product' ? a.Product?.name || '' : a[key];
            const bValue = key === 'product' ? b.Product?.name || '' : b[key];

            if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
    };

    // Handle column header clicks to toggle sorting
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Get the sorting arrow based on the current sort direction
    const getArrow = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
    };

    // Apply search, date filter, and sorting
    const sortedLogs = sortLogs(logs, sortConfig.key, sortConfig.direction);
    const filteredLogsBySearch = filterLogsBySearchTerm(sortedLogs);
    const finalFilteredLogs = filterLogsByDate(filteredLogsBySearch);

    // Calculate totals
    const totalUnits = finalFilteredLogs.reduce((total, log) => total + log.quantity, 0);
    const totalByProductType = finalFilteredLogs.reduce((acc, log) => {
        const productName = log.Product ? log.Product.name : 'Unknown Product';
        acc[productName] = (acc[productName] || 0) + log.quantity;
        return acc;
    }, {});

    return (
        <div className="container mt-5">
            <h2 className='text-center'>Production Log</h2>

            {/* Search and Date Range Filters */}
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

            {/* Collapsible Totals Section */}
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

            {/* Production Logs Table */}
            <h3 className="mt-5">Production Logs</h3>
            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('product')}>Product {getArrow('product')}</th>
                        <th onClick={() => requestSort('quantity')}>Quantity {getArrow('quantity')}</th>
                        <th onClick={() => requestSort('lotCode')}>Lot Code {getArrow('lotCode')}</th>
                        <th onClick={() => requestSort('date_logged')}>Date Logged {getArrow('date_logged')}</th>
                    </tr>
                </thead>
                <tbody>
                    {finalFilteredLogs.map((log) => (
                        <tr key={log.id}>
                            <td>{log.Product ? log.Product.name : 'Unknown Product'}</td>
                            <td>{log.quantity}</td>
                            <td>{log.lotCode}</td>
                            <td>{new Date(log.date_logged).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ProductionLog;
