// src/context/PermissionContext.js
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import permissionService from '../services/permissionService';
import authService from '../services/authService';

const getRoleFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded?.role || null;
  } catch {
    return null;
  }
};

const PermissionContext = createContext({
  permissions: [],
  role: null,
  loading: true,
  hasModule: () => false,
  refresh: () => {},
});

export function PermissionProvider({ children }) {
  const [role, setRole] = useState(() => getRoleFromToken());
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const retryRef = useRef(0);
  // Use a ref to hold the latest load function to avoid stale closures in the event listener
  const loadRef = useRef(null);

  const load = useCallback(async () => {
    if (!authService.isTokenValid()) {
      setPermissions([]);
      setRole(null);
      setLoading(false);
      return;
    }

    const tokenRole = getRoleFromToken();
    if (tokenRole) setRole(tokenRole);

    try {
      const data = await permissionService.getMyPermissions();
      setPermissions(data.permissions || []);
      setRole(data.role || tokenRole);
      retryRef.current = 0;
    } catch (err) {
      console.error('Failed to load permissions:', err);
      if (retryRef.current < 1) {
        retryRef.current += 1;
        setTimeout(() => loadRef.current?.(), 1500);
      } else {
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []); // stable — no state deps

  // Keep the ref in sync
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Re-load on auth changes (login / logout)
  useEffect(() => {
    const handler = () => {
      retryRef.current = 0;
      setPermissions([]);
      setRole(getRoleFromToken());
      setLoading(true);
      // Small defer so token is fully written to localStorage before we read it
      setTimeout(() => loadRef.current?.(), 50);
    };
    window.addEventListener('authChanged', handler);
    return () => window.removeEventListener('authChanged', handler);
  }, []); // no deps — handler uses ref, never stale

  const hasModule = useCallback((moduleKey) => {
    if (role === 'admin') return true;
    if (loading) return true; // avoid premature block during load
    return permissions.includes(moduleKey);
  }, [permissions, role, loading]);

  return (
    <PermissionContext.Provider value={{ permissions, role, loading, hasModule, refresh: load }}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionContext);