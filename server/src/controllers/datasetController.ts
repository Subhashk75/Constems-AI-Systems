import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Dataset } from '../models/Dataset.js';
import { DatasetRecord } from '../models/DatasetRecord.js';
import { processCsvFile } from '../services/csvParserService.js';
import { buildMongoQuery, FilterRule } from '../services/queryBuilderService.js';
import { getDatasetStats as calculateStats } from '../services/statsService.js';
import { QueryRecordsSchema } from '../validators/datasetSchemas.js';

export async function uploadDataset(req: Request, res: Response, next: NextFunction) {
  let filePath: string | null = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_UPLOADED', message: 'Please attach a valid CSV file.' },
      });
    }

    filePath = req.file.path;
    const originalFilename = req.file.originalname;
    const fileSize = req.file.size;
    const datasetName = (req.body.name || path.parse(originalFilename).name).trim();

    // Create Dataset shell
    const dataset = await Dataset.create({
      name: datasetName,
      originalFilename,
      fileSize,
      processingStatus: 'processing',
    });

    // Parse and validate CSV
    let parseResult;
    try {
      parseResult = await processCsvFile(filePath);
    } catch (err: any) {
      dataset.processingStatus = 'failed';
      await dataset.save();
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CSV', message: err.message },
      });
    }

    const { totalRows, validRows, invalidRows, columns, errors, parsedRecords } = parseResult;

    dataset.rowCount = totalRows;
    dataset.validRowCount = validRows;
    dataset.invalidRowCount = invalidRows;
    dataset.columns = columns;
    dataset.validationErrors = errors;
    dataset.processingStatus = 'completed';
    await dataset.save();

    // Bulk Insert Records in batches of 1,000
    if (parsedRecords.length > 0) {
      const recordsToInsert = parsedRecords.map((r) => ({
        datasetId: dataset._id,
        rowNumber: r.rowNumber,
        data: r.data,
      }));

      const BATCH_SIZE = 1000;
      for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
        const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
        await DatasetRecord.insertMany(batch, { ordered: false });
      }
    }

    return res.status(201).json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    next(error);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }
  }
}

export async function getDatasets(req: Request, res: Response, next: NextFunction) {
  try {
    const datasets = await Dataset.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: datasets,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDatasetById(req: Request, res: Response, next: NextFunction) {
  try {
    const { datasetId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(datasetId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid dataset ID format.' },
      });
    }

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: { code: 'DATASET_NOT_FOUND', message: 'Dataset not found.' },
      });
    }

    return res.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDatasetRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const { datasetId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(datasetId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid dataset ID format.' },
      });
    }

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: { code: 'DATASET_NOT_FOUND', message: 'Dataset not found.' },
      });
    }

    // Parse filters parameter (can be query parameter or request body)
    let rawFilters = req.query.filters || req.body?.filters;
    let filters: FilterRule[] = [];

    if (typeof rawFilters === 'string') {
      try {
        const parsed = JSON.parse(rawFilters);
        if (Array.isArray(parsed)) filters = parsed;
      } catch (_) {
        filters = [];
      }
    } else if (Array.isArray(rawFilters)) {
      filters = rawFilters as unknown as FilterRule[];
    }

    const parsedQuery = QueryRecordsSchema.safeParse({
      ...req.query,
      filters,
    });

    if (!parsedQuery.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUERY', message: parsedQuery.error.message },
      });
    }

    const { page, limit, search, sortBy, sortOrder } = parsedQuery.data;

    const mongoQueryConfig = buildMongoQuery({
      datasetId,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      filters,
      columns: dataset.columns,
    });

    const [records, totalFilteredRecords] = await Promise.all([
      DatasetRecord.find(mongoQueryConfig.query)
        .sort(mongoQueryConfig.sort)
        .skip(mongoQueryConfig.skip)
        .limit(mongoQueryConfig.limit)
        .lean(),
      DatasetRecord.countDocuments(mongoQueryConfig.query),
    ]);

    const totalPages = Math.ceil(totalFilteredRecords / limit) || 1;

    return res.json({
      success: true,
      data: {
        records: records.map((r) => ({
          _id: r._id,
          rowNumber: r.rowNumber,
          ...r.data,
        })),
        pagination: {
          page,
          limit,
          totalRecords: totalFilteredRecords,
          totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDatasetStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { datasetId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(datasetId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid dataset ID format.' },
      });
    }

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: { code: 'DATASET_NOT_FOUND', message: 'Dataset not found.' },
      });
    }

    let rawFilters = req.query.filters;
    let filters: FilterRule[] = [];
    if (typeof rawFilters === 'string') {
      try {
        const parsed = JSON.parse(rawFilters);
        if (Array.isArray(parsed)) filters = parsed;
      } catch (_) {}
    } else if (Array.isArray(rawFilters)) {
      filters = rawFilters as unknown as FilterRule[];
    }

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const mongoQueryConfig = buildMongoQuery({
      datasetId,
      search,
      filters,
      columns: dataset.columns,
    });

    const stats = await calculateStats(datasetId, mongoQueryConfig.query, dataset.columns);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDataset(req: Request, res: Response, next: NextFunction) {
  try {
    const { datasetId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(datasetId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid dataset ID format.' },
      });
    }

    const dataset = await Dataset.findByIdAndDelete(datasetId);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: { code: 'DATASET_NOT_FOUND', message: 'Dataset not found.' },
      });
    }

    await DatasetRecord.deleteMany({ datasetId: new mongoose.Types.ObjectId(datasetId) });

    return res.json({
      success: true,
      data: { message: 'Dataset and associated records successfully deleted.' },
    });
  } catch (error) {
    next(error);
  }
}
