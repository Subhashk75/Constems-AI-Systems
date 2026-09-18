import { z } from 'zod';

export const FilterRuleSchema = z.object({
  field: z.string().min(1),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'gt',
    'gte',
    'lt',
    'lte',
    'between',
    'before',
    'after',
  ]),
  value: z.any(),
});

export const QueryRecordsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(25),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  filters: z.union([z.string(), z.array(FilterRuleSchema)]).optional(),
});
