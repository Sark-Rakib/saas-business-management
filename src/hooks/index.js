"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";

export function useFetch(url, params = {}, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const { enabled = true, onSuccess, immediate = true } = options;
  const paramsKey = typeof params === "string" ? params : JSON.stringify(params || {});

  const fetchData = useCallback(async () => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data: response } = await api.get(url, { params });
      setData(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (onSuccess) onSuccess(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [url, paramsKey, enabled]);

  useEffect(() => {
    if (immediate) {
      const id = setTimeout(fetchData, 0);
      return () => clearTimeout(id);
    }
  }, [fetchData]);

  return { data, loading, error, pagination, refetch: fetchData, setData };
}

export function useMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (method, url, payload, { onSuccess, onError } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api[method](url, payload);
      if (onSuccess) onSuccess(response.data);
      return response.data;
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      if (onError) onError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback((url, data, opts) => mutate("post", url, data, opts), [mutate]);
  const patch = useCallback((url, data, opts) => mutate("patch", url, data, opts), [mutate]);
  const del = useCallback((url, opts) => mutate("delete", url, null, opts), [mutate]);

  return { post, patch, del, loading, error };
}

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(20);
  return { page, limit, setPage };
}

export function useAutoOpenNew(onOpen) {
  const router = useRouter();
  const openRef = useRef(onOpen);

  useEffect(() => {
    openRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      openRef.current();
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [router]);
}