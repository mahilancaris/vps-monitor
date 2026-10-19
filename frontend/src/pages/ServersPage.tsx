import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { useAuth } from '../context/AuthContext';
import { ServerCard } from '../components/ServerCard';
import { Modal } from '../components/Modal';
import { Server as ServerType } from '../types';
import { apiRequest } from '../services/api';
import {
  Plus,
  Server,
  Copy,
  Check,
  Terminal,
  ShieldAlert,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Home,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RotateCw
} from 'lucide-react';

interface ServersPageProps {
  onSelectServer: (server: ServerType) => void;
}

export const ServersPage: React.FC<ServersPageProps> = ({ onSelectServer }) => {
  const {
    filteredServers,
    refreshFleet,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    availableLocations,
    locationFilter,
    setLocationFilter,
    summary,
    isLoading
  } = useFleet();

  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Home');
  const [hostname, setHostname] = useState('');
  const [publicIp, setPublicIp] = useState('');
  const [privateIp, setPrivateIp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Generated Agent Token state after server creation
  const [generatedCred, setGeneratedCred] = useState<{ raw_token: string; server_id: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create Server
      const newServer = await apiRequest<ServerType>('/servers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          location,
          hostname: hostname || null,
          public_ip: publicIp || null,
          private_ip: privateIp || null
        })
      });

      // 2. Generate initial Agent Token
      const cred = await apiRequest<{ raw_token: string }>(`/servers/${newServer.id}/credentials`, {
        method: 'POST'
      });

      setGeneratedCred({ raw_token: cred.raw_token, server_id: newServer.id });
      refreshFleet();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInstallCommand = (token: string) => {
    const installCmd = `curl -sSL "${window.location.origin}/api/agent/install.sh" | sudo AGENT_TOKEN="${token}" API_URL="${window.location.origin}/api" bash`;
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
              SERVERS &amp; FLEET
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Server Fleet Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your Ubuntu home servers and Singapore/edge VPS nodes ({filteredServers.length} servers configured)
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={() => refreshFleet()}
            disabled={isLoading}
            className="p-2.5 rounded-2xl glass-panel-subtle text-slate-600 hover:text-slate-900 dark:text-slate-300 transition"
            title="Refresh Fleet"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setGeneratedCred(null);
                setName('');
                setHostname('');
                setPublicIp('');
                setPrivateIp('');
                setIsAddModalOpen(true);
              }}
              className="btn-gold-gradient inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll New Server</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">Total</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
            {summary?.total_servers || 0}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl">
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono">Online</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {summary?.online_servers || 0}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl">
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase font-mono">Delayed</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
            {summary?.delayed_servers || 0}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl">
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase font-mono">Offline</p>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
            {summary?.offline_servers || 0}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
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

        {/* Filter Pills + Location + View Toggle */}
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
          <div className="flex items-center p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs' : 'text-slate-500'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Servers Listing Area */}
      {filteredServers.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400">
          <Server className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No servers found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or enroll a new server to start monitoring.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServers.map((server) => (
            <ServerCard key={server.id} server={server} onClick={onSelectServer} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-sm overflow-x-auto">
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

      {/* Enroll Server Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={generatedCred ? 'Server Enrolled Successfully!' : 'Enroll New Server Node'}
      >
        {generatedCred ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/60 text-emerald-800 dark:text-emerald-300 text-xs">
              <p className="font-bold">Server enrolled in registry!</p>
              <p className="mt-1">Run the following command on your target Ubuntu server via SSH as root/sudo:</p>
            </div>

            <div className="relative">
              <pre className="p-3.5 bg-slate-900 text-amber-300 rounded-2xl text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all">
                {`curl -sSL "${window.location.origin}/api/agent/install.sh" | sudo AGENT_TOKEN="${generatedCred.raw_token}" API_URL="${window.location.origin}/api" bash`}
              </pre>
              <button
                onClick={() => copyInstallCommand(generatedCred.raw_token)}
                className="btn-gold-gradient absolute top-2 right-2 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn-gold-gradient px-4 py-2 rounded-2xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateServer} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-300/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                Server Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. singapore-vps-01, home-nuc-ubuntu"
                className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Tag
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Home, Singapore, AWS"
                  className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hostname (optional)
                </label>
                <input
                  type="text"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="vps01.cloud.local"
                  className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Public IP (optional)
                </label>
                <input
                  type="text"
                  value={publicIp}
                  onChange={(e) => setPublicIp(e.target.value)}
                  placeholder="51.79.221.130"
                  className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Private IP (optional)
                </label>
                <input
                  type="text"
                  value={privateIp}
                  onChange={(e) => setPrivateIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gold-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                {isSubmitting ? 'Enrolling...' : 'Generate Agent Script'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
