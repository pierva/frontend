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
  const [ingredients, setIngredients] = useState([]);

  // For editing/creating products
  const [editProductId, setEditProductId] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]); // array of ingredient IDs

  // For Ingredients Management (creation/editing)
  const [ingredientName, setIngredientName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [editIngredient, setEditIngredient] = useState(null);

  // NEW: State to control display of the edit modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Load products, companies, and ingredients when component mounts
  useEffect(() => {
    loadProducts();
    loadCompanies();
    loadIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // NEW: When submitting a new product, send the recipe (selectedIngredients)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct(productName, editCompanyName, selectedIngredients);
      showAlert('Product created successfully!', 'success');
      setProductName('');
      setEditCompanyName('');
      setSelectedIngredients([]); // reset recipe selection
      loadProducts();
    } catch (error) {
      showAlert('Error creating product.', 'danger');
    }
  };

  // Modified startEdit: Opens the edit modal and loads product info and recipe
  const startEdit = (product) => {
    setEditProductId(product.id);
    setEditProductName(product.name);
    // Assuming product.company (or product.Company.id) holds the company info:
    setEditCompanyName(product.Company ? product.Company.id : '');
    // Load the product's current recipe from the backend
    productService.getProductRecipe(product.id)
      .then(recipe => {
        // recipe is expected to be an array of ingredient IDs
        setSelectedIngredients(recipe);
      })
      .catch(err => console.error('Error loading product recipe', err));
    setShowEditModal(true);
  };

  // Modified saveEdit: Updates product info and recipe, then closes the modal
  const saveEdit = async () => {
    try {
      await productService.updateProduct(editProductId, editProductName, editCompanyName, selectedIngredients);
      showAlert('Product updated successfully!', 'success');
      setEditProductId(null);
      setSelectedIngredients([]);
      setShowEditModal(false);
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

  const showAlert = (msg, type) => {
    setMessage(msg);
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

      {/* Product Form (for creating new products) */}
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
        {/* Recipe selection */}
        <div className="form-group mt-3">
          <label>Recipe (Select Ingredients)</label>
          <select
            multiple
            className="form-select"
            value={selectedIngredients}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedIngredients(values);
            }}
          >
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name} ({ingredient.manufacturer})
              </option>
            ))}
          </select>
          <small className="form-text text-muted">
            Hold down the Ctrl (Windows) or Command (Mac) button to select multiple ingredients.
          </small>
        </div>
        <button type="submit" className="btn btn-primary mt-3">
          Create Product
        </button>
      </form>

      {/* Ingredient Form */}
      <h2 className="mt-5">Create New Ingredient</h2>
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
            type="button"
            className="btn btn-secondary"
            data-bs-toggle="modal"
            data-bs-target="#ingredientsModal"
          >
            Show Ingredients
          </button>
        </div>
      </form>

      {/* Ingredients Modal */}
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
              <td>{product.name}</td>
              <td>{product.Company ? product.Company.name : product.companyId}</td>
              <td>
                <button className="btn btn-primary" onClick={() => startEdit(product)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Product Edit Modal */}
      {showEditModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Product</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editProductName}
                      onChange={(e) => setEditProductName(e.target.value)}
                    />
                  </div>
                  <div className="form-group mt-3">
                    <label>Company</label>
                    <select
                      className="form-select"
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group mt-3">
                    <label>Recipe (Select Ingredients)</label>
                    <select
                      multiple
                      className="form-select"
                      value={selectedIngredients}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedIngredients(values);
                      }}
                    >
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} ({ingredient.manufacturer})
                        </option>
                      ))}
                    </select>
                    <small className="form-text text-muted">
                      Hold down the Ctrl (Windows) or Command (Mac) button to select multiple ingredients.
                    </small>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={saveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductPage;
