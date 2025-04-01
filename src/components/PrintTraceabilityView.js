import React from 'react';
import logo from '../media/Pizzacini/logo_text_blue.png'; 
const logoUrl = process.env.REACT_APP_LOGO_PRINT_URL || logo;

function PrintTraceabilityView({ logs, ingredientBreakdown, ingredientProducts, isIngredientSearchActive, ingredientLotCode }) {
    const printDate = new Date().toLocaleDateString();

    return (
        <div className="print-area">
            {/* Print Header */}
            <div 
                className="d-flex justify-content-between align-items-center mb-3 text-header-font header-wrapper"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                }}
            >
                {/* Left side text */}
                <div style={{ flex: 1, paddingRight: '10px', minWidth: '150px' }}>
                    <p style={{ marginBottom: '0', whiteSpace: 'nowrap' }}>SOP-R-PS Pre-Shipment Review</p>
                    <p style={{ marginBottom: '0', whiteSpace: 'nowrap' }}>REV 1: MAY 2024</p>
                </div>

                {/* Center logo */}
                <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
                    <img 
                        src={logoUrl} 
                        alt="Company Logo" 
                        style={{ maxWidth: '250px', maxHeight: '70px', objectFit: 'contain' }}
                    />
                </div>

                {/* Right side text */}
                <div 
                    style={{ 
                        flex: 1, 
                        paddingLeft: '10px', 
                        minWidth: '150px', 
                        textAlign: 'right', 
                        whiteSpace: 'nowrap' 
                    }}
                >
                    <p style={{ marginBottom: '0', whiteSpace: 'nowrap' }}>PIZZACINI Corp.</p>
                    <p style={{ marginBottom: '0', whiteSpace: 'nowrap' }}>2737 NW 21st St. Miami, FL 33142</p>
                </div>
            </div>

            {/* Print Date */}
            <p className="text-center">Print Date: {printDate}</p>

            {isIngredientSearchActive ? (
                <>
                    {/* Ingredient Breakdown */}
                    {ingredientBreakdown.length > 0 && (
                        <div className="mt-4">
                            <h4>Products Breakdown with ingredient LOT: <b>{ingredientLotCode}</b></h4>
                            <table className="table table-bordered">
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

                    {/* Ingredient Products */}
                    {ingredientProducts.length > 0 && (
                        <div className="mt-4">
                            <h4>Products Distributed to Clients</h4>
                            <table className="table table-bordered">
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
                                            <td>{new Date(client.date).toLocaleDateString()}</td> {/* Format Date */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Default Traceability Logs */}
                    <table className="table table-bordered mt-3">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>Lot Code</th>
                                <th>Quantity</th>
                                <th>Customer</th>
                                <th>Logged By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => (
                                <tr key={index}>
                                    <td>{new Date(log.date).toLocaleDateString()}</td>
                                    <td>{log.Product?.name || 'N/A'}</td>
                                    <td>{log.lotCode}</td>
                                    <td>{log.quantity}</td>
                                    <td>{log.customer}</td>
                                    <td>{log.logged_by || 'Unknown'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print-area, .print-area * {
                            visibility: visible;
                        }
                        .print-area {
                            width: 100%;
                            padding: 20px;
                        }

                        .text-header-font {
                            font-size: 12px;
                            color: #606060;
                        }

                        .header-wrapper {
                            page-break-inside: avoid;
                        }
                    }
                `}
            </style>
        </div>
    );
}



export default PrintTraceabilityView;
