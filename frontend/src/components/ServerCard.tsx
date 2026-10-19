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
        border: 'border-slate-200/80 hover:border-emerald-400 dark:border-emerald-500/30 dark:hover:border-emerald-500/60',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
        dot: 'bg-emerald-500 shadow-emerald-500/50',
        label: 'Online'
      }
    : isDelayed
    ? {
        border: 'border-slate-200/80 hover:border-amber-400 dark:border-amber-500/30 dark:hover:border-amber-500/60',
        badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
        dot: 'bg-amber-500 shadow-amber-500/50',
        label: 'Delayed'
      }
    : {
        border: 'border-slate-200/80 hover:border-rose-400 dark:border-rose-500/30 dark:hover:border-rose-500/60',
        badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800',
        dot: 'bg-rose-500 shadow-rose-500/50',
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
      className={`bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border ${statusColor.border} p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg active:scale-[0.99] group`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-cyan-400 transition-colors truncate">
              {server.name}
            </h3>
            <span className="flex items-center text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <MapPin className="w-3 h-3 mr-1 text-sky-500 dark:text-cyan-400 shrink-0" />
              {server.location}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
            {server.hostname || server.public_ip || 'No IP registered'}
          </p>
        </div>

        {/* Status Pill */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor.badge}`}>
          <span className={`w-2 h-2 rounded-full ${statusColor.dot} ${isOnline ? 'animate-pulse' : ''}`} />
          <span>{statusColor.label}</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Metric Mini Bars */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {/* CPU */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-200/60 dark:border-slate-700/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center"><Cpu className="w-3 h-3 mr-1 text-sky-500 dark:text-cyan-400" /> CPU</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{cpuPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                cpuPercent > 85 ? 'bg-rose-500' : cpuPercent > 65 ? 'bg-amber-400' : 'bg-sky-500 dark:bg-cyan-500'
              }`}
              style={{ width: `${Math.min(100, cpuPercent)}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-200/60 dark:border-slate-700/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center"><Activity className="w-3 h-3 mr-1 text-purple-500 dark:text-purple-400" /> RAM</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{ramPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                ramPercent > 90 ? 'bg-rose-500' : ramPercent > 75 ? 'bg-amber-400' : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(100, ramPercent)}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-200/60 dark:border-slate-700/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center"><HardDrive className="w-3 h-3 mr-1 text-emerald-500 dark:text-emerald-400" /> Disk</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{diskPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                diskPercent > 90 ? 'bg-rose-500' : diskPercent > 75 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, diskPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Info: Throughput, Uptime, Last Heartbeat */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-slate-700 dark:text-slate-300">
            <ArrowUpRight className="w-3 h-3 text-sky-500 dark:text-cyan-400 mr-0.5" />
            {formatBytesSec(totalTx)}
          </span>
          <span className="flex items-center text-slate-700 dark:text-slate-300">
            <ArrowDownLeft className="w-3 h-3 text-indigo-500 dark:text-indigo-400 mr-0.5" />
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
