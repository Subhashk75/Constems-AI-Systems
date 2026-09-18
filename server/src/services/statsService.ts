import mongoose from 'mongoose';
import { DatasetRecord } from '../models/DatasetRecord.js';
import { ColumnDataType } from '../models/Dataset.js';

export async function getDatasetStats(
  datasetId: string,
  query: Record<string, any>,
  columns: Array<{ name: string; dataType: ColumnDataType }>
) {
  const matchStage = { $match: query };

  const stringCols = columns.filter((c) => c.dataType === 'string').map((c) => c.name);
  const numberCols = columns.filter((c) => c.dataType === 'number').map((c) => c.name);

  const facetGroup: Record<string, any> = {};

  // Unique count pipeline for top categorical columns (up to 6)
  const topCategories = stringCols.slice(0, 6);
  for (const catField of topCategories) {
    facetGroup[`unique_${catField}`] = [
      { $group: { _id: `$data.${catField}` } },
      { $match: { _id: { $ne: null } } },
      { $count: 'count' },
    ];
  }

  // Numeric summary stats
  if (numberCols.length > 0) {
    const statsGroup: Record<string, any> = { _id: null };
    for (const numField of numberCols.slice(0, 6)) {
      statsGroup[`avg_${numField}`] = { $avg: `$data.${numField}` };
      statsGroup[`min_${numField}`] = { $min: `$data.${numField}` };
      statsGroup[`max_${numField}`] = { $max: `$data.${numField}` };
    }
    facetGroup.numericStats = [{ $group: statsGroup }];
  }

  // Count total filtered records
  facetGroup.count = [{ $count: 'total' }];

  const pipeline = [matchStage, { $facet: facetGroup }];
  const [aggregateResult] = await DatasetRecord.aggregate(pipeline);

  const filteredRecords = aggregateResult?.count?.[0]?.total || 0;

  const totalRecords = await DatasetRecord.countDocuments({
    datasetId: new mongoose.Types.ObjectId(datasetId),
  });

  const uniqueCounts: Record<string, number> = {};
  for (const catField of topCategories) {
    uniqueCounts[catField] = aggregateResult?.[`unique_${catField}`]?.[0]?.count || 0;
  }

  const numericStatsRaw = aggregateResult?.numericStats?.[0] || {};
  const numericStats: Record<string, { min: number; max: number; avg: number }> = {};

  for (const numField of numberCols.slice(0, 6)) {
    if (numericStatsRaw[`avg_${numField}`] !== undefined) {
      numericStats[numField] = {
        min: numericStatsRaw[`min_${numField}`] ?? 0,
        max: numericStatsRaw[`max_${numField}`] ?? 0,
        avg: Math.round((numericStatsRaw[`avg_${numField}`] ?? 0) * 100) / 100,
      };
    }
  }

  return {
    totalRecords,
    filteredRecords,
    uniqueCounts,
    numericStats,
  };
}
