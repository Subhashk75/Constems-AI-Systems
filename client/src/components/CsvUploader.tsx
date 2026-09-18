import React, { useState, useRef } from 'react';
import { IDataset } from '../types/dataset';
import { uploadCsvApi } from '../services/api';
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

interface CsvUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dataset: IDataset) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file type. Please select a valid .csv file.');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB maximum limit.');
      return;
    }
    setFile(selectedFile);
    if (!datasetName) {
      setDatasetName(selectedFile.name.replace(/\.csv$/i, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const dataset = await uploadCsvApi(file, datasetName, (progress) => {
        setUploadProgress(progress);
      });
      setIsUploading(false);
      onSuccess(dataset);
      onClose();
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || 'CSV processing failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Upload Dataset</h3>
              <p className="text-xs text-slate-400">Import CSV records for interactive analytics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-500/10'
              : file
              ? 'border-emerald-500/50 bg-emerald-950/20'
              : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                <FileText className="w-8 h-8" />
              </div>
              <p className="font-medium text-slate-200 text-sm">{file.name}</p>
              <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-1" />
              <p className="text-sm font-medium text-slate-200">
                Drag & drop your CSV file here, or <span className="text-blue-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500">Supports standard CSV files up to 50MB</p>
            </div>
          )}
        </div>

        {/* Dataset Name Input */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Dataset Name (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Shampoo Share of Shelf Audit"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> Processing and validating dataset...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/50 border border-red-800/40 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm px-5 py-2 rounded-lg transition-all shadow-lg shadow-blue-600/20"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Import Dataset
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
