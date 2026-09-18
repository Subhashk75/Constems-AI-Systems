import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDatasetsApi,
  fetchDatasetByIdApi,
  fetchDatasetRecordsApi,
  fetchDatasetStatsApi,
  deleteDatasetApi,
} from './services/api';
import { useUrlState } from './hooks/useUrlState';
import { useDebounce } from './hooks/useDebounce';
import { FilterRule, IDataset } from './types/dataset';
import { Header } from './components/Header';
import { CsvUploader } from './components/CsvUploader';
import { DatasetStats } from './components/DatasetStats';
import { GlobalSearch } from './components/GlobalSearch';
import { FilterBuilder } from './components/FilterBuilder';
import { ActiveFilters } from './components/ActiveFilters';
import { DatasetTable } from './components/DatasetTable';
import { PaginationControls } from './components/PaginationControls';
import { EmptyState, ErrorAlert } from './components/StateContainers';
import { Filter, Plus } from 'lucide-react';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch Dataset list
  const { data: datasets = [], isLoading: isDatasetsLoading, isError: isDatasetsError } = useQuery({
    queryKey: ['datasets'],
    queryFn: fetchDatasetsApi,
  });

  // URL State management
  const { state: urlState, updateUrl } = useUrlState(datasets[0]?._id || null);

  // Auto-select dataset when list loads if no selection in URL
  useEffect(() => {
    if (datasets.length > 0 && !urlState.datasetId) {
      updateUrl({ datasetId: datasets[0]._id });
    }
  }, [datasets, urlState.datasetId, updateUrl]);

  // Selected Dataset ID
  const selectedDatasetId = urlState.datasetId;

  // Fetch Dataset Schema & Metadata
  const { data: dataset, isLoading: isDatasetLoading } = useQuery({
    queryKey: ['dataset', selectedDatasetId],
    queryFn: () => fetchDatasetByIdApi(selectedDatasetId!),
    enabled: !!selectedDatasetId,
  });

  // Debounced Global Search
  const debouncedSearch = useDebounce(urlState.search, 300);

  // Fetch Dataset Records (Server-side Filtered/Sorted/Paginated)
  const {
    data: recordsData,
    isLoading: isRecordsLoading,
    isError: isRecordsError,
    error: recordsError,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: [
      'dataset-records',
      selectedDatasetId,
      urlState.page,
      urlState.limit,
      debouncedSearch,
      urlState.sortBy,
      urlState.sortOrder,
      urlState.filters,
    ],
    queryFn: () =>
      fetchDatasetRecordsApi(selectedDatasetId!, {
        page: urlState.page,
        limit: urlState.limit,
        search: debouncedSearch,
        sortBy: urlState.sortBy,
        sortOrder: urlState.sortOrder,
        filters: urlState.filters,
      }),
    enabled: !!selectedDatasetId && !!dataset,
  });

  // Fetch Dynamic Summary Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dataset-stats', selectedDatasetId, debouncedSearch, urlState.filters],
    queryFn: () =>
      fetchDatasetStatsApi(selectedDatasetId!, {
        search: debouncedSearch,
        filters: urlState.filters,
      }),
    enabled: !!selectedDatasetId && !!dataset,
  });

  // Delete Dataset Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDatasetApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      updateUrl({ datasetId: null, page: 1, filters: [], search: '' });
    },
  });

  // Handlers
  const handleSelectDataset = (id: string) => {
    updateUrl({ datasetId: id, page: 1, search: '', filters: [], sortBy: undefined });
  };

  const handleAddFilter = (rule: FilterRule) => {
    const updated = [...urlState.filters, rule];
    updateUrl({ filters: updated, page: 1 });
  };

  const handleRemoveFilter = (index: number) => {
    const updated = urlState.filters.filter((_, i) => i !== index);
    updateUrl({ filters: updated, page: 1 });
  };

  const handleClearAllFilters = () => {
    updateUrl({ filters: [], page: 1 });
  };

  const handleSortChange = (field: string) => {
    if (urlState.sortBy === field) {
      const nextOrder = urlState.sortOrder === 'asc' ? 'desc' : 'asc';
      updateUrl({ sortOrder: nextOrder });
    } else {
      updateUrl({ sortBy: field, sortOrder: 'asc' });
    }
  };

  const handleUploadSuccess = (newDataset: IDataset) => {
    queryClient.invalidateQueries({ queryKey: ['datasets'] });
    updateUrl({ datasetId: newDataset._id, page: 1, search: '', filters: [] });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        datasets={datasets}
        selectedDataset={dataset || null}
        onSelectDataset={handleSelectDataset}
        onOpenUpload={() => setIsUploadOpen(true)}
        onDeleteDataset={(id) => deleteMutation.mutate(id)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {datasets.length === 0 && !isDatasetsLoading ? (
          <EmptyState onOpenUpload={() => setIsUploadOpen(true)} />
        ) : (
          <>
            {/* KPI Summary Statistics */}
            <DatasetStats stats={statsData} isLoading={isStatsLoading} />

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <GlobalSearch
                value={urlState.search}
                onChange={(val) => updateUrl({ search: val, page: 1 })}
              />

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  disabled={!dataset}
                  className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-200 font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Filter className="w-4 h-4 text-blue-400" />
                  <span>Add Filter</span>
                  {urlState.filters.length > 0 && (
                    <span className="bg-blue-600 text-white font-bold rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                      {urlState.filters.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Active Filters Bar */}
            <ActiveFilters
              filters={urlState.filters}
              columns={dataset?.columns || []}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />

            {/* Error Display */}
            {isRecordsError && (
              <ErrorAlert
                message={(recordsError as Error)?.message || 'Failed to fetch dataset records.'}
                onRetry={refetchRecords}
              />
            )}

            {/* Data Grid Table */}
            <DatasetTable
              columns={dataset?.columns || []}
              records={recordsData?.records || []}
              sortBy={urlState.sortBy}
              sortOrder={urlState.sortOrder}
              onSortChange={handleSortChange}
              isLoading={isRecordsLoading || isDatasetLoading}
            />

            {/* Pagination */}
            {recordsData?.pagination && (
              <PaginationControls
                pagination={recordsData.pagination}
                onPageChange={(p) => updateUrl({ page: p })}
                onLimitChange={(l) => updateUrl({ limit: l, page: 1 })}
              />
            )}
          </>
        )}
      </main>

      {/* CSV Uploader Modal */}
      <CsvUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Filter Builder Modal */}
      <FilterBuilder
        columns={dataset?.columns || []}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onAddFilter={handleAddFilter}
      />
    </div>
  );
};
