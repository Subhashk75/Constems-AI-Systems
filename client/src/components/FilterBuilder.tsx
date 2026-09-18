import React, { useState, useEffect } from 'react';
import { IDatasetColumn, FilterRule, FilterOperator } from '../types/dataset';
import { Filter, Plus, X } from 'lucide-react';

interface FilterBuilderProps {
  columns: IDatasetColumn[];
  isOpen: boolean;
  onClose: () => void;
  onAddFilter: (rule: FilterRule) => void;
}

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  columns,
  isOpen,
  onClose,
  onAddFilter,
}) => {
  const [selectedField, setSelectedField] = useState<string>('');
  const [operator, setOperator] = useState<FilterOperator>('equals');
  const [value, setValue] = useState<any>('');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');

  const currentColumn = columns.find((c) => c.name === selectedField);

  useEffect(() => {
    if (columns.length > 0 && !selectedField) {
      setSelectedField(columns[0].name);
    }
  }, [columns, selectedField]);

  useEffect(() => {
    if (currentColumn) {
      switch (currentColumn.dataType) {
        case 'string':
          setOperator('contains');
          setValue('');
          break;
        case 'number':
          setOperator('gte');
          setValue('');
          break;
        case 'date':
          setOperator('after');
          setValue('');
          break;
        case 'boolean':
          setOperator('equals');
          setValue('true');
          break;
      }
    }
  }, [selectedField]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) return;

    let finalValue = value;
    if (operator === 'between') {
      finalValue = [minValue, maxValue];
    } else if (currentColumn?.dataType === 'boolean') {
      finalValue = value === 'true';
    }

    onAddFilter({
      field: selectedField,
      operator,
      value: finalValue,
    });

    onClose();
  };

  const getOperatorsForDataType = (dataType?: string): { label: string; value: FilterOperator }[] => {
    switch (dataType) {
      case 'string':
        return [
          { label: 'Contains', value: 'contains' },
          { label: 'Equals', value: 'equals' },
          { label: 'Not Equals', value: 'not_equals' },
          { label: 'Does Not Contain', value: 'not_contains' },
          { label: 'Starts With', value: 'starts_with' },
          { label: 'Ends With', value: 'ends_with' },
        ];
      case 'number':
        return [
          { label: 'Equals (=)', value: 'equals' },
          { label: 'Not Equals (≠)', value: 'not_equals' },
          { label: 'Greater Than (>)', value: 'gt' },
          { label: 'Greater Than or Equal (>=)', value: 'gte' },
          { label: 'Less Than (<)', value: 'lt' },
          { label: 'Less Than or Equal (<=)', value: 'lte' },
          { label: 'Between (Range)', value: 'between' },
        ];
      case 'date':
        return [
          { label: 'On Date', value: 'equals' },
          { label: 'After Date', value: 'after' },
          { label: 'Before Date', value: 'before' },
          { label: 'Between (Date Range)', value: 'between' },
        ];
      case 'boolean':
        return [
          { label: 'Is', value: 'equals' },
          { label: 'Is Not', value: 'not_equals' },
        ];
      default:
        return [{ label: 'Equals', value: 'equals' }];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Add Column Filter</h3>
              <p className="text-xs text-slate-400">Apply target condition to dataset</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Column Select */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Column</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.label} ({col.dataType})
                </option>
              ))}
            </select>
          </div>

          {/* Operator Select */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as FilterOperator)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {getOperatorsForDataType(currentColumn?.dataType).map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Inputs */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Value</label>

            {operator === 'between' ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type={currentColumn?.dataType === 'date' ? 'date' : 'number'}
                  placeholder="Min"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <input
                  type={currentColumn?.dataType === 'date' ? 'date' : 'number'}
                  placeholder="Max"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            ) : currentColumn?.dataType === 'boolean' ? (
              <select
                value={String(value)}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="true">Yes / True</option>
                <option value="false">No / False</option>
              </select>
            ) : (
              <input
                type={
                  currentColumn?.dataType === 'number'
                    ? 'number'
                    : currentColumn?.dataType === 'date'
                    ? 'date'
                    : 'text'
                }
                placeholder="Enter value..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-5 py-2 rounded-lg transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Apply Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
