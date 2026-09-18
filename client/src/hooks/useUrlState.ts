import { useState, useEffect, useCallback } from 'react';
import { FilterRule } from '../types/dataset';

export interface UrlState {
  datasetId: string | null;
  search: string;
  page: number;
  limit: number;
  sortBy: string | undefined;
  sortOrder: 'asc' | 'desc';
  filters: FilterRule[];
}

export function useUrlState(initialDatasetId?: string | null) {
  const getParamsFromUrl = useCallback((): UrlState => {
    const params = new URLSearchParams(window.location.search);

    const datasetId = params.get('datasetId') || initialDatasetId || null;
    const search = params.get('search') || '';
    const page = parseInt(params.get('page') || '1', 10);
    const limit = parseInt(params.get('limit') || '25', 10);
    const sortBy = params.get('sortBy') || undefined;
    const sortOrder = (params.get('sortOrder') as 'asc' | 'desc') || 'asc';

    let filters: FilterRule[] = [];
    const filtersRaw = params.get('filters');
    if (filtersRaw) {
      try {
        filters = JSON.parse(filtersRaw);
      } catch (_) {}
    }

    return {
      datasetId,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    };
  }, [initialDatasetId]);

  const [state, setState] = useState<UrlState>(getParamsFromUrl);

  const updateUrl = useCallback((newState: Partial<UrlState>) => {
    setState((prev) => {
      const next = { ...prev, ...newState };

      const params = new URLSearchParams();
      if (next.datasetId) params.set('datasetId', next.datasetId);
      if (next.search) params.set('search', next.search);
      if (next.page > 1) params.set('page', String(next.page));
      if (next.limit !== 25) params.set('limit', String(next.limit));
      if (next.sortBy) params.set('sortBy', next.sortBy);
      if (next.sortOrder !== 'asc') params.set('sortOrder', next.sortOrder);
      if (next.filters && next.filters.length > 0) {
        params.set('filters', JSON.stringify(next.filters));
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);

      return next;
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setState(getParamsFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getParamsFromUrl]);

  return { state, updateUrl };
}
