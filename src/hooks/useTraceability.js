// src/hooks/useTraceability.js
import { useState, useEffect, useCallback } from 'react';
import service from '../services/traceabilityService';

export function useTraceability(limit) {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // fetchPage no longer closes over `page`; it accepts it as a parameter
  const fetchPage = useCallback(
    async (pageToFetch) => {
      const token = localStorage.getItem('token');
      try {
        const resp = await service.getLogs(pageToFetch, limit, token);
        setLogs(resp.data.logs);
        setTotalPages(resp.data.totalPages);
      } catch (err) {
        console.error('Error fetching traceability logs:', err);
      }
    },
    [limit] // only depends on `limit`
  );

  // whenever `page` changes (or we get a new fetchPage fn), refetch
  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  return { logs, page, totalPages, setPage, fetchPage };
}
