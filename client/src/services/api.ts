import axios from 'axios';
import {
  ApiResponse,
  IDataset,
  IDatasetRecordsResponse,
  IDatasetStatsResponse,
  FilterRule,
} from '../types/dataset';

const API_BASE = '/api/v1/datasets';

export async function uploadCsvApi(
  file: File,
  name?: string,
  onProgress?: (percentage: number) => void
): Promise<IDataset> {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);

  const response = await axios.post<ApiResponse<IDataset>>(`${API_BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to upload CSV file');
  }

  return response.data.data;
}

export async function fetchDatasetsApi(): Promise<IDataset[]> {
  const response = await axios.get<ApiResponse<IDataset[]>>(`${API_BASE}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch datasets');
  }
  return response.data.data;
}

export async function fetchDatasetByIdApi(datasetId: string): Promise<IDataset> {
  const response = await axios.get<ApiResponse<IDataset>>(`${API_BASE}/${datasetId}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch dataset');
  }
  return response.data.data;
}

export async function fetchDatasetRecordsApi(
  datasetId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: FilterRule[];
  }
): Promise<IDatasetRecordsResponse> {
  const response = await axios.post<ApiResponse<IDatasetRecordsResponse>>(
    `${API_BASE}/${datasetId}/records`,
    {
      page: params.page,
      limit: params.limit,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      filters: params.filters,
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch dataset records');
  }

  return response.data.data;
}

export async function fetchDatasetStatsApi(
  datasetId: string,
  params: {
    search?: string;
    filters?: FilterRule[];
  }
): Promise<IDatasetStatsResponse> {
  const response = await axios.get<ApiResponse<IDatasetStatsResponse>>(
    `${API_BASE}/${datasetId}/stats`,
    {
      params: {
        search: params.search,
        filters: params.filters ? JSON.stringify(params.filters) : undefined,
      },
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch dataset statistics');
  }

  return response.data.data;
}

export async function deleteDatasetApi(datasetId: string): Promise<void> {
  const response = await axios.delete<ApiResponse<{ message: string }>>(`${API_BASE}/${datasetId}`);
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete dataset');
  }
}
