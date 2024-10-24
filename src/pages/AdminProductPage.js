import React, { useState, useEffect } from 'react';
import productService from '../services/productService'; // Use this service for interacting with the backend

function AdminProductPage() {
  const [productName, setProductName] = useState('');
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]); // State for storing products
  const [editProductId, setEditProductId] = useState(null); // Track the product being edited
  const [editProductName, setEditProductName] = useState(''); // Track the new name for the product

  // Function to load all products from the backend
  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData); // Set the products in state
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Load products when the component mounts
  useEffect(() => {
    loadProducts();
  }, []);

  // Handle creating a new product
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct(productName); // Send product creation request
      setMessage('Product created successfully!');
      setProductName(''); // Clear the input field
      loadProducts(); // Reload the product list
    } catch (error) {
      console.error('Error creating product:', error);
      setMessage('Error creating product.');
    }
  };

  // Handle starting product editing
  const startEdit = (product) => {
    setEditProductId(product.id);
    setEditProductName(product.name);
  };

  // Handle saving the updated product name
  const saveEdit = async () => {
    try {
      await productService.updateProduct(editProductId, editProductName); // Send update request
      setMessage('Product updated successfully!');
      setEditProductId(null); // Clear edit mode
      loadProducts(); // Reload the product list
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage('Error updating product.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Create New Product</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name</label>
          <input
            type="text"
            className="form-control"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary mt-3">
          Create Product
        </button>
      </form>
      {message && <div className="mt-3 alert alert-info">{message}</div>}

      <h3 className="mt-5">Available Products</h3>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>
                {/* If editing this product, show input field */}
                {editProductId === product.id ? (
                  <input
                    type="text"
                    className="form-control"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                  />
                ) : (
                  product.name
                )}
              </td>
              <td>
                {/* Edit and Save buttons */}
                {editProductId === product.id ? (
                  <button className="btn btn-success" onClick={saveEdit}>
                    Save
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => startEdit(product)}>
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminProductPage;
