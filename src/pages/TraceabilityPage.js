import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import PrintTraceabilityView from '../components/PrintTraceabilityView';
import moment from 'moment';
// Use ReactDOM to render the component into the new window
import { createRoot } from 'react-dom/client'; // Import this at the top of the file if not already done
const API_URL = process.env.REACT_APP_API_URL;

function TraceabilityPage() {
    const [products, setProducts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [lotCode, setLotCode] = useState('');
    const [suggestedLotCodes, setSuggestedLotCodes] = useState([]);
    const [quantity, setQuantity] = useState('');
    const [customer, setCustomer] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); // New state for message type
    const [userRole, setUserRole] = useState('');
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [searchLotCode, setSearchLotCode] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editLogId, setEditLogId] = useState(null);
    // Search by ingredient lotCode
    const [ingredientLotCode, setIngredientLotCode] = useState('');
    const [ingredientProducts, setIngredientProducts] = useState([]);
    const [ingredientBreakdown, setIngredientBreakdown] = useState([]);
    const [isIngredientSearchActive, setIsIngredientSearchActive] = useState(false);


    const printRef = useRef();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                setUserRole(decodedToken.role);

                const productsResponse = await axios.get(`${API_URL}/api/products`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProducts(productsResponse.data);

                const logsResponse = await axios.get(`${API_URL}/api/traceability-logs`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLogs(logsResponse.data);
            } catch (error) {
                setMessage('Error fetching initial data:', error);
                setMessageType('danger');
                console.error('Error fetching initial data:', error);
            }
        };

        fetchInitialData();
    }, []);

    const handleLotCodeInputChange = async (e) => {
        const input = e.target.value;
        setLotCode(input);
    
        if (input.length > 2) {
            try {
                const token = localStorage.getItem('token');
                const params = { query: input };
                
                
                // Include productId if selected
                if (selectedProduct) {
                    params.productId = selectedProduct;
                }
                const response = await axios.get(`${API_URL}/api/traceability-logs/search-lot-codes`, {
                    params,
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSuggestedLotCodes(response.data);
            } catch (error) {
                console.error('Error fetching lot code suggestions:', error);
            }
        } else {
            setSuggestedLotCodes([]);
        }
    };
    

    const handleSelectLotCode = (code) => {
        setLotCode(code);
        setSuggestedLotCodes([]);
    };

    const handleSearchByLotCode = (e) => {
        const input = e.target.value;
        setSearchLotCode(input);

        if (input.length > 0) {
            const filtered = logs.filter((log) => log.lotCode.toLowerCase().includes(input.toLowerCase()));
            setFilteredLogs(filtered);
        } else {
            setFilteredLogs([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const newLog = {
                date: selectedDate,
                productId: selectedProduct,
                lotCode,
                quantity,
                customer,
            };

            if (isEditing) {
                await axios.put(`${API_URL}/api/traceability-logs/${editLogId}`, newLog, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessage('Traceability record updated successfully');
                setMessageType('success');
            } else {
                await axios.post(`${API_URL}/api/traceability-logs`, newLog, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessage('Traceability record added successfully');
                setMessageType('success');
            }

            autoDismissMessage();
            setIsEditing(false);
            setEditLogId(null);
            resetFormFields();

            const updatedLogs = await axios.get(`${API_URL}/api/traceability-logs`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLogs(updatedLogs.data);
        } catch (error) {
            console.error('Error adding/updating traceability record:', error);
            setMessage('Error adding/updating traceability record');
            setMessageType('danger');
            autoDismissMessage();
        }
    };

    // Search products by ingredient lot code
    const handleSearchIngredientLotCode = async () => {
        if (!ingredientLotCode) {
            setMessage('Please enter an ingredient lot code');
            setMessageType('danger');
            autoDismissMessage();
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/traceability-logs/ingredient-lot-code`,
                {
                    params: { ingredientLotCode },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Format the response data
            const data = response.data;

            // Breakdown for products
            const breakdown = data.map((item) => ({
                productName: item.productName,
                batchLotCode: item.batchLotCode,
                quantityProduced: item.quantityProduced,
                quantityAllocated: item.quantityAllocated,
                quantityInInventory: item.quantityInInventory,
            }));

            // Flatten client data for detailed view
            const clients = data.flatMap((item) =>
                item.clients.map((client) => ({
                    customer: client.customer,
                    productName: item.productName,
                    batchLotCode: item.batchLotCode,
                    quantity: client.quantity,
                    date: client.date
                }))
            );

            setIngredientBreakdown(breakdown);
            setIngredientProducts(clients);
            setIsIngredientSearchActive(true); // Activate ingredient search state
        } catch (error) {
            console.error('Error searching by ingredient lot code:', error);

            if (error.response) {
                // Check if the error has a response from the API
                if (error.response.status === 404) {
                    // Display the error message from the API for 404
                    setMessage(error.response.data.message || 'No data found for the given ingredient lot code.');
                } else {
                    // Generic error message for other HTTP errors
                    setMessage('An error occurred: ' + (error.response.data.message || 'Please try again later.'));
                }
            } else {
                // Fallback for network or unexpected errors
                setMessage('Unable to fetch data. Please check your internet connection.');
            }

            setMessageType('danger');
            autoDismissMessage();
        }
    };

    const clearIngredientSearch = () => {
        setIngredientLotCode('');
        setIngredientProducts([]);
        setIsIngredientSearchActive(false); // Reset ingredient search state
    };

    const autoDismissMessage = () => {
        setTimeout(() => setMessage(''), 3000);
    };

    const resetFormFields = () => {
        setSelectedDate('');
        setSelectedProduct('');
        setLotCode('');
        setQuantity('');
        setCustomer('');
    };

    const handleEdit = (log) => {
        setSelectedDate(new Date(log.date).toISOString().split('T')[0]);
        setSelectedProduct(log.productId);
        setLotCode(log.lotCode);
        setQuantity(log.quantity);
        setCustomer(log.customer);
        setEditLogId(log.id);
        setIsEditing(true);
    };
    
    const handlePrint = () => {
        // Create a new window
        const printWindow = window.open('', '_blank');

        // Dynamically create the HTML content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Traceability Logs</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    h1 {
                        text-align: center;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f4f4f4;
                    }
                </style>
            </head>
            <body>
                <div id="print-content"></div>
            </body>
            </html>
        `;

        // Write the initial HTML into the new window
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Inject the rendered content of PrintTraceabilityView into the new window
        const container = printWindow.document.getElementById('print-content');
        const renderedContent = <PrintTraceabilityView
            logs={filteredLogs.length > 0 ? filteredLogs : logs}
            ingredientBreakdown={ingredientBreakdown}
            ingredientProducts={ingredientProducts}
            isIngredientSearchActive={isIngredientSearchActive}
            ingredientLotCode={ingredientLotCode}
        />;

        const root = createRoot(container);
        root.render(renderedContent);

        // Trigger the print dialog after rendering
        setTimeout(() => {
            printWindow.print();
        }, 500); // Delay to ensure the content is rendered before printing
    };


    return (
        <div className="container mt-5">
            {message && (
                <div className="fixed-top mt-5 d-flex justify-content-center">
                    <div className={`alert alert-${messageType} alert-dismissible fade show w-50`} role="alert">
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                </div>
            )}


            <h2>Traceability Page</h2>

            {/* Print button */}
            {logs.length > 0 && (
                <button className="btn btn-secondary mt-3" onClick={handlePrint}>
                    Print View
                </button>
            )}

            {/* Search by Lot Code */}
            <div className="mb-3">
                <label>Search by Lot Code</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Lot Code to search"
                    onChange={handleSearchByLotCode}
                    value={searchLotCode}
                />
            </div>

            {/* Form to add/edit a traceability record */}
            {(userRole !== 'client' || userRole === 'client') && (
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="row">
                        <div className="col-md-4 col-12">
                            <label>Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-4 col-12">
                            <label>Product</label>
                            <select
                                className="form-control"
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                required
                            >
                                <option value="">Select a product</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4 col-12 position-relative">
                            <label>Lot Code</label>
                            <input
                                type="text"
                                className="form-control"
                                value={lotCode}
                                onChange={handleLotCodeInputChange}
                                placeholder="Enter or select a lot code"
                                required
                            />
                            {suggestedLotCodes.length > 0 && (
                                <ul
                                    className="list-group mt-2 position-absolute w-100"
                                    style={{
                                        maxHeight: '150px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                    }}
                                >
                                    {suggestedLotCodes.map((code, index) => (
                                        <li
                                            key={index}
                                            className="list-group-item"
                                            onClick={() => handleSelectLotCode(code)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {code}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="row mt-3">
                        <div className="col-md-4 col-12">
                            <label>Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-8 col-12">
                            <label>Customer</label>
                            <input
                                type="text"
                                className="form-control"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary mt-3 w-100">
                        {isEditing ? 'Update Record' : 'Add Record'}
                    </button>
                </form>
            )}

            {/* Ingredient Lot Code Search */}
            <div className="mb-4">
                <h4>Search Products by Ingredient Lot Code</h4>
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Ingredient Lot Code"
                        value={ingredientLotCode}
                        onChange={(e) => setIngredientLotCode(e.target.value)}
                    />
                    <button
                        className={`btn ${isIngredientSearchActive ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={isIngredientSearchActive ? clearIngredientSearch : handleSearchIngredientLotCode}
                    >
                        {isIngredientSearchActive ? 'Clear Search' : 'Search'}
                    </button>
                </div>

            </div>

            {/* Display Results */}
            {isIngredientSearchActive && ingredientBreakdown.length > 0 && (
                <div className="mt-4">
                    <h4>Products Breakdown with ingredient LOT: <b>{ingredientLotCode}</b></h4>
                    <table className="table table-bordered table-responsive-sm">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Batch Lot Code</th>
                                <th>Quantity Produced</th>
                                <th>Quantity Allocated</th>
                                <th>Quantity in Inventory</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingredientBreakdown.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.productName}</td>
                                    <td>{item.batchLotCode}</td>
                                    <td>{item.quantityProduced}</td>
                                    <td>{item.quantityAllocated}</td>
                                    <td>{item.quantityInInventory}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {ingredientProducts.length > 0 && (
                <div className="mt-4">
                    <h4>Products Distributed to Clients</h4>
                    <table className="table table-bordered table-responsive-sm">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Batch Lot Code</th>
                                <th>Quantity</th>
                                <th>Date</th> {/* Add Date column */}
                            </tr>
                        </thead>
                        <tbody>
                            {ingredientProducts.map((client, index) => (
                                <tr key={index}>
                                    <td>{client.customer}</td>
                                    <td>{client.productName}</td>
                                    <td>{client.batchLotCode}</td>
                                    <td>{client.quantity}</td>

                                    <td>{moment.utc(client.date).format('MM/DD/YYYY')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}



            {/* Conditionally Render Traceability Table */}
            {!isIngredientSearchActive && (
                <div>
                    <h3 className='mt-3'>Traceability Table</h3>
                    <table className="table table-bordered table-responsive-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Lot Code</th>
                                <th>Quantity</th>
                                <th>Customer</th>
                                {/* Add a class to conditionally hide this column on small screens */}
                                <th className="d-none d-md-table-cell">Logged By</th>
                                {userRole === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {(filteredLogs.length > 0 ? filteredLogs : logs).map((log) => (
                                <tr key={log.id}>

                                    <td>{moment.utc(log.date).format('MM/DD/YYYY')}</td>
                                    <td>{log.Product?.name || 'N/A'}</td>
                                    <td>{log.lotCode}</td>
                                    <td>{log.quantity}</td>
                                    <td>{log.customer}</td>
                                    {/* Hide this cell on small screens */}
                                    <td className="d-none d-md-table-cell">{log.logged_by || 'Unknown'}</td>
                                    {userRole === 'admin' && (
                                        <td>
                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={() => handleEdit(log)}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            )}

            {/* Hidden print section */}
            <div ref={printRef} style={{ display: 'none' }}>
                {/* <PrintTraceabilityView logs={filteredLogs.length > 0 ? filteredLogs : logs} /> */}
            </div>
        </div>
    );
}

export default TraceabilityPage;
