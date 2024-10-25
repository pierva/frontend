import React, { useState, useEffect } from 'react';
import logService from '../services/logService';

function ProductionLog() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [lotCode, setLotCode] = useState('');
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState('');

    // Sort state
    const [sortConfig, setSortConfig] = useState({ key: 'date_logged', direction: 'ascending' });

    // Date range filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Search term for filtering by Lot Code or Product Type
    const [searchTerm, setSearchTerm] = useState('');

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

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct || !quantity || !lotCode) {
            setMessage('Please fill out all fields.');
            return;
        }

        try {
            await logService.addLog({
                product: selectedProduct,
                quantity,
                lotCode,
            });

            setMessage(`Production log submitted for ${selectedProduct} (Lot Code: ${lotCode}, Quantity: ${quantity})`);

            // Reload logs after adding a new log
            const logsData = await logService.getLogs();
            setLogs(logsData);

            setSelectedProduct('');
            setQuantity('');
            setLotCode('');
        } catch (error) {
            console.error('Error submitting production log:', error);
            setMessage('Error submitting production log.');
        }
    };

    // Sorting function
    const sortLogs = (logs, key, direction) => {
        return [...logs].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'ascending' ? 1 : -1;
            }
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
        return ''; // No arrow for unsorted columns
    };

    // Filter logs by search term (Lot Code or Product Type)
    const filterLogsBySearchTerm = (logs) => {
        return logs.filter((log) => {
            const search = searchTerm.toLowerCase();
            return (
                log.lotCode.toLowerCase().includes(search) ||
                log.product.toLowerCase().includes(search)
            );
        });
    };

    // Filter logs by the selected date range
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

    // Get the sorted and filtered logs
    const sortedLogs = sortLogs(logs, sortConfig.key, sortConfig.direction);
    const filteredLogsBySearch = filterLogsBySearchTerm(sortedLogs); // Apply search filter
    const finalFilteredLogs = filterLogsByDate(filteredLogsBySearch); // Apply date filter

    return (
        <div className="container mt-5">
            <h2 className='text-center'>Production Log</h2>

            {/* Search filter for Lot Code or Product Type */}
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

                {/* Date range filter */}
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

            {/* Display the list of production logs */}
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
                            <td>{log.product}</td>
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
