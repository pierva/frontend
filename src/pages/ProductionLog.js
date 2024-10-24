import React, { useState, useEffect } from 'react';
import logService from '../services/logService';

function ProductionLog() {
    const [logs, setLogs] = useState([]);
    const [products, setProducts] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false); // We'll use this to check if the user is an admin

    // Form states for adding logs
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [lotCode, setLotCode] = useState('');

    // Load logs and products on page load
    useEffect(() => {
        const fetchData = async () => {
            try {
                const logsData = await logService.getLogs();
                setLogs(logsData);

                const productsData = await logService.getProducts();
                setProducts(productsData);

                const role = await logService.getUserRole();
                setIsAdmin(role === 'admin');
            } catch (error) {
                console.error('Error fetching logs or products:', error);
            }
        };

        fetchData();
    }, []);

    const handleAddLog = async (e) => {
        e.preventDefault();
        try {
            await logService.addLog({ productId, quantity, lot_code: lotCode });
            setQuantity('');
            setLotCode('');
            alert('Production log added successfully');
        } catch (error) {
            console.error('Error adding production log:', error);
        }
    };

    // Inside the component, before the return statement
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterLotCode, setFilterLotCode] = useState('');

    const handleFilter = async () => {
        try {
            const filteredLogs = await logService.filterLogs({ startDate, endDate, lot_code: filterLotCode });
            setLogs(filteredLogs);
        } catch (error) {
            console.error('Error filtering logs:', error);
        }
    };


    return (
        <div className="container">
            <h2>Production Logs</h2>

            {/* Form to add new production log (only shown to factory team) */}
            {!isAdmin && (
                <div className="mt-4">
                    <h3>Add New Log</h3>
                    <form onSubmit={handleAddLog}>
                        <div className="form-group">
                            <label>Product</label>
                            <select
                                className="form-control"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            >
                                <option value="">Select Product</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group mt-3">
                            <label>Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>

                        <div className="form-group mt-3">
                            <label>Lot Code</label>
                            <input
                                type="text"
                                className="form-control"
                                value={lotCode}
                                onChange={(e) => setLotCode(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary mt-3">
                            Add Log
                        </button>
                    </form>
                </div>
            )}

            {/* Display logs for admin */}
            {isAdmin && (
                <div className="mt-4">
                    <h3>All Production Logs</h3>
                    <table className="table table-striped mt-3">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Lot Code</th>
                                <th>User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.date_logged).toLocaleString()}</td>
                                    <td>{log.Product.name}</td>
                                    <td>{log.quantity}</td>
                                    <td>{log.lot_code}</td>
                                    <td>{log.User.username}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4">
                        <h4>Filter Logs</h4>
                        <div className="row">
                            <div className="col-md-4">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4">
                                <label>Lot Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={filterLotCode}
                                    onChange={(e) => setFilterLotCode(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className="btn btn-primary mt-3" onClick={handleFilter}>
                            Filter Logs
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductionLog;
