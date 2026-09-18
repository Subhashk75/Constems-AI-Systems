import fs from 'fs';
import { parse } from 'csv-parse';
import { ColumnDataType, IDatasetColumn, IValidationError } from '../models/Dataset.js';

export interface ParseResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  columns: IDatasetColumn[];
  errors: IValidationError[];
  parsedRecords: Array<{ rowNumber: number; data: Record<string, any> }>;
}

export function formatLabel(columnName: string): string {
  return columnName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function detectColumnType(values: string[]): ColumnDataType {
  const nonNilValues = values.filter((v) => v !== undefined && v !== null && v.trim() !== '');
  if (nonNilValues.length === 0) return 'string';

  let isBool = true;
  let isNum = true;
  let isDate = true;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$|^\d{1,2}-[A-Za-z]{3}-\d{4}$/;

  for (const raw of nonNilValues) {
    const val = raw.trim();

    // Check Boolean
    if (!['true', 'false', 'yes', 'no', '1', '0'].includes(val.toLowerCase())) {
      isBool = false;
    }

    // Check Number
    if (isNaN(Number(val))) {
      isNum = false;
    }

    // Check Date
    const isMatchingDatePattern = dateRegex.test(val);
    const parsedDate = Date.parse(val);
    if (!isMatchingDatePattern || isNaN(parsedDate)) {
      isDate = false;
    }
  }

  if (isBool) return 'boolean';
  if (isNum) return 'number';
  if (isDate) return 'date';

  return 'string';
}

export function parseAndValidateValue(
  rawValue: string | undefined | null,
  dataType: ColumnDataType,
  fieldName: string,
  rowNumber: number
): { value: any; error?: IValidationError } {
  if (rawValue === undefined || rawValue === null || rawValue.trim() === '') {
    return { value: null };
  }

  const trimmed = rawValue.trim();

  switch (dataType) {
    case 'boolean': {
      const lower = trimmed.toLowerCase();
      if (['true', 'yes', '1'].includes(lower)) return { value: true };
      if (['false', 'no', '0'].includes(lower)) return { value: false };
      return {
        value: null,
        error: {
          rowNumber,
          field: fieldName,
          value: rawValue,
          message: `Invalid boolean value '${rawValue}'`,
        },
      };
    }
    case 'number': {
      const num = Number(trimmed);
      if (isNaN(num)) {
        return {
          value: null,
          error: {
            rowNumber,
            field: fieldName,
            value: rawValue,
            message: `Invalid number '${rawValue}'`,
          },
        };
      }
      return { value: num };
    }
    case 'date': {
      const timestamp = Date.parse(trimmed);
      if (isNaN(timestamp)) {
        return {
          value: null,
          error: {
            rowNumber,
            field: fieldName,
            value: rawValue,
            message: `Invalid date format '${rawValue}'`,
          },
        };
      }
      return { value: new Date(timestamp) };
    }
    case 'string':
    default:
      return { value: trimmed };
  }
}

export async function processCsvFile(filePath: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const rawRows: Record<string, string>[] = [];
    let headers: string[] = [];

    const parser = fs.createReadStream(filePath).pipe(
      parse({
        columns: (head: string[]) => {
          headers = head.map((h) => h.trim());
          // Check for duplicate columns or empty headers
          const seen = new Set<string>();
          for (const h of headers) {
            if (!h) {
              throw new Error('CSV contains empty column header names');
            }
            if (seen.has(h)) {
              throw new Error(`Duplicate column name detected: '${h}'`);
            }
            seen.add(h);
          }
          return headers;
        },
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      })
    );

    parser.on('data', (row: Record<string, string>) => {
      rawRows.push(row);
    });

    parser.on('error', (err) => {
      reject(new Error(`Failed to parse CSV file: ${err.message}`));
    });

    parser.on('end', () => {
      if (headers.length === 0) {
        return reject(new Error('CSV file is empty or missing header row'));
      }

      if (rawRows.length === 0) {
        return reject(new Error('CSV file contains no data rows'));
      }

      // Column Type Detection using up to 100 sample rows
      const sampleRows = rawRows.slice(0, 100);
      const columns: IDatasetColumn[] = headers.map((colName) => {
        const sampleValues = sampleRows.map((r) => r[colName] ?? '');
        const detectedType = detectColumnType(sampleValues);
        const sampleVal = sampleRows.find((r) => r[colName] && r[colName].trim() !== '')?.[colName];

        return {
          name: colName,
          label: formatLabel(colName),
          dataType: detectedType,
          sampleValue: sampleVal ?? null,
          isNullable: rawRows.some((r) => !r[colName] || r[colName].trim() === ''),
        };
      });

      // Parse & Validate every row
      const errors: IValidationError[] = [];
      const parsedRecords: Array<{ rowNumber: number; data: Record<string, any> }> = [];

      let rowIdx = 0;
      for (const rawRow of rawRows) {
        rowIdx++;
        const rowData: Record<string, any> = {};
        let rowHasError = false;

        for (const col of columns) {
          const rawVal = rawRow[col.name];
          const { value, error } = parseAndValidateValue(rawVal, col.dataType, col.name, rowIdx);

          if (error) {
            rowHasError = true;
            errors.push(error);
          }
          rowData[col.name] = value;
        }

        parsedRecords.push({
          rowNumber: rowIdx,
          data: rowData,
        });
      }

      const totalRows = rawRows.length;
      const invalidRows = new Set(errors.map((e) => e.rowNumber)).size;
      const validRows = totalRows - invalidRows;

      resolve({
        totalRows,
        validRows,
        invalidRows,
        columns,
        errors,
        parsedRecords,
      });
    });
  });
}
