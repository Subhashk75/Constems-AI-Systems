import React from 'react';
import { IDatasetStatsResponse } from '../types/dataset';
import { Layers, Filter, Tag, Store, MapPin, TrendingUp } from 'lucide-react';

interface DatasetStatsProps {
  stats: IDatasetStatsResponse | undefined;
  isLoading: boolean;
}

export const DatasetStats: React.FC<DatasetStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const isFiltered = stats.filteredRecords !== stats.totalRecords;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total & Filtered Records */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Total Records</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.totalRecords.toLocaleString()}</h3>
            {isFiltered && (
              <span className="text-xs font-medium text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                {stats.filteredRecords.toLocaleString()} filtered
              </span>
            )}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* Unique Brands / Field 1 */}
      {stats.uniqueCounts.brand !== undefined && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Unique Brands</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{stats.uniqueCounts.brand}</h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Unique Stores / Field 2 */}
      {stats.uniqueCounts.store_name !== undefined && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Unique Stores</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{stats.uniqueCounts.store_name}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Store className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Average Metric / Field 3 */}
      {stats.numericStats.share_of_shelf_pct !== undefined && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Avg Share of Shelf</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">
              {stats.numericStats.share_of_shelf_pct.avg.toFixed(2)}%
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  );
};
