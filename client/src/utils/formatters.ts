import { format, parseISO } from 'date-fns';

export function formatDate(val: any): string {
  if (!val) return '-';
  try {
    const dateObj = typeof val === 'string' ? parseISO(val) : new Date(val);
    if (isNaN(dateObj.getTime())) return String(val);
    return format(dateObj, 'dd-MMM-yyyy');
  } catch (_) {
    return String(val);
  }
}

export function formatCurrency(val: any, symbol: string = '₹'): string {
  if (val === undefined || val === null || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(val: any): string {
  if (val === undefined || val === null || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `${num.toFixed(2)}%`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatLabel(columnName: string): string {
  return columnName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isCurrencyField(fieldName: string): boolean {
  return /price|cost|amount|revenue|total/i.test(fieldName);
}

export function isPercentField(fieldName: string): boolean {
  return /pct|percent|percentage|share|ratio|rate/i.test(fieldName);
}
