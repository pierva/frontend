import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap

const API_URL = process.env.REACT_APP_API_URL;

function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchInventoryData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/inventory`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setInventory(response.data);
            } catch (error) {
                console.error('Error fetching inventory data:', error);
            }
        };

        fetchInventoryData();
    }, []);

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setModalVisible(true);
    };

    return (
        <div className="container mt-5">
            <h2>Inventory Page</h2>
            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Total Produced</th>
                        <th>Total Sold</th>
                        <th>Available Inventory</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.map((product) => (
                        <tr key={product.name} onClick={() => handleProductClick(product)} style={{ cursor: 'pointer' }}>
                            <td>{product.name}</td>
                            <td>{product.totalProduced}</td>
                            <td>{product.totalSold}</td>
                            <td>{product.totalProduced - product.totalSold}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedProduct && (
                <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Lot Details for {selectedProduct.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Lot Code</th>
                                    <th>Quantity Available</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(selectedProduct.lotDetails).map(([lotCode, quantity], index) => (
                                    <tr key={index}>
                                        <td>{lotCode}</td>
                                        <td>{quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setModalVisible(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
}

export default InventoryPage;
