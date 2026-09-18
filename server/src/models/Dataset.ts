import mongoose, { Schema, Document } from 'mongoose';

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

export interface IDataset extends Document {
  name: string;
  originalFilename: string;
  fileSize: number;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  columns: IDatasetColumn[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  validationErrors: IValidationError[];
  createdAt: Date;
  updatedAt: Date;
}

const DatasetColumnSchema = new Schema<IDatasetColumn>(
  {
    name: { type: String, required: true },
    label: { type: String, required: true },
    dataType: {
      type: String,
      enum: ['string', 'number', 'date', 'boolean'],
      required: true,
    },
    sampleValue: { type: Schema.Types.Mixed },
    isNullable: { type: Boolean, default: true },
  },
  { _id: false }
);

const ValidationErrorSchema = new Schema<IValidationError>(
  {
    rowNumber: { type: Number, required: true },
    field: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
    message: { type: String, required: true },
  },
  { _id: false }
);

const DatasetSchema = new Schema<IDataset>(
  {
    name: { type: String, required: true, trim: true },
    originalFilename: { type: String, required: true },
    fileSize: { type: Number, required: true },
    rowCount: { type: Number, default: 0 },
    validRowCount: { type: Number, default: 0 },
    invalidRowCount: { type: Number, default: 0 },
    columns: [DatasetColumnSchema],
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    validationErrors: [ValidationErrorSchema],
  },
  { timestamps: true }
);

export const Dataset = mongoose.model<IDataset>('Dataset', DatasetSchema);
