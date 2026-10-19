import React from 'react';
import { Server as ServerType } from '../types';
import {
  MapPin,
  Cpu,
  HardDrive,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface ServerCardProps {
  server: ServerType;
  onClick: (server: ServerType) => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({ server, onClick }) => {
  const isOnline = server.status === 'online';
  const isDelayed = server.status === 'delayed';

  const statusColor = isOnline
    ? {
        border: 'border-white/80 dark:border-emerald-500/30',
        badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 shadow-xs shadow-emerald-500/10',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
        glow: 'from-emerald-400/10 to-transparent',
        label: 'Online'
      }
    : isDelayed
    ? {
        border: 'border-white/80 dark:border-amber-500/30',
        badge: 'bg-amber-500/10 text-amber-700 border-amber-300/60 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 shadow-xs shadow-amber-500/10',
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        glow: 'from-amber-400/10 to-transparent',
        label: 'Delayed'
      }
    : {
        border: 'border-white/80 dark:border-rose-500/30',
        badge: 'bg-rose-500/10 text-rose-700 border-rose-300/60 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 shadow-xs shadow-rose-500/10',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
        glow: 'from-rose-400/10 to-transparent',
        label: 'Offline'
      };

  const metric = server.latest_metric;
  const cpuPercent = metric ? metric.cpu_percent : 0;
  const ramPercent = metric ? metric.ram_percent : 0;

  // Primary disk partition percent
  const primaryDisk = metric && metric.disks && metric.disks.length > 0 ? metric.disks[0] : null;
  const diskPercent = primaryDisk ? primaryDisk.percent_used : 0;

  // Aggregate network rates
  let totalTx = 0;
  let totalRx = 0;
  if (metric && metric.networks) {
    for (const net of metric.networks) {
      totalTx += net.tx_sec;
      totalRx += net.rx_sec;
    }
  }

  const formatBytesSec = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
    return `${bytes.toFixed(0)} B/s`;
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '--';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    if (d > 0) return `${d}d ${h}h`;
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatLastSeen = (isoStr?: string) => {
    if (!isoStr) return 'Never';
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div
      onClick={() => onClick(server)}
      className="glass-panel glass-interactive rounded-2xl p-4 sm:p-5 cursor-pointer relative overflow-hidden group"
    >
      {/* Ambient Status Glow Orb */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${statusColor.glow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-cyan-400 transition-colors truncate">
              {server.name}
            </h3>
            <span className="flex items-center text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800/60 border border-white/60 dark:border-white/5 text-slate-700 dark:text-slate-300 font-medium backdrop-blur-xs">
              <MapPin className="w-3 h-3 mr-1 text-sky-500 dark:text-cyan-400 shrink-0" />
              {server.location}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 truncate">
            {server.hostname || server.public_ip || 'No IP registered'}
          </p>
        </div>

        {/* Status Pill */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${statusColor.badge}`}>
          <span className={`w-2 h-2 rounded-full ${statusColor.dot} ${isOnline ? 'animate-pulse' : ''}`} />
          <span>{statusColor.label}</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Metric Mini Bars */}
      <div className="mt-4 grid grid-cols-3 gap-2 relative z-10">
        {/* CPU */}
        <div className="glass-panel-subtle rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center font-medium"><Cpu className="w-3 h-3 mr-1 text-sky-600 dark:text-cyan-400" /> CPU</span>
            <span className="font-bold text-slate-900 dark:text-white">{cpuPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cpuPercent > 85 ? 'bg-gradient-to-r from-rose-500 to-red-600' : cpuPercent > 65 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-sky-400 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, cpuPercent)}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="glass-panel-subtle rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center font-medium"><Activity className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" /> RAM</span>
            <span className="font-bold text-slate-900 dark:text-white">{ramPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ramPercent > 90 ? 'bg-gradient-to-r from-rose-500 to-red-600' : ramPercent > 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-purple-400 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, ramPercent)}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="glass-panel-subtle rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center font-medium"><HardDrive className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Disk</span>
            <span className="font-bold text-slate-900 dark:text-white">{diskPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                diskPercent > 90 ? 'bg-gradient-to-r from-rose-500 to-red-600' : diskPercent > 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${Math.min(100, diskPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Info: Throughput, Uptime, Last Heartbeat */}
      <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono relative z-10">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-slate-800 dark:text-slate-300 font-medium">
            <ArrowUpRight className="w-3 h-3 text-sky-600 dark:text-cyan-400 mr-0.5" />
            {formatBytesSec(totalTx)}
          </span>
          <span className="flex items-center text-slate-800 dark:text-slate-300 font-medium">
            <ArrowDownLeft className="w-3 h-3 text-indigo-600 dark:text-indigo-400 mr-0.5" />
            {formatBytesSec(totalRx)}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {metric && (
            <span className="hidden sm:inline">
              Uptime: {formatUptime(metric.uptime_seconds)}
            </span>
          )}
          <span className="flex items-center text-slate-500 dark:text-slate-400" title="Last agent heartbeat">
            <Clock className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" />
            {formatLastSeen(server.last_heartbeat)}
          </span>
        </div>
      </div>
    </div>
  );
};
