import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { IDatasetColumn, IDatasetRecord } from '../types/dataset';
import {
  formatDate,
  formatCurrency,
  formatPercent,
  isCurrencyField,
  isPercentField,
} from '../utils/formatters';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Check, X } from 'lucide-react';

interface DatasetTableProps {
  columns: IDatasetColumn[];
  records: IDatasetRecord[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  isLoading: boolean;
}

export const DatasetTable: React.FC<DatasetTableProps> = ({
  columns,
  records,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading,
}) => {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [showColToggle, setShowColToggle] = useState(false);

  // Dynamic Column Definitions
  const tableColumns = useMemo<ColumnDef<IDatasetRecord>[]>(() => {
    const cols: ColumnDef<IDatasetRecord>[] = [
      {
        id: 'rowNumber',
        accessorKey: 'rowNumber',
        header: '#',
        cell: (info) => <span className="text-slate-500 font-mono text-xs">{info.getValue<number>()}</span>,
      },
    ];

    columns.forEach((col) => {
      cols.push({
        id: col.name,
        accessorKey: col.name,
        header: col.label,
        cell: (info) => {
          const rawVal = info.getValue();
          if (rawVal === undefined || rawVal === null || rawVal === '') {
            return <span className="text-slate-600 font-italic text-xs">-</span>;
          }

          if (col.dataType === 'boolean') {
            const isTrue = Boolean(rawVal);
            return (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  isTrue
                    ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400'
                    : 'bg-rose-950/60 border-rose-800/40 text-rose-400'
                }`}
              >
                {isTrue ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {isTrue ? 'Yes' : 'No'}
              </span>
            );
          }

          if (col.dataType === 'date') {
            return <span className="text-slate-300 font-mono text-xs">{formatDate(rawVal)}</span>;
          }

          if (col.dataType === 'number') {
            if (isCurrencyField(col.name)) {
              return <span className="text-emerald-400 font-mono text-xs">{formatCurrency(rawVal)}</span>;
            }
            if (isPercentField(col.name)) {
              return <span className="text-blue-400 font-mono font-semibold text-xs">{formatPercent(rawVal)}</span>;
            }
            return <span className="text-slate-200 font-mono text-xs">{Number(rawVal).toLocaleString()}</span>;
          }

          return <span className="text-slate-200 text-xs font-medium">{String(rawVal)}</span>;
        },
      });
    });

    return cols;
  }, [columns]);

  const table = useReactTable({
    data: records,
    columns: tableColumns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="text-xs font-medium text-slate-400">
          Showing <span className="text-slate-200 font-bold">{records.length}</span> records
        </div>

        {/* Column Visibility Selector */}
        <div className="relative">
          <button
            onClick={() => setShowColToggle(!showColToggle)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg transition-colors border border-slate-700/60"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Columns</span>
          </button>

          {showColToggle && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-40 max-h-72 overflow-y-auto space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Toggle Columns
              </p>
              {table.getAllLeafColumns().map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="truncate">{column.id}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-md">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.id !== 'rowNumber';
                  const isSorted = sortBy === header.id;

                  return (
                    <th
                      key={header.id}
                      onClick={() => isSortable && onSortChange(header.id)}
                      className={`px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap select-none transition-colors ${
                        isSortable ? 'cursor-pointer hover:bg-slate-800/60 hover:text-white' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {isSortable && (
                          <span className="text-slate-500">
                            {isSorted ? (
                              sortOrder === 'desc' ? (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 hover:text-slate-300" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {table.getVisibleFlatColumns().map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-3">
                      <div className="h-4 bg-slate-800/60 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className="px-6 py-12 text-center text-slate-500 text-sm">
                  No records matching the current filters and search criteria.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-xs whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
