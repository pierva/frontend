import { useState, useEffect } from 'react';
import service from '../services/traceabilityService';

export function useTraceability(limit = 20) {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchPage = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await service.getLogs(p, limit, token);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotalLogs(data.totalLogs);
      setPage(data.currentPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [page]);

  return { logs, page, totalPages, totalLogs, setPage, fetchPage, loading };
}
