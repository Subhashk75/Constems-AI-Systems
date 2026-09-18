import React from 'react';
import { IPagination } from '../types/dataset';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  pagination: IPagination;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { page, limit, totalRecords, totalPages } = pagination;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2 text-xs text-slate-400">
      {/* Records Count Info */}
      <div>
        Showing <span className="font-semibold text-slate-200">{totalRecords > 0 ? startRecord : 0}</span> to{' '}
        <span className="font-semibold text-slate-200">{endRecord}</span> of{' '}
        <span className="font-semibold text-slate-200">{totalRecords.toLocaleString()}</span> entries
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {[10, 25, 50, 100, 250].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 disabled:hover:bg-slate-900 transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 disabled:hover:bg-slate-900 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 font-medium text-slate-200">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 disabled:hover:bg-slate-900 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 disabled:hover:bg-slate-900 transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
