import React from 'react';
import { FilterRule, IDatasetColumn } from '../types/dataset';
import { X, FilterX } from 'lucide-react';
import { formatLabel } from '../utils/formatters';

interface ActiveFiltersProps {
  filters: FilterRule[];
  columns: IDatasetColumn[];
  onRemoveFilter: (index: number) => void;
  onClearAll: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  columns,
  onRemoveFilter,
  onClearAll,
}) => {
  if (filters.length === 0) return null;

  const columnLabelMap = new Map(columns.map((c) => [c.name, c.label]));

  const formatFilterValue = (rule: FilterRule): string => {
    if (rule.operator === 'between' && Array.isArray(rule.value)) {
      return `${rule.value[0]} - ${rule.value[1]}`;
    }
    if (typeof rule.value === 'boolean') {
      return rule.value ? 'Yes' : 'No';
    }
    return String(rule.value);
  };

  const getOperatorSymbol = (operator: string): string => {
    switch (operator) {
      case 'equals':
        return '=';
      case 'not_equals':
        return '≠';
      case 'gt':
        return '>';
      case 'gte':
        return '>=';
      case 'lt':
        return '<';
      case 'lte':
        return '<=';
      case 'contains':
        return 'contains';
      case 'between':
        return 'in range';
      default:
        return operator;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
        Active Filters:
      </span>

      {filters.map((rule, idx) => {
        const fieldLabel = columnLabelMap.get(rule.field) || formatLabel(rule.field);
        const operatorSymbol = getOperatorSymbol(rule.operator);
        const formattedVal = formatFilterValue(rule);

        return (
          <div
            key={`${rule.field}-${idx}`}
            className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-800/40 text-blue-200 text-xs px-3 py-1 rounded-full shadow-sm"
          >
            <span className="font-semibold text-blue-400">{fieldLabel}</span>
            <span className="text-slate-400">{operatorSymbol}</span>
            <span className="font-medium text-white">{formattedVal}</span>
            <button
              onClick={() => onRemoveFilter(idx)}
              className="ml-1 text-blue-400 hover:text-white p-0.5 rounded-full hover:bg-blue-900/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      <button
        onClick={onClearAll}
        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded-lg hover:bg-red-950/30 transition-colors"
      >
        <FilterX className="w-3.5 h-3.5" />
        <span>Clear All</span>
      </button>
    </div>
  );
};
