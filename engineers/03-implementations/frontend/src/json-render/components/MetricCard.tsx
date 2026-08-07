import React from 'react';
import { useStateStore } from '@json-render/react';

export interface MetricCardProps {
  id?: string;
  label?: string;
  value?: any;
  unit?: string;
  required?: boolean;
}

export default function MetricCard({ props }: { props: MetricCardProps }) {
  const { label, value: rawValue, unit, required } = props || {};
  let store: any;
  try {
    store = useStateStore();
  } catch {
    store = null;
  }

  let displayValue = rawValue;
  if (store) {
    if (typeof rawValue === 'object' && rawValue !== null && '$bindState' in rawValue) {
      displayValue = store.get(rawValue.$bindState);
    } else if (typeof rawValue === 'string' && rawValue.startsWith('/')) {
      displayValue = store.get(rawValue);
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 sm:p-4 flex flex-col justify-between shadow-md">
      <div className="text-xs font-medium text-slate-400 flex items-center">
        <span>{label || 'Metric'}</span>
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </div>
      <div className="mt-1 flex items-baseline">
        <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {displayValue !== undefined && displayValue !== null && displayValue !== ''
            ? String(displayValue)
            : '0'}
        </span>
        {unit && <span className="ml-1 text-xs text-slate-400 font-normal">{unit}</span>}
      </div>
    </div>
  );
}
