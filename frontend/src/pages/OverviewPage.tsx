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
      {/* Global Status Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border transition-all ${
          isAllOnline
            ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-800/40 text-emerald-200'
            : hasOffline
            ? 'bg-gradient-to-r from-rose-950/40 to-slate-900 border-rose-800/40 text-rose-200'
            : hasDelayed
            ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-800/40 text-amber-200'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl ${
                isAllOnline
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : hasOffline
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : hasDelayed
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isAllOnline ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : hasOffline ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                {isAllOnline
                  ? 'All Fleet Servers Operational'
                  : hasOffline
                  ? `${summary?.offline_servers} Server${summary?.offline_servers! > 1 ? 's' : ''} Offline!`
                  : hasDelayed
                  ? `${summary?.delayed_servers} Overdue Heartbeat${summary?.delayed_servers! > 1 ? 's' : ''}`
                  : 'VPS Fleet Monitor'}
              </h2>
              <p className="text-xs text-slate-400">
                Monitoring {summary?.total_servers || 0} nodes across Home and Edge regions
              </p>
            </div>
          </div>

          {summary?.active_alerts ? (
            <button
              onClick={() => onNavigate('alerts')}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition"
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
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Overall Fleet Resource Footprint
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fleet CPU */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span className="flex items-center"><Cpu className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Average CPU</span>
              <span className="font-bold text-slate-100">{summary?.overall_cpu_avg || 0}%</span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${summary?.overall_cpu_avg || 0}%` }}
              />
            </div>
          </div>

          {/* Fleet RAM */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span className="flex items-center"><Layers className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> RAM Used</span>
              <span className="font-bold text-slate-100">
                {((summary?.overall_ram_used_mb || 0) / 1024).toFixed(1)} / {((summary?.overall_ram_total_mb || 0) / 1024).toFixed(1)} GB
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${summary?.overall_ram_percent || 0}%` }}
              />
            </div>
          </div>

          {/* Fleet Storage */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span className="flex items-center"><HardDrive className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Storage Used</span>
              <span className="font-bold text-slate-100">
                {summary?.overall_disk_used_gb || 0} / {summary?.overall_disk_total_gb || 0} GB
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${summary?.overall_disk_percent || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Location Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search servers by name, IP, hostname..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
          />
        </div>

        {/* Location Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {availableLocations.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                locationFilter === loc
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Servers List Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">
            Monitored Nodes ({filteredServers.length})
          </h3>
          {summary?.last_updated && (
            <span className="text-[11px] text-slate-500 font-mono flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Updated {new Date(summary.last_updated).toLocaleTimeString()}
            </span>
          )}
        </div>

        {filteredServers.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <p className="text-sm">No servers match your current search or filters.</p>
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
