import React from 'react';
import { IDataset } from '../types/dataset';
import { Database, Upload, Trash2, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

interface HeaderProps {
  datasets: IDataset[];
  selectedDataset: IDataset | null;
  onSelectDataset: (id: string) => void;
  onOpenUpload: () => void;
  onDeleteDataset: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  onOpenUpload,
  onDeleteDataset,
}) => {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-white">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CSV Data Explorer
            </h1>
            <p className="text-xs text-slate-400">Production MERN Stack Data Management Engine</p>
          </div>
        </div>

        {/* Dataset Actions & Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Dataset Selector Dropdown */}
          <div className="relative min-w-[220px] flex-1 md:flex-initial">
            <select
              value={selectedDataset?._id || ''}
              onChange={(e) => e.target.value && onSelectDataset(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer pr-8"
            >
              {datasets.length === 0 ? (
                <option value="">No datasets available</option>
              ) : (
                datasets.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.rowCount.toLocaleString()} rows)
                  </option>
                ))
              )}
            </select>
            <Database className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Delete Dataset Button */}
          {selectedDataset && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete dataset "${selectedDataset.name}"?`)) {
                  onDeleteDataset(selectedDataset._id);
                }
              }}
              title="Delete Dataset"
              className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-lg shadow-blue-600/25 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Dataset Metadata Bar */}
      {selectedDataset && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-300">{selectedDataset.originalFilename}</span>
            <span>Size: {formatFileSize(selectedDataset.fileSize)}</span>
            <span>Columns: {selectedDataset.columns.length}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/30">
              <CheckCircle className="w-3.5 h-3.5" />
              {selectedDataset.validRowCount.toLocaleString()} Valid Rows
            </span>
            {selectedDataset.invalidRowCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                {selectedDataset.invalidRowCount.toLocaleString()} Invalid Rows
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
