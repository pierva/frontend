// src/components/complaints/ComplaintCategoriesManager.js
import React, { useEffect, useMemo, useState } from 'react';
import complaintService from '../../services/complaintService';

export default function ComplaintCategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true
  });

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true
  });

  const activeCount = useMemo(
    () => categories.filter(c => c.isActive).length,
    [categories]
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await complaintService.getCategories();
      setCategories(data || []);
    } catch (e) {
      console.error(e);
      setMsg('Error loading categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toast = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast('Category name is required.');

    try {
      await complaintService.createCategory({
        name: form.name.trim(),
        description: form.description?.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: !!form.isActive
      });
      setForm({ name: '', description: '', sortOrder: 0, isActive: true });
      toast('Category created.');
      await load();
    } catch (e) {
      console.error(e);
      toast('Error creating category.');
    }
  };

  const beginEdit = (cat) => {
    setEditId(cat.id);
    setEditForm({
      name: cat.name || '',
      description: cat.description || '',
      sortOrder: cat.sortOrder ?? 0,
      isActive: !!cat.isActive
    });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) return toast('Category name is required.');
    try {
      await complaintService.updateCategory(editId, {
        name: editForm.name.trim(),
        description: editForm.description?.trim() || null,
        sortOrder: Number(editForm.sortOrder) || 0,
        isActive: !!editForm.isActive
      });
      toast('Category updated.');
      setEditId(null);
      await load();
    } catch (e) {
      console.error(e);
      toast('Error updating category.');
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div style={{ fontWeight: 700 }}>Categories</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {categories.length} total • {activeCount} active
            </div>
          </div>
          <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {msg && <div className="alert alert-info mt-3 py-2">{msg}</div>}

        {/* Create */}
        <form onSubmit={onCreate} className="mt-3">
          <div className="mb-2">
            <label className="form-label mb-1">Name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Packaging Integrity"
              required
            />
          </div>

          <div className="mb-2">
            <label className="form-label mb-1">Description</label>
            <input
              className="form-control"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label mb-1">Sort Order</label>
              <input
                type="number"
                className="form-control"
                value={form.sortOrder}
                onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <div className="col-6 d-flex align-items-end">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  id="catActive"
                />
                <label className="form-check-label" htmlFor="catActive">
                  Active
                </label>
              </div>
            </div>
          </div>

          <button className="btn btn-primary w-100 mt-2" type="submit">
            Add Category
          </button>
        </form>

        {/* List */}
        <hr />
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ width: 70 }}>Order</th>
                <th style={{ width: 90 }}>Active</th>
                <th style={{ width: 150 }}></th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    {editId === cat.id ? (
                      <>
                        <input
                          className="form-control form-control-sm mb-1"
                          value={editForm.name}
                          onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <input
                          className="form-control form-control-sm"
                          value={editForm.description}
                          onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Description (optional)"
                        />
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600 }}>{cat.name}</div>
                        {cat.description ? (
                          <div className="text-muted" style={{ fontSize: 12 }}>{cat.description}</div>
                        ) : null}
                      </>
                    )}
                  </td>

                  <td>
                    {editId === cat.id ? (
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={editForm.sortOrder}
                        onChange={(e) => setEditForm(f => ({ ...f, sortOrder: e.target.value }))}
                      />
                    ) : (
                      <span className="text-muted">{cat.sortOrder ?? 0}</span>
                    )}
                  </td>

                  <td>
                    {editId === cat.id ? (
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                      />
                    ) : (
                      <span className={`badge ${cat.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {cat.isActive ? 'Yes' : 'No'}
                      </span>
                    )}
                  </td>

                  <td className="text-end">
                    {editId === cat.id ? (
                      <div className="btn-group">
                        <button className="btn btn-sm btn-primary" type="button" onClick={saveEdit}>
                          Save
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => beginEdit(cat)}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-muted">
                    No categories created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
