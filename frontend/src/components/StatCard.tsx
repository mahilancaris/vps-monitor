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
      border: 'border-white/80 dark:border-cyan-800/40',
      iconBg: 'bg-sky-500/10 text-sky-600 dark:bg-cyan-500/15 dark:text-cyan-400 group-hover:bg-sky-500/20 group-hover:scale-110',
      bar: 'bg-gradient-to-r from-sky-400 to-cyan-500',
      glow: 'from-sky-400/15 to-transparent',
    },
    emerald: {
      border: 'border-white/80 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110',
      bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
      glow: 'from-emerald-400/15 to-transparent',
    },
    amber: {
      border: 'border-white/80 dark:border-amber-800/40',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-110',
      bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
      glow: 'from-amber-400/15 to-transparent',
    },
    rose: {
      border: 'border-white/80 dark:border-rose-800/40',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 group-hover:bg-rose-500/20 group-hover:scale-110',
      bar: 'bg-gradient-to-r from-rose-400 to-pink-500',
      glow: 'from-rose-400/15 to-transparent',
    },
    purple: {
      border: 'border-white/80 dark:border-purple-800/40',
      iconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-110',
      bar: 'bg-gradient-to-r from-purple-400 to-indigo-500',
      glow: 'from-purple-400/15 to-transparent',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className={`glass-panel glass-interactive p-4 sm:p-5 rounded-2xl relative overflow-hidden group`}>
      {/* Corner Ambient Glow Orb */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br ${scheme.glow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-extrabold mt-1 text-slate-900 dark:text-white font-mono tracking-tight">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg} transition-all duration-300 shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3 relative z-10">
          <div className="w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${scheme.bar} transition-all duration-700 rounded-full`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {subtext && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono flex items-center justify-between relative z-10">
          <span>{subtext}</span>
          {progress !== undefined && <span className="font-bold text-slate-700 dark:text-slate-300">{progress}%</span>}
        </p>
      )}
    </div>
  );
};
