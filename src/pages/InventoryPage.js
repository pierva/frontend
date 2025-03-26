import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

const API_URL = process.env.REACT_APP_API_URL;

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // New state for inline editing of a lot's quantity
  const [editingLot, setEditingLot] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState('');

  const fetchInventoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
    setEditingLot(null);
    setEditingQuantity('');
  };

  const handleAdjustClick = (lotCode, currentQuantity) => {
    setEditingLot(lotCode);
    setEditingQuantity(currentQuantity);
  };

  const handleCancelAdjustment = () => {
    setEditingLot(null);
    setEditingQuantity('');
  };

  const handleSaveAdjustment = async (lotCode) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/inventory/adjust`,
        { productId: selectedProduct.id, lotCode, newQuantity: editingQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh inventory and update selectedProduct in the modal
      const updatedInventory = await fetchInventoryData();
      if (updatedInventory) {
        const updatedProduct = updatedInventory.find(
          (prod) => prod.id === selectedProduct.id
        );
        setSelectedProduct(updatedProduct);
      }

      setEditingLot(null);
      setEditingQuantity('');
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  // Helper to compute total available from lotDetails object
  const computeAvailable = (lotDetails) => {
    return Object.values(lotDetails).reduce((acc, curr) => acc + Number(curr), 0);
  };

  return (
    <div className="container mt-5">
      <h2>Inventory Page</h2>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Product</th>
            <th>Available Inventory</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((product) => (
            <tr
              key={product.id || product.name}
              onClick={() => handleProductClick(product)}
              style={{ cursor: 'pointer' }}
            >
              <td>{product.name}</td>
              <td>{computeAvailable(product.lotDetails)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedProduct && (
        <Modal show={modalVisible} onHide={() => setModalVisible(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Lot Details for {selectedProduct.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <table className="table">
              <thead>
                <tr>
                  <th>Lot Code</th>
                  <th>Quantity Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(selectedProduct.lotDetails)
                  .filter(([lot, quantity]) => Number(quantity) > 0)
                  .map(([lotCode, quantity], index) => (
                    <tr key={index}>
                      <td>{lotCode}</td>
                      <td>
                        {editingLot === lotCode ? (
                          <Form.Control
                            type="number"
                            value={editingQuantity}
                            onChange={(e) => setEditingQuantity(e.target.value)}
                          />
                        ) : (
                          quantity
                        )}
                      </td>
                      <td>
                        {editingLot === lotCode ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleSaveAdjustment(lotCode)}
                              className="me-2"
                            >
                              Save
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleCancelAdjustment}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAdjustClick(lotCode, quantity)}
                          >
                            Adjust
                          </Button>
                        )}
                      </td>
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
