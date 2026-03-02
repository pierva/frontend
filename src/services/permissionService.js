// src/services/permissionService.js
// Fetches and caches the current user's module permissions from the API.
// Used by ProtectedRoute and the Navbar to gate access.

import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ── Fetch current user's permissions ────────────────────────────────────────
const getMyPermissions = async () => {
  const res = await axios.get(`${API_URL}/api/users/me/permissions`, {
    headers: authHeaders(),
  });
  return res.data; // { role, permissions: ['module.key', ...] }
};

// ── Fetch a specific user's permissions (admin only) ────────────────────────
const getUserPermissions = async (userId) => {
  const res = await axios.get(`${API_URL}/api/users/${userId}/permissions`, {
    headers: authHeaders(),
  });
  return res.data; // { userId, role, permissions: [{ module, label, granted, ... }] }
};

// ── Save a user's permissions (admin only) ───────────────────────────────────
const saveUserPermissions = async (userId, permissions) => {
  const res = await axios.put(
    `${API_URL}/api/users/${userId}/permissions`,
    { permissions },
    { headers: authHeaders() }
  );
  return res.data;
};

const permissionService = {
  getMyPermissions,
  getUserPermissions,
  saveUserPermissions,
};

export default permissionService;