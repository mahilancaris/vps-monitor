import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { useAuth } from '../context/AuthContext';
import { ServerCard } from '../components/ServerCard';
import { Server as ServerType } from '../types';
import {
  Server,
  Activity,
  Hourglass,
  WifiOff,
  Search,
  Filter,
  Cpu,
  Layers,
  HardDrive,
  Clock,
  RotateCw,
  Calendar,
  ChevronDown,
  MoreHorizontal,
  Home,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  LayoutGrid,
  List
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
    refreshFleet,
    isLoading
  } = useFleet();

  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [resourceTimeframe, setResourceTimeframe] = useState<'1H' | '6H' | '24H' | '7D'>('1H');
  const [selectedNodeFilter, setSelectedNodeFilter] = useState('All Nodes');

  // Real-time dynamic clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const timeZoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Percentage calculations
  const totalServers = summary?.total_servers || 0;
  const onlineServers = summary?.online_servers || 0;
  const delayedServers = summary?.delayed_servers || 0;
  const offlineServers = summary?.offline_servers || 0;

  const onlinePct = totalServers > 0 ? Math.round((onlineServers / totalServers) * 100) : 0;
  const delayedPct = totalServers > 0 ? Math.round((delayedServers / totalServers) * 100) : 0;
  const offlinePct = totalServers > 0 ? Math.round((offlineServers / totalServers) * 100) : 0;

  // Helper for Circular Progress Ring
  const CircularRing = ({ percentage, color }: { percentage: number; color: 'emerald' | 'amber' | 'rose' }) => {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const strokeColor = {
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#f43f5e'
    }[color];

    return (
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-14 h-14 transform -rotate-90">
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-slate-200/70 dark:text-slate-700/60"
            fill="transparent"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
          {percentage}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      {/* Top Greeting & Time Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
              DASHBOARD
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            {getGreeting()}, {user?.username || 'admin'} <span className="inline-block animate-bounce">👋</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor and manage your VPS fleet across Singapore and Home Ubuntu clusters.
          </p>
        </div>

        {/* Date & Refresh Box */}
        <div className="flex items-center space-x-3 self-start lg:self-auto">
          <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center space-x-3 shadow-xs">
            <div className="p-2 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {formattedDate}
              </div>
              <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                {formattedTime}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {timeZoneStr} (UTC +5:30)
              </div>
            </div>
          </div>

          <button
            onClick={() => refreshFleet()}
            disabled={isLoading}
            className="btn-gold-gradient px-4 py-3 rounded-2xl flex items-center space-x-2 text-xs font-bold shadow-md cursor-pointer select-none"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Servers */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">Total Servers</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">{totalServers}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Configured nodes</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 shadow-xs">
              <Server className="w-6 h-6" />
            </div>
          </div>
          {/* Subtle Watermark */}
          <Server className="w-20 h-20 text-slate-200/40 dark:text-slate-800/20 absolute -right-4 -bottom-4 pointer-events-none" />
        </div>

        {/* Online */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">Online</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">{onlineServers}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Healthy heartbeats</p>
            </div>
            <CircularRing percentage={onlinePct} color="emerald" />
          </div>
        </div>

        {/* Delayed */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">Delayed</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">{delayedServers}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Heartbeat &gt; 35s</p>
            </div>
            <CircularRing percentage={delayedPct} color="amber" />
          </div>
        </div>

        {/* Offline */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">Offline</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">{offlineServers}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Heartbeat &gt; 60s</p>
            </div>
            <CircularRing percentage={offlinePct} color="rose" />
          </div>
        </div>
      </div>

      {/* Middle Row: Resource Overview & Network Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resource Overview */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Resource Overview</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Aggregated fleet resource usage</p>
                </div>
              </div>

              {/* Timeframe selector pills */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/50">
                {(['1H', '6H', '24H', '7D'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setResourceTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      resourceTimeframe === tf
                        ? 'btn-gold-gradient shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Resource Metric Bars & Sparklines */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {/* CPU */}
              <div className="glass-panel-subtle p-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">CPU</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                    {summary?.overall_cpu_avg || 0}%
                  </span>
                </div>
                {/* Mini SVG Sparkline */}
                <svg className="w-full h-8 mt-1 overflow-visible" viewBox="0 0 100 30">
                  <path
                    d="M 0 25 Q 25 22, 50 18 T 100 12"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 0 25 Q 25 22, 50 18 T 100 12 L 100 30 L 0 30 Z"
                    fill="url(#gold-area)"
                    opacity="0.15"
                  />
                  <defs>
                    <linearGradient id="gold-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* RAM */}
              <div className="glass-panel-subtle p-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">RAM</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                    {((summary?.overall_ram_used_mb || 0) / 1024).toFixed(1)} / {((summary?.overall_ram_total_mb || 0) / 1024).toFixed(1)} GB
                  </span>
                </div>
                <svg className="w-full h-8 mt-1 overflow-visible" viewBox="0 0 100 30">
                  <path
                    d="M 0 28 L 100 28"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Storage */}
              <div className="glass-panel-subtle p-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <HardDrive className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Storage</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                    {summary?.overall_disk_used_gb || 0} / {summary?.overall_disk_total_gb || 0} GB
                  </span>
                </div>
                <svg className="w-full h-8 mt-1 overflow-visible" viewBox="0 0 100 30">
                  <path
                    d="M 0 28 L 100 28"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Network Traffic */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Network Traffic</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Total ingress and egress (All Nodes)</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-3 text-[10px] font-mono">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span className="text-slate-600 dark:text-slate-300">Download</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-300" />
                    <span className="text-slate-600 dark:text-slate-300">Upload</span>
                  </span>
                </div>

                <div className="relative">
                  <button className="px-2.5 py-1 rounded-xl glass-panel-subtle text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1 shadow-xs">
                    <span>{selectedNodeFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Network Sparkline Graph with Peak */}
            <div className="w-full h-24 relative mt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 80">
                {/* Horizontal reference lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="500" y2="50" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="currentColor" strokeOpacity="0.1" />

                {/* Download Traffic Curve with Spike */}
                <path
                  d="M 0 75 Q 50 74, 100 75 T 200 73 T 300 75 T 380 72 Q 400 20, 410 70 T 450 68 T 500 75"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Upload Traffic Curve */}
                <path
                  d="M 0 75 Q 80 74, 160 74 T 320 74 T 400 73 T 500 75"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  strokeDasharray="4 2"
                />
              </svg>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>12:30</span>
                <span>12:45</span>
                <span>13:00</span>
                <span>13:15</span>
                <span>13:30</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search servers by name, IP, hostname..."
            className="w-full glass-panel-subtle rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-sans transition-all"
          />
        </div>

        {/* Status Filter Buttons + Location Dropdown + View Toggle */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['All', 'Online', 'Delayed', 'Offline'].map((st) => {
            const isSelected = statusFilter.toLowerCase() === st.toLowerCase();
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'btn-gold-gradient font-bold scale-[1.02] shadow-sm'
                    : 'glass-panel-subtle text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            );
          })}

          {/* Location Filter Dropdown */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold glass-panel-subtle text-slate-700 dark:text-slate-300 border border-amber-100/60 dark:border-white/10 focus:outline-none cursor-pointer"
          >
            {availableLocations.map((loc) => (
              <option key={loc} value={loc} className="dark:bg-slate-900">
                {loc === 'all' ? 'All Locations' : loc}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 space-x-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs' : 'text-slate-500'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Monitored Nodes Section */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monitored Nodes ({filteredServers.length})
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                List of all monitored servers and their current status
              </p>
            </div>
          </div>
        </div>

        {filteredServers.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            <Server className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">No servers match the current filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map((server) => (
              <ServerCard key={server.id} server={server} onClick={onSelectServer} />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-amber-100/60 dark:border-white/5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Name / IP</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold">CPU</th>
                  <th className="pb-3 font-semibold">RAM</th>
                  <th className="pb-3 font-semibold">Disk</th>
                  <th className="pb-3 font-semibold">Uptime</th>
                  <th className="pb-3 font-semibold">Last Seen</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/40 dark:divide-white/5">
                {filteredServers.map((server, index) => {
                  const isOnline = server.status === 'online';
                  const isDelayed = server.status === 'delayed';
                  const metric = server.latest_metric;

                  return (
                    <tr
                      key={server.id}
                      onClick={() => onSelectServer(server)}
                      className="hover:bg-amber-500/5 dark:hover:bg-amber-400/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 font-mono text-slate-500">{index + 1}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          isOnline
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : isDelayed
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isOnline ? 'bg-emerald-500' : isDelayed ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {server.status === 'online' ? 'Online' : server.status === 'delayed' ? 'Delayed' : 'Offline'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{server.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{server.public_ip || server.private_ip || server.hostname || 'No IP'}</div>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                          <Home className="w-3 h-3 mr-1 text-slate-400" />
                          {server.location}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {metric ? `${metric.cpu_percent.toFixed(1)}%` : '0.0%'}
                      </td>
                      <td className="py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {metric ? `${metric.ram_percent.toFixed(1)}%` : '0.0%'}
                      </td>
                      <td className="py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {metric && metric.disks && metric.disks.length > 0
                          ? `${metric.disks[0].percent_used.toFixed(1)}%`
                          : '0.0%'}
                      </td>
                      <td className="py-3.5 font-mono text-slate-500">
                        {metric?.uptime_seconds ? `${Math.floor(metric.uptime_seconds / 86400)}d` : '-'}
                      </td>
                      <td className="py-3.5 font-mono text-slate-500 text-[11px]">
                        {server.last_heartbeat
                          ? new Date(server.last_heartbeat).toLocaleString([], {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectServer(server);
                          }}
                          className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
