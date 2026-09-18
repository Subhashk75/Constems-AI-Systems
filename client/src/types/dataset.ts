export type ColumnDataType = 'string' | 'number' | 'date' | 'boolean';

export interface IDatasetColumn {
  name: string;
  label: string;
  dataType: ColumnDataType;
  sampleValue?: any;
  isNullable: boolean;
}

export interface IValidationError {
  rowNumber: number;
  field: string;
  value: any;
  message: string;
}

export interface IDataset {
  _id: string;
  name: string;
  originalFilename: string;
  fileSize: number;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  columns: IDatasetColumn[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  validationErrors: IValidationError[];
  createdAt: string;
  updatedAt: string;
}

export interface IDatasetRecord {
  _id: string;
  rowNumber: number;
  [key: string]: any;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'before'
  | 'after';

export interface FilterRule {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface IPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface IDatasetRecordsResponse {
  records: IDatasetRecord[];
  pagination: IPagination;
}

export interface IDatasetStatsResponse {
  totalRecords: number;
  filteredRecords: number;
  uniqueCounts: Record<string, number>;
  numericStats: Record<string, { min: number; max: number; avg: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
