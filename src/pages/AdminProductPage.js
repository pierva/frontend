import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import companyService from '../services/companyService'; // Import service for managing companies

function AdminProductPage() {
  const [productName, setProductName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]); // State to store companies
  const [editProductId, setEditProductId] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');

  // Load products and companies when component mounts
  useEffect(() => {
    loadProducts();
    loadCompanies();
  }, []);

  // Load all products
  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Load all companies
  const loadCompanies = async () => {
    try {
      const companiesData = await companyService.getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  // Handle creating a new company
  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      await companyService.createCompany(companyName);
      setMessage('Company created successfully!');
      setCompanyName('');
      loadCompanies(); // Reload companies
    } catch (error) {
      console.error('Error creating company:', error);
      setMessage('Error creating company.');
    }
  };

  // Handle creating a new product
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct(productName, editCompanyName);
      setMessage('Product created successfully!');
      setProductName('');
      setEditCompanyName('');
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
    setEditCompanyName(product.company);
  };

  // Handle saving the updated product
  const saveEdit = async () => {
    try {
      await productService.updateProduct(editProductId, editProductName, editCompanyName);
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
      <h2>Create New Company</h2>
      <form onSubmit={handleCompanySubmit} className="mb-5">
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
          Create Company
        </button>
      </form>

      <h2>Create New Product</h2>
      <form onSubmit={handleProductSubmit}>
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
          <label>Company</label>
          <select
            className="form-select"
            value={editCompanyName}
            onChange={(e) => setEditCompanyName(e.target.value)}
            required
          >
            <option value="">Select Company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
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
                  <select
                    className="form-select"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  product.companyId
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
