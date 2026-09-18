import { describe, it, expect } from 'vitest';
import { buildMongoQuery } from '../src/services/queryBuilderService.js';
import mongoose from 'mongoose';

describe('MongoDB Query Builder Service', () => {
  const dummyDatasetId = new mongoose.Types.ObjectId().toHexString();
  const sampleColumns = [
    { name: 'brand', dataType: 'string' as const },
    { name: 'region', dataType: 'string' as const },
    { name: 'share_of_shelf_pct', dataType: 'number' as const },
    { name: 'in_stock', dataType: 'boolean' as const },
    { name: 'date', dataType: 'date' as const },
  ];

  it('should build a mongo query with datasetId, pagination, and sorting', () => {
    const config = buildMongoQuery({
      datasetId: dummyDatasetId,
      page: 2,
      limit: 10,
      sortBy: 'share_of_shelf_pct',
      sortOrder: 'desc',
      columns: sampleColumns,
    });

    expect(config.skip).toBe(10);
    expect(config.limit).toBe(10);
    expect(config.sort).toEqual({ 'data.share_of_shelf_pct': -1 });
  });

  it('should build structured filter conditions for multiple combined rules', () => {
    const config = buildMongoQuery({
      datasetId: dummyDatasetId,
      filters: [
        { field: 'brand', operator: 'equals', value: 'Garnier' },
        { field: 'region', operator: 'equals', value: 'West' },
        { field: 'share_of_shelf_pct', operator: 'gte', value: 5 },
        { field: 'in_stock', operator: 'equals', value: true },
      ],
      columns: sampleColumns,
    });

    expect(config.query.$and).toBeDefined();
    expect(config.query.$and.length).toBe(4);
    expect(config.query.$and[0]).toEqual({ 'data.brand': 'Garnier' });
    expect(config.query.$and[1]).toEqual({ 'data.region': 'West' });
    expect(config.query.$and[2]).toEqual({ 'data.share_of_shelf_pct': { $gte: 5 } });
    expect(config.query.$and[3]).toEqual({ 'data.in_stock': true });
  });

  it('should ignore non-whitelisted fields to prevent query injection', () => {
    const config = buildMongoQuery({
      datasetId: dummyDatasetId,
      filters: [
        { field: 'unapproved_field', operator: 'equals', value: 'malicious' },
        { field: '$where', operator: 'equals', value: 'script' },
      ],
      columns: sampleColumns,
    });

    expect(config.query.$and).toBeUndefined();
  });
});
