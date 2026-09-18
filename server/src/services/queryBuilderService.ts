import mongoose from 'mongoose';
import { ColumnDataType } from '../models/Dataset.js';

export interface FilterRule {
  field: string;
  operator:
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
  value: any;
}

export interface QueryOptions {
  datasetId: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: FilterRule[];
  columns: Array<{ name: string; dataType: ColumnDataType }>;
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export function buildMongoQuery(options: QueryOptions) {
  const { datasetId, search, filters = [], columns } = options;

  const columnMap = new Map<string, ColumnDataType>(columns.map((c) => [c.name, c.dataType]));

  const mongoQuery: Record<string, any> = {
    datasetId: new mongoose.Types.ObjectId(datasetId),
  };

  const andConditions: any[] = [];

  // Global Search across string fields
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
    const stringFields = columns.filter((c) => c.dataType === 'string').map((c) => c.name);

    if (stringFields.length > 0) {
      andConditions.push({
        $or: stringFields.map((field) => ({ [`data.${field}`]: searchRegex })),
      });
    }
  }

  // Filter Rules
  for (const rule of filters) {
    if (!rule.field || !columnMap.has(rule.field)) {
      continue; // Skip invalid or non-whitelisted fields
    }

    const fieldType = columnMap.get(rule.field)!;
    const dbKey = `data.${rule.field}`;
    const condition = buildFieldCondition(dbKey, fieldType, rule.operator, rule.value);

    if (condition) {
      andConditions.push(condition);
    }
  }

  if (andConditions.length > 0) {
    mongoQuery.$and = andConditions;
  }

  // Pagination & Sorting
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(500, Math.max(1, options.limit || 25));
  const skip = (page - 1) * limit;

  const sort: Record<string, 1 | -1> = {};
  if (options.sortBy && columnMap.has(options.sortBy)) {
    sort[`data.${options.sortBy}`] = options.sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.rowNumber = 1;
  }

  return {
    query: mongoQuery,
    sort,
    skip,
    limit,
    page,
  };
}

function buildFieldCondition(
  dbKey: string,
  fieldType: ColumnDataType,
  operator: string,
  val: any
): Record<string, any> | null {
  if (val === undefined || val === null || val === '') return null;

  switch (fieldType) {
    case 'string': {
      const strVal = String(val);
      switch (operator) {
        case 'equals':
          return { [dbKey]: strVal };
        case 'not_equals':
          return { [dbKey]: { $ne: strVal } };
        case 'contains':
          return { [dbKey]: new RegExp(escapeRegex(strVal), 'i') };
        case 'not_contains':
          return { [dbKey]: { $not: new RegExp(escapeRegex(strVal), 'i') } };
        case 'starts_with':
          return { [dbKey]: new RegExp(`^${escapeRegex(strVal)}`, 'i') };
        case 'ends_with':
          return { [dbKey]: new RegExp(`${escapeRegex(strVal)}$`, 'i') };
        default:
          return null;
      }
    }

    case 'number': {
      if (operator === 'between' && Array.isArray(val)) {
        const min = Number(val[0]);
        const max = Number(val[1]);
        if (isNaN(min) || isNaN(max)) return null;
        return { [dbKey]: { $gte: min, $lte: max } };
      }

      const numVal = Number(val);
      if (isNaN(numVal)) return null;

      switch (operator) {
        case 'equals':
          return { [dbKey]: numVal };
        case 'not_equals':
          return { [dbKey]: { $ne: numVal } };
        case 'gt':
          return { [dbKey]: { $gt: numVal } };
        case 'gte':
          return { [dbKey]: { $gte: numVal } };
        case 'lt':
          return { [dbKey]: { $lt: numVal } };
        case 'lte':
          return { [dbKey]: { $lte: numVal } };
        default:
          return null;
      }
    }

    case 'date': {
      if (operator === 'between' && Array.isArray(val)) {
        const start = new Date(val[0]);
        const end = new Date(val[1]);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        return { [dbKey]: { $gte: start, $lte: end } };
      }

      const dateVal = new Date(val);
      if (isNaN(dateVal.getTime())) return null;

      switch (operator) {
        case 'equals':
          return { [dbKey]: dateVal };
        case 'before':
        case 'lt':
          return { [dbKey]: { $lt: dateVal } };
        case 'after':
        case 'gt':
          return { [dbKey]: { $gt: dateVal } };
        case 'gte':
          return { [dbKey]: { $gte: dateVal } };
        case 'lte':
          return { [dbKey]: { $lte: dateVal } };
        default:
          return null;
      }
    }

    case 'boolean': {
      let boolVal: boolean;
      if (typeof val === 'boolean') boolVal = val;
      else if (String(val).toLowerCase() === 'true' || val === 'yes' || val === 1) boolVal = true;
      else if (String(val).toLowerCase() === 'false' || val === 'no' || val === 0) boolVal = false;
      else return null;

      if (operator === 'not_equals') {
        return { [dbKey]: { $ne: boolVal } };
      }
      return { [dbKey]: boolVal };
    }

    default:
      return null;
  }
}
