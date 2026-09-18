import React from 'react';
import { UploadCloud, AlertCircle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  onOpenUpload: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenUpload }) => {
  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center my-8">
      <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
        <UploadCloud className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-bold text-slate-100">No Datasets Uploaded</h3>
      <p className="text-sm text-slate-400 max-w-md mt-1 mb-6">
        Upload a CSV file to parse fields, build dynamic data tables, filter records, and inspect analytics.
      </p>
      <button
        onClick={onOpenUpload}
        className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
      >
        <UploadCloud className="w-4 h-4" /> Import CSV File
      </button>
    </div>
  );
};

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => {
  return (
    <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 flex items-center justify-between gap-4 my-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-white bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-700/50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
};
