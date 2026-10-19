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
      bg: 'bg-cyan-950/30',
      border: 'border-cyan-800/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      bar: 'bg-cyan-500',
    },
    emerald: {
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-800/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      bar: 'bg-emerald-500',
    },
    amber: {
      bg: 'bg-amber-950/30',
      border: 'border-amber-800/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      bar: 'bg-amber-500',
    },
    rose: {
      bg: 'bg-rose-950/30',
      border: 'border-rose-800/40',
      iconBg: 'bg-rose-500/10 text-rose-400',
      bar: 'bg-rose-500',
    },
    purple: {
      bg: 'bg-purple-950/30',
      border: 'border-purple-800/40',
      iconBg: 'bg-purple-500/10 text-purple-400',
      bar: 'bg-purple-500',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className={`p-4 rounded-2xl border ${scheme.border} ${scheme.bg} backdrop-blur-md relative overflow-hidden transition-all hover:scale-[1.01]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold mt-1 text-slate-100 font-mono tracking-tight">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${scheme.bar} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {subtext && (
        <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
          <span>{subtext}</span>
          {progress !== undefined && <span>{progress}%</span>}
        </p>
      )}
    </div>
  );
};
