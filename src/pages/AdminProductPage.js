import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import companyService from '../services/companyService';
import ingredientService from '../services/ingredientService';

function AdminProductPage() {
  const [productName, setProductName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [editProductId, setEditProductId] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');

  // For Ingredients Management
  const [ingredientName, setIngredientName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [editIngredient, setEditIngredient] = useState(null);

  // Load products, companies, and ingredients when component mounts
  useEffect(() => {
    loadProducts();
    loadCompanies();
    loadIngredients();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      showAlert('Error loading products.', 'danger');
    }
  };

  const loadCompanies = async () => {
    try {
      const companiesData = await companyService.getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      showAlert('Error loading companies.', 'danger');
    }
  };

  const loadIngredients = async () => {
    try {
      const ingredientsData = await ingredientService.getIngredients();
      setIngredients(ingredientsData);
    } catch (error) {
      showAlert('Error loading ingredients.', 'danger');
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      await companyService.createCompany(companyName);
      showAlert('Company created successfully!', 'success');
      setCompanyName('');
      loadCompanies();
    } catch (error) {
      showAlert('Error creating company.', 'danger');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct(productName, editCompanyName);
      showAlert('Product created successfully!', 'success');
      setProductName('');
      setEditCompanyName('');
      loadProducts();
    } catch (error) {
      showAlert('Error creating product.', 'danger');
    }
  };

  const startEdit = (product) => {
    setEditProductId(product.id);
    setEditProductName(product.name);
    setEditCompanyName(product.company);
  };

  const saveEdit = async () => {
    try {
      await productService.updateProduct(editProductId, editProductName, editCompanyName);
      showAlert('Product updated successfully!', 'success');
      setEditProductId(null);
      loadProducts();
    } catch (error) {
      showAlert('Error updating product.', 'danger');
    }
  };

  const handleIngredientSubmit = async (e) => {
    e.preventDefault();
    try {
      await ingredientService.createIngredient({ name: ingredientName, manufacturer });
      showAlert('Ingredient created successfully!', 'success');
      setIngredientName('');
      setManufacturer('');
      loadIngredients();
    } catch (error) {
      showAlert('Error creating ingredient.', 'danger');
    }
  };

  const handleIngredientUpdate = async (id) => {
    try {
      await ingredientService.updateIngredient(id, { name: editIngredient.name, manufacturer: editIngredient.manufacturer });
      showAlert('Ingredient updated successfully!', 'success');
      setEditIngredient(null);
      loadIngredients();
    } catch (error) {
      showAlert('Error updating ingredient.', 'danger');
    }
  };

  const showAlert = (message, type) => {
    setMessage(message);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  return (
    <div className="container mt-5">
      {message && (
        <div
          className={`alert alert-${messageType} alert-dismissible fade show fixed-top w-50 mx-auto mt-3`}
          role="alert"
          style={{ zIndex: 1050 }}
        >
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Company Form */}
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

      {/* Product Form */}
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

    {/* Ingredient Form */}
    <h2 className='mt-5'>Create New Ingredient</h2>
    <form onSubmit={handleIngredientSubmit} className="mb-1">
      <div className="form-group row">
        <div className="col-md-6">
          <label>Ingredient Name</label>
          <input
            type="text"
            className="form-control"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label>Manufacturer</label>
          <input
            type="text"
            className="form-control"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="d-flex align-items-center mt-3">
        <button type="submit" className="btn btn-primary me-2">
          Create Ingredient
        </button>
        <button
          type="button" // Prevent form submission
          className="btn btn-secondary"
          data-bs-toggle="modal"
          data-bs-target="#ingredientsModal"
        >
          Show Ingredients
        </button>
      </div>
    </form>


      <div className="modal fade" id="ingredientsModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Ingredients</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Manufacturer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id}>
                      <td>
                        {editIngredient?.id === ingredient.id ? (
                          <input
                            type="text"
                            value={editIngredient.name}
                            onChange={(e) => setEditIngredient({ ...editIngredient, name: e.target.value })}
                            className="form-control"
                          />
                        ) : (
                          ingredient.name
                        )}
                      </td>
                      <td>
                        {editIngredient?.id === ingredient.id ? (
                          <input
                            type="text"
                            value={editIngredient.manufacturer}
                            onChange={(e) => setEditIngredient({ ...editIngredient, manufacturer: e.target.value })}
                            className="form-control"
                          />
                        ) : (
                          ingredient.manufacturer
                        )}
                      </td>
                      <td>
                        {editIngredient?.id === ingredient.id ? (
                          <button className="btn btn-success" onClick={() => handleIngredientUpdate(ingredient.id)}>
                            Save
                          </button>
                        ) : (
                          <button className="btn btn-primary" onClick={() => setEditIngredient(ingredient)}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
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
