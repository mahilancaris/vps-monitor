import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
  progress?: number; // 0 to 100
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'cyan',
  progress
}) => {
  const colorMap = {
    cyan: {
      bg: 'bg-white dark:bg-slate-900/60',
      border: 'border-slate-200/80 dark:border-cyan-800/40',
      iconBg: 'bg-sky-50 text-sky-600 dark:bg-cyan-500/10 dark:text-cyan-400',
      bar: 'bg-sky-500 dark:bg-cyan-500',
    },
    emerald: {
      bg: 'bg-white dark:bg-slate-900/60',
      border: 'border-slate-200/80 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
      bar: 'bg-emerald-500',
    },
    amber: {
      bg: 'bg-white dark:bg-slate-900/60',
      border: 'border-slate-200/80 dark:border-amber-800/40',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
      bar: 'bg-amber-500',
    },
    rose: {
      bg: 'bg-white dark:bg-slate-900/60',
      border: 'border-slate-200/80 dark:border-rose-800/40',
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
      bar: 'bg-rose-500',
    },
    purple: {
      bg: 'bg-white dark:bg-slate-900/60',
      border: 'border-slate-200/80 dark:border-purple-800/40',
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
      bar: 'bg-purple-500',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className={`p-4 rounded-2xl border ${scheme.border} ${scheme.bg} backdrop-blur-md relative overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${scheme.bar} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {subtext && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono flex items-center justify-between">
          <span>{subtext}</span>
          {progress !== undefined && <span className="font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>}
        </p>
      )}
    </div>
  );
};
