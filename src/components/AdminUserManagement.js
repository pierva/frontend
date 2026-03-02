// src/components/AdminUserManagement.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import permissionService from '../services/permissionService';

const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const roleLabel = (role) => ({
  admin: 'Admin', factory_team: 'Factory User', client: 'Client', qa: 'QA',
}[role] || role);

const RoleOptions = () => (
  <>
    <option value="factory_team">Factory User</option>
    <option value="qa">QA</option>
    <option value="client">Client</option>
    <option value="admin">Admin</option>
  </>
);

// Category display order
const CATEGORY_ORDER = ['Production', 'CCP', 'Analytics', 'Admin'];

// Group permissions by category
const groupByCategory = (permissions) => {
  const groups = {};
  permissions.forEach(p => {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });
  return groups;
};

// ── Permission Panel ─────────────────────────────────────────────────────────
function PermissionPanel({ user, onClose }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    permissionService.getUserPermissions(user.id)
      .then(data => setPermissions(data.permissions || []))
      .catch(() => setError('Failed to load permissions.'))
      .finally(() => setLoading(false));
  }, [user]);

  const toggle = (moduleKey) => {
    setPermissions(prev =>
      prev.map(p => p.module === moduleKey ? { ...p, granted: !p.granted } : p)
    );
    setSaved(false);
  };

  const grantAll = () => {
    setPermissions(prev => prev.map(p => ({ ...p, granted: true })));
    setSaved(false);
  };

  const revokeAll = () => {
    setPermissions(prev => prev.map(p => ({ ...p, granted: false })));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await permissionService.saveUserPermissions(user.id, permissions.map(p => ({
        module: p.module,
        granted: p.granted,
      })));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  const groups = groupByCategory(permissions);
  const grantedCount = permissions.filter(p => p.granted).length;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
        <div className="modal-content">

          <div className="modal-header">
            <div>
              <h5 className="modal-title mb-0">
                Module Permissions — <strong>{user.username}</strong>
              </h5>
              <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                Role: <strong>{roleLabel(user.role)}</strong>
                &nbsp;·&nbsp;
                {user.role === 'admin'
                  ? 'Admins have full access to all modules.'
                  : `${grantedCount} of ${permissions.length} eligible modules granted`}
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border spinner-border-sm me-2" />Loading…
              </div>
            ) : user.role === 'admin' ? (
              <div className="alert alert-info mb-0">
                Admin users always have access to all modules. No per-module restrictions apply.
              </div>
            ) : permissions.length === 0 ? (
              <div className="alert alert-warning mb-0">
                No modules are eligible for this role.
              </div>
            ) : (
              <>
                {error && <div className="alert alert-danger">{error}</div>}

                {/* Quick actions */}
                <div className="d-flex gap-2 mb-3">
                  <button className="btn btn-sm btn-outline-success" onClick={grantAll}>
                    ✓ Grant All
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={revokeAll}>
                    ✗ Revoke All
                  </button>
                </div>

                {/* Permissions grouped by category */}
                {CATEGORY_ORDER.filter(cat => groups[cat]).map(category => (
                  <div key={category} className="mb-4">
                    <div
                      className="text-uppercase fw-bold mb-2 pb-1 border-bottom"
                      style={{ fontSize: 11, letterSpacing: '0.08em', color: '#6c757d' }}
                    >
                      {category}
                    </div>
                    {groups[category].map(p => (
                      <div
                        key={p.module}
                        className={`d-flex justify-content-between align-items-start p-2 rounded mb-1 ${p.granted ? 'bg-light' : ''}`}
                        style={{ border: p.granted ? '1px solid #c3e6cb' : '1px solid #dee2e6' }}
                      >
                        <div style={{ flex: 1, paddingRight: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.label}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{p.description}</div>
                        </div>
                        <div className="form-check form-switch mb-0 pt-1">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`perm-${p.module}`}
                            checked={p.granted}
                            onChange={() => toggle(p.module)}
                            style={{ width: 40, height: 20, cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Close
            </button>
            {user.role !== 'admin' && (
              <button
                className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
                onClick={handleSave}
                disabled={saving || loading}
                style={{ minWidth: 120 }}
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Permissions'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'factory_team', companyId: '' });
  const [passwordChanges, setPasswordChanges] = useState({});
  const [loggedAdmin, setLoggedAdmin] = useState(null);

  // Permissions panel
  const [permUser, setPermUser] = useState(null); // user whose perms are open
  const [showInactive, setShowInactive] = useState(false);

  const autoDismiss = useCallback((type) => {
    setTimeout(() => {
      if (type === 'success') setMessage('');
      if (type === 'error') setError('');
    }, 3000);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setLoggedAdmin(decoded);

        const [usersRes, companiesRes] = await Promise.all([
          axios.get(`${API_URL}/api/users`, { headers: authHeaders() }),
          axios.get(`${API_URL}/api/companies`, { headers: authHeaders() }),
        ]);
        setUsers(usersRes.data);
        setCompanies(companiesRes.data);
      } catch {
        setError('Error fetching data. Only admins can access this page.');
        autoDismiss('error');
      }
    };
    fetchData();
  }, [autoDismiss]);

  const handleRoleChange = async (userId, newRole) => {
    if (loggedAdmin?.id === userId) { alert('You cannot change your own role.'); return; }
    try {
      await axios.put(`${API_URL}/api/users/${userId}/role`, { role: newRole }, { headers: authHeaders() });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage('Role updated successfully');
      autoDismiss('success');
    } catch {
      setError('Failed to update role.');
      autoDismiss('error');
    }
  };

  const handlePasswordSave = async (userId) => {
    try {
      await axios.put(`${API_URL}/api/users/${userId}/password`,
        { password: passwordChanges[userId] },
        { headers: authHeaders() }
      );
      setMessage('Password updated successfully');
      setPasswordChanges(prev => ({ ...prev, [userId]: '' }));
      autoDismiss('success');
    } catch {
      setError('Failed to update password.');
      autoDismiss('error');
    }
  };

  const handleCompanyChange = async (userId, newCompanyId) => {
    try {
      await axios.put(`${API_URL}/api/users/${userId}/company`, { companyId: newCompanyId || null }, { headers: authHeaders() });
      const company = companies.find(c => String(c.id) === String(newCompanyId)) || null;
      setUsers(users.map(u => u.id === userId ? { ...u, companyId: newCompanyId || null, Company: company ? { name: company.name } : null } : u));
      setMessage('Company updated successfully');
      autoDismiss('success');
    } catch {
      setError('Failed to update company.');
      autoDismiss('error');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    if (loggedAdmin?.id === userId) { alert('You cannot deactivate your own account.'); return; }
    const next = !currentActive;
    const label = next ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${label} this user?`)) return;
    try {
      await axios.put(`${API_URL}/api/users/${userId}/active`, { isActive: next }, { headers: authHeaders() });
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: next } : u));
      setMessage(`User ${next ? 'activated' : 'deactivated'} successfully`);
      autoDismiss('success');
    } catch {
      setError(`Failed to ${label} user.`);
      autoDismiss('error');
    }
  };

  const handleAddUser = async () => {
    const payload = { ...newUser };
    try {
      await axios.post(`${API_URL}/api/users/register`, payload, { headers: authHeaders() });
      setMessage('User added successfully');
      setNewUser({ username: '', password: '', role: 'factory_team', companyId: '' });
      const res = await axios.get(`${API_URL}/api/users`, { headers: authHeaders() });
      setUsers(res.data);
      autoDismiss('success');
    } catch {
      setError('Failed to add user.');
      autoDismiss('error');
    }
  };

  return (
    <div className="container mt-5 pb-5">

      {/* Toast messages */}
      <div className="fixed-top mt-5 d-flex justify-content-center" style={{ zIndex: 2000 }}>
        {message && (
          <div className="alert alert-success alert-dismissible fade show w-75">
            {message}
            <button className="btn-close" onClick={() => setMessage('')} />
          </div>
        )}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show w-75">
            {error}
            <button className="btn-close" onClick={() => setError('')} />
          </div>
        )}
      </div>

      <h2 className="mb-4">User Management</h2>

      {/* ── Add New User ── */}
      <div className="card p-3 mb-4">
        <h5 className="mb-3">Add New User</h5>
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <label className="form-label mb-1">Username</label>
            <input
              type="text"
              className="form-control"
              value={newUser.username}
              onChange={e => setNewUser({ ...newUser, username: e.target.value })}
              placeholder="Enter username"
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label mb-1">Password</label>
            <input
              type="password"
              className="form-control"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Enter password"
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label mb-1">Role</label>
            <select
              className="form-select"
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            >
              <RoleOptions />
            </select>
          </div>
          {newUser.role !== 'admin' && (
            <div className="col-12 col-md-4">
              <label className="form-label mb-1">Company</label>
              <select
                className="form-select"
                value={newUser.companyId}
                onChange={e => setNewUser({ ...newUser, companyId: e.target.value })}
              >
                <option value="">Select a company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <button
          className="btn btn-primary mt-3"
          onClick={handleAddUser}
          disabled={
            !newUser.username || !newUser.password ||
            (newUser.role !== 'admin' && !newUser.companyId)
          }
        >
          Add User
        </button>
      </div>

      {/* ── Active Users Table ── */}
      <h5 className="mb-3">Active Users</h5>
      <div className="table-responsive mb-4">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Company</th>
              <th>Change Role</th>
              <th>Module Access</th>
              <th>Change Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => u.isActive !== false).map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 600 }}>{user.username}</td>
                <td>
                  <span className={`badge ${
                    user.role === 'admin' ? 'bg-danger' :
                    user.role === 'qa' ? 'bg-warning text-dark' :
                    user.role === 'factory_team' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {roleLabel(user.role)}
                  </span>
                </td>
                <td>
                  {user.role === 'admin' ? '—' : (
                    <select
                      className="form-select form-select-sm"
                      value={user.companyId || ''}
                      onChange={e => handleCompanyChange(user.id, e.target.value)}
                    >
                      <option value="">Not assigned</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </td>
                <td>
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    className="form-select form-select-sm"
                    disabled={loggedAdmin?.id === user.id}
                  >
                    <RoleOptions />
                  </select>
                </td>
                <td>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setPermUser(user)}
                  >
                    🔑 Permissions
                  </button>
                </td>
                <td>
                  <div className="input-group input-group-sm">
                    <input
                      type="password"
                      placeholder="New password"
                      className="form-control"
                      value={passwordChanges[user.id] || ''}
                      onChange={e => setPasswordChanges(prev => ({ ...prev, [user.id]: e.target.value }))}
                    />
                    <button
                      className="btn btn-success"
                      onClick={() => handlePasswordSave(user.id)}
                      disabled={!passwordChanges[user.id]}
                    >
                      Save
                    </button>
                  </div>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleToggleActive(user.id, true)}
                    disabled={loggedAdmin?.id === user.id}
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Deactivated Users ── */}
      {users.some(u => u.isActive === false) && (
        <div className="mb-4">
          <button
            className="btn btn-outline-secondary btn-sm mb-3"
            onClick={() => setShowInactive(v => !v)}
          >
            {showInactive ? '▲ Hide' : '▼ Show'} Deactivated Users ({users.filter(u => u.isActive === false).length})
          </button>
          {showInactive && (
            <div className="table-responsive">
              <table className="table table-bordered align-middle" style={{ opacity: 0.75 }}>
                <thead className="table-light">
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.isActive === false).map(user => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600, color: '#6c757d' }}>{user.username}</td>
                      <td>
                        <span className={`badge ${
                          user.role === 'admin' ? 'bg-danger' :
                          user.role === 'qa' ? 'bg-warning text-dark' :
                          user.role === 'factory_team' ? 'bg-primary' : 'bg-secondary'
                        }`} style={{ opacity: 0.6 }}>
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td style={{ color: '#6c757d' }}>
                        {user.role === 'admin' ? '—' : user.Company?.name || 'Not assigned'}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleToggleActive(user.id, false)}
                        >
                          Activate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Permissions Panel Modal ── */}
      {permUser && (
        <PermissionPanel
          user={permUser}
          onClose={() => setPermUser(null)}
        />
      )}

    </div>
  );
}

export default AdminUserManagement;