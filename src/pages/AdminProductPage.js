import React, { useState, useEffect } from 'react';
import productService from '../services/productService';

function AdminProductPage() {
  const [productName, setProductName] = useState('');
  const [companyName, setCompanyName] = useState(''); // New state for company
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [editProductId, setEditProductId] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState(''); // New state for editing company

  // Load all products
  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
      
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Load products when component mounts
  useEffect(() => {
    loadProducts();
  }, []);

  // Handle creating a new product
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct(productName, companyName); // Include company
      setMessage('Product created successfully!');
      setProductName('');
      setCompanyName(''); // Clear company field
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error creating product:', error);
      setMessage('Error creating product.');
    }
  };

  // Handle starting edit mode
  const startEdit = (product) => {
    setEditProductId(product.id);
    setEditProductName(product.name);
    setEditCompanyName(product.company); // Set the company name for editing
  };

  // Handle saving the updated product
  const saveEdit = async () => {
    try {
      await productService.updateProduct(editProductId, editProductName, editCompanyName); // Include company
      setMessage('Product updated successfully!');
      setEditProductId(null);
      loadProducts(); // Reload products
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
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            className="form-control"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
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
            <th>Company</th> 
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>
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
                {editProductId === product.id ? (
                  <input
                    type="text"
                    className="form-control"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                  />
                ) : (
                  product.company
                )}
              </td>
              <td>
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
