import React from 'react';
import { useFleet } from '../context/FleetContext';
import { ServerCard } from '../components/ServerCard';
import { StatCard } from '../components/StatCard';
import { Server as ServerType } from '../types';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Cpu,
  Layers,
  HardDrive,
  Clock
} from 'lucide-react';

interface OverviewPageProps {
  onSelectServer: (server: ServerType) => void;
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onSelectServer, onNavigate }) => {
  const {
    summary,
    filteredServers,
    availableLocations,
    locationFilter,
    setLocationFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    isPhoneOnline
  } = useFleet();

  // Overall Global Health Status
  const isAllOnline = summary && summary.offline_servers === 0 && summary.delayed_servers === 0 && summary.total_servers > 0;
  const hasOffline = summary && summary.offline_servers > 0;
  const hasDelayed = summary && summary.delayed_servers > 0 && !hasOffline;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Global Status Banner Hero */}
      <div
        className={`glass-panel rounded-3xl p-5 sm:p-6 relative overflow-hidden transition-all duration-300 ${
          isAllOnline
            ? 'border-emerald-300/60 dark:border-emerald-500/30'
            : hasOffline
            ? 'border-rose-300/60 dark:border-rose-500/30'
            : hasDelayed
            ? 'border-amber-300/60 dark:border-amber-500/30'
            : 'border-white/80 dark:border-white/10'
        }`}
      >
        {/* Ambient Hero Glow Aura */}
        <div
          className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-60 dark:opacity-40 transition-all duration-700 ${
            isAllOnline
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
              : hasOffline
              ? 'bg-gradient-to-br from-rose-500 to-red-600'
              : hasDelayed
              ? 'bg-gradient-to-br from-amber-400 to-orange-500'
              : 'bg-gradient-to-br from-sky-400 to-cyan-500'
          }`}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-2xl shadow-md transition-all duration-300 ${
                isAllOnline
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/20'
                  : hasOffline
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-rose-500/20 animate-pulse'
                  : hasDelayed
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-amber-500/20'
                  : 'bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {isAllOnline ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : hasOffline ? (
                <XCircle className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {isAllOnline
                    ? 'All Fleet Servers Operational'
                    : hasOffline
                    ? `${summary?.offline_servers} Server${summary?.offline_servers! > 1 ? 's' : ''} Offline!`
                    : hasDelayed
                    ? `${summary?.delayed_servers} Overdue Heartbeat${summary?.delayed_servers! > 1 ? 's' : ''}`
                    : 'VPS Fleet Monitor'}
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring {summary?.total_servers || 0} nodes across Singapore VPS &amp; Home Ubuntu clusters
              </p>
            </div>
          </div>

          {summary?.active_alerts ? (
            <button
              onClick={() => onNavigate('alerts')}
              className="px-4 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/50 text-rose-700 dark:text-rose-300 text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              {summary.active_alerts} Active Alert{summary.active_alerts > 1 ? 's' : ''}
            </button>
          ) : null}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Servers"
          value={summary?.total_servers || 0}
          icon={Server}
          color="cyan"
          subtext="Configured nodes"
        />
        <StatCard
          title="Online"
          value={summary?.online_servers || 0}
          icon={CheckCircle2}
          color="emerald"
          subtext="Healthy heartbeats"
          progress={summary?.total_servers ? Math.round((summary.online_servers / summary.total_servers) * 100) : 0}
        />
        <StatCard
          title="Delayed"
          value={summary?.delayed_servers || 0}
          icon={AlertTriangle}
          color="amber"
          subtext="Heartbeat > 35s"
        />
        <StatCard
          title="Offline"
          value={summary?.offline_servers || 0}
          icon={XCircle}
          color="rose"
          subtext="Heartbeat > 60s"
        />
      </div>

      {/* Resource Utilization Aggregates */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/3 w-72 h-72 bg-sky-400/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            Overall Fleet Resource Footprint
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Aggregated Telemetry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* Fleet CPU */}
          <div className="glass-panel-subtle p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300 mb-2.5">
              <span className="flex items-center font-medium"><Cpu className="w-4 h-4 mr-2 text-sky-600 dark:text-cyan-400" /> Average CPU</span>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">{summary?.overall_cpu_avg || 0}%</span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-cyan-500 rounded-full transition-all duration-700"
                style={{ width: `${summary?.overall_cpu_avg || 0}%` }}
              />
            </div>
          </div>

          {/* Fleet RAM */}
          <div className="glass-panel-subtle p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300 mb-2.5">
              <span className="flex items-center font-medium"><Layers className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" /> RAM Used</span>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                {((summary?.overall_ram_used_mb || 0) / 1024).toFixed(1)} / {((summary?.overall_ram_total_mb || 0) / 1024).toFixed(1)} GB
              </span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${summary?.overall_ram_percent || 0}%` }}
              />
            </div>
          </div>

          {/* Fleet Storage */}
          <div className="glass-panel-subtle p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300 mb-2.5">
              <span className="flex items-center font-medium"><HardDrive className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> Storage Used</span>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                {summary?.overall_disk_used_gb || 0} / {summary?.overall_disk_total_gb || 0} GB
              </span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${summary?.overall_disk_percent || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Location Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Glass Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search servers by name, IP, hostname..."
            className="w-full glass-panel-subtle rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 font-mono transition-all"
          />
        </div>

        {/* Glass Location Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {availableLocations.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                locationFilter === loc
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold shadow-md shadow-sky-500/25 scale-[1.03]'
                  : 'glass-panel-subtle text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Servers List Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Monitored Nodes ({filteredServers.length})
          </h3>
          {summary?.last_updated && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Updated {new Date(summary.last_updated).toLocaleTimeString()}
            </span>
          )}
        </div>

        {filteredServers.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm font-medium">No servers match your current search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onClick={onSelectServer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
