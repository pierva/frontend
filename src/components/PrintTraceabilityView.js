import React from 'react';
import logo from '../media/logo_text_blue.png'; // Ensure this is the correct path to your logo

function PrintTraceabilityView({ logs }) {
    const printDate = new Date().toLocaleDateString();

    return (
        <div className="print-area">
            {/* Print Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 text-header-font">
                {/* Left side text */}
                <div className="text-left">
                    <p style={{ marginBottom: '0' }}>SOP-R-PS Pre-Shipment Review</p>
                    <p style={{ marginBottom: '0' }}>REV 1: MAY 2024</p>
                </div>

                {/* Center logo */}
                <div className="text-center">
                    <img 
                        src={logo} 
                        alt="Company Logo" 
                        style={{ width: '200px' }} 
                    />
                </div>

                {/* Right side text */}
                <div className="text-right" style={{ textAlign: 'right' }}>
                    <p style={{ marginBottom: '0' }}>PIZZACINI Corp.</p>
                    <p style={{ marginBottom: '0' }}>2737 NW 21st St. Miami, FL 33142</p>
                </div>
            </div>

            {/* Print Date */}
            <p className="text-center">Print Date: {printDate}</p>

            {/* Display logs for print */}
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
                            font-size: 10px;
                            color: #606060;
                        }
                    }
                `}
            </style>
        </div>
    );
}

export default PrintTraceabilityView;
