import mongoose, { Schema, Document } from 'mongoose';

export interface IDatasetRecord extends Document {
  datasetId: mongoose.Types.ObjectId;
  rowNumber: number;
  data: Record<string, any>;
  createdAt: Date;
}

const DatasetRecordSchema = new Schema<IDatasetRecord>(
  {
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true, index: true },
    rowNumber: { type: Number, required: true },
    data: { type: Map, of: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound indexes for optimal filter and sorting query performance
DatasetRecordSchema.index({ datasetId: 1, rowNumber: 1 });
DatasetRecordSchema.index({ datasetId: 1, 'data.brand': 1 });
DatasetRecordSchema.index({ datasetId: 1, 'data.region': 1 });
DatasetRecordSchema.index({ datasetId: 1, 'data.city': 1 });
DatasetRecordSchema.index({ datasetId: 1, 'data.date': 1 });
DatasetRecordSchema.index({ datasetId: 1, 'data.share_of_shelf_pct': 1 });
DatasetRecordSchema.index({ datasetId: 1, 'data.in_stock': 1 });
DatasetRecordSchema.index({ datasetId: 1, 'data.on_promotion': 1 });

export const DatasetRecord = mongoose.model<IDatasetRecord>('DatasetRecord', DatasetRecordSchema);
