import React from 'react';
import { Search, X } from 'lucide-react';

interface GlobalSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search records across text fields...',
}) => {
  return (
    <div className="relative flex-1 min-w-[240px]">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
