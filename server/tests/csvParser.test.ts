import { describe, it, expect } from 'vitest';
import { detectColumnType, formatLabel, parseAndValidateValue } from '../src/services/csvParserService.js';

describe('CSV Parser Service Utilities', () => {
  it('should correctly format database column names into human readable labels', () => {
    expect(formatLabel('share_of_shelf_pct')).toBe('Share Of Shelf Pct');
    expect(formatLabel('store_id')).toBe('Store Id');
    expect(formatLabel('in_stock')).toBe('In Stock');
  });

  it('should automatically detect column data types from sample strings', () => {
    expect(detectColumnType(['true', 'false', 'True', 'False'])).toBe('boolean');
    expect(detectColumnType(['336.82', '414.76', '0', '190.24'])).toBe('number');
    expect(detectColumnType(['2024-02-25', '2024-07-07', '2024-12-31'])).toBe('date');
    expect(detectColumnType(['Garnier', 'Pantene', 'Dove'])).toBe('string');
  });

  it('should parse and validate typed values accurately', () => {
    expect(parseAndValidateValue('true', 'boolean', 'in_stock', 1).value).toBe(true);
    expect(parseAndValidateValue('336.82', 'number', 'shelf_price', 1).value).toBe(336.82);
    expect(parseAndValidateValue('2024-02-25', 'date', 'date', 1).value).toBeInstanceOf(Date);

    const invalidNum = parseAndValidateValue('invalid_num', 'number', 'shelf_price', 1);
    expect(invalidNum.error).toBeDefined();
    expect(invalidNum.error?.message).toContain('Invalid number');
  });
});
