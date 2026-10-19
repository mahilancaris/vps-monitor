import React, { useState, useEffect } from 'react';
import { Server as ServerType, Metric, ListeningPort, Alert } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFleet } from '../context/FleetContext';
import { MetricChart } from '../components/MetricChart';
import { PortBadge } from '../components/PortBadge';
import { Modal } from '../components/Modal';
import {
  ArrowLeft,
  Server,
  MapPin,
  Cpu,
  Layers,
  HardDrive,
  Network,
  Shield,
  Key,
  Trash2,
  Clock,
  Radio,
  Thermometer,
  Battery,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  Activity,
  Terminal,
  Home
} from 'lucide-react';

interface ServerDetailPageProps {
  serverId: number;
  onBack: () => void;
}

export const ServerDetailPage: React.FC<ServerDetailPageProps> = ({ serverId, onBack }) => {
  const { user } = useAuth();
  const { refreshFleet } = useFleet();

  const [server, setServer] = useState<ServerType | null>(null);
  const [history, setHistory] = useState<Metric[]>([]);
  const [timeframe, setTimeframe] = useState<'1h' | '6h' | '24h'>('1h');
  const [activeTab, setActiveTab] = useState<'metrics' | 'ports' | 'disks' | 'credentials'>('metrics');
  const [isLoading, setIsLoading] = useState(true);

  // Agent Token Rotation
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [newRawToken, setNewRawToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchServerDetail = async () => {
    try {
      const [srv, hist] = await Promise.all([
        apiRequest<ServerType>(`/servers/${serverId}`),
        apiRequest<Metric[]>(`/metrics/server/${serverId}/history?timeframe=${timeframe}`)
      ]);
      setServer(srv);
      setHistory(hist);
    } catch (e) {
      console.error('Failed to load server detail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServerDetail();
    const interval = setInterval(fetchServerDetail, 15000);
    return () => clearInterval(interval);
  }, [serverId, timeframe]);

  const handleGenerateNewCredential = async () => {
    try {
      const res = await apiRequest<{ raw_token: string }>(`/servers/${serverId}/credentials`, {
        method: 'POST'
      });
      setNewRawToken(res.raw_token);
    } catch (e: any) {
      alert(e.message || 'Failed to rotate credential');
    }
  };

  const handleDeleteServer = async () => {
    if (confirm(`Are you sure you want to remove server '${server?.name}'? All history will be deleted.`)) {
      try {
        await apiRequest(`/servers/${serverId}`, { method: 'DELETE' });
        refreshFleet();
        onBack();
      } catch (e: any) {
        alert(e.message || 'Failed to delete server');
      }
    }
  };

  if (isLoading || !server) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 font-mono text-xs">
        <RotateCw className="w-6 h-6 animate-spin text-amber-600 mb-2" />
        Loading server telemetry...
      </div>
    );
  }

  const isOnline = server.status === 'online';
  const isDelayed = server.status === 'delayed';
  const latestMetric = server.latest_metric;

  // Format historical series for charts
  const cpuData = history.map((h) => ({ timestamp: h.timestamp, value: h.cpu_percent }));
  const ramData = history.map((h) => ({ timestamp: h.timestamp, value: h.ram_percent }));

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl glass-panel-subtle text-slate-600 hover:text-slate-900 dark:text-slate-300 transition hover:scale-105 active:scale-95 shadow-xs"
            title="Back to fleet"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
                NODE TELEMETRY
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 mt-0.5">
              {server.name}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : isDelayed
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isOnline ? 'bg-emerald-500' : isDelayed ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                {server.status.toUpperCase()}
              </span>
            </h2>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => fetchServerDetail()}
            className="p-2.5 rounded-2xl glass-panel-subtle text-slate-600 hover:text-slate-900 dark:text-slate-300 transition"
            title="Refresh Node Metrics"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => {
                  setNewRawToken(null);
                  setIsRotateModalOpen(true);
                }}
                className="btn-gold-gradient px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Rotate Agent Key</span>
              </button>

              <button
                onClick={handleDeleteServer}
                className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-300/40 dark:border-rose-800/40 transition"
                title="Decommission Server"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Node Meta Specs Card */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Location &amp; Cluster</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-amber-600" />
              {server.location}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Public / Private IP</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
              {server.public_ip || server.private_ip || 'None'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Operating System</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
              {server.os_info || 'Ubuntu 24.04 LTS'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Uptime &amp; Last Heartbeat</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
              {latestMetric?.uptime_seconds ? `${Math.floor(latestMetric.uptime_seconds / 86400)}d ${Math.floor((latestMetric.uptime_seconds % 86400) / 3600)}h` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {[
            { id: 'metrics', label: 'Metrics History', icon: Activity },
            { id: 'ports', label: 'Open Ports', icon: Shield },
            { id: 'disks', label: 'Storage Partitions', icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'btn-gold-gradient shadow-md scale-[1.02]'
                    : 'glass-panel-subtle text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Timeframe selector when viewing metrics */}
        {activeTab === 'metrics' && (
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 self-start sm:self-auto">
            {(['1h', '6h', '24h'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                  timeframe === tf
                    ? 'btn-gold-gradient shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MetricChart
              title="CPU Load History"
              unit="%"
              data={cpuData}
              color="amber"
              height={180}
            />
            <MetricChart
              title="Memory Utilization"
              unit="%"
              data={ramData}
              color="purple"
              height={180}
            />
          </div>
        </div>
      )}

      {activeTab === 'ports' && (
        <div className="glass-panel rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Listening Network Ports</h3>
          <p className="text-xs text-slate-400 mb-4">Live listening sockets and services detected by fleet agent</p>

          {server.listening_ports && server.listening_ports.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {server.listening_ports.map((p: ListeningPort, idx: number) => (
                <PortBadge key={idx} port={p} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-mono">No open port telemetry received.</p>
          )}
        </div>
      )}

      {activeTab === 'disks' && (
        <div className="glass-panel rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Storage Partitions &amp; Mounts</h3>
          <p className="text-xs text-slate-400 mb-4">Filesystem capacity and partition utilization</p>

          {latestMetric?.disks && latestMetric.disks.length > 0 ? (
            <div className="space-y-4">
              {latestMetric.disks.map((d, idx) => (
                <div key={idx} className="glass-panel-subtle p-4 rounded-2xl">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{d.mount_point}</span>
                    <span className="text-slate-500">{d.used_gb} / {d.total_gb} GB ({d.percent_used}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                      style={{ width: `${d.percent_used}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-mono">No disk partition telemetry received.</p>
          )}
        </div>
      )}

      {/* Rotate Agent Key Modal */}
      <Modal
        isOpen={isRotateModalOpen}
        onClose={() => setIsRotateModalOpen(false)}
        title="Rotate Node Agent Token"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Generating a new agent token will invalidate the previous token for server '{server.name}'.
          </p>

          {newRawToken ? (
            <div className="space-y-3">
              <div className="relative">
                <pre className="p-3 bg-slate-900 text-amber-300 rounded-xl text-xs font-mono break-all select-all">
                  {newRawToken}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newRawToken);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="btn-gold-gradient absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-bold"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsRotateModalOpen(false)}
                  className="btn-gold-gradient px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsRotateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateNewCredential}
                className="btn-gold-gradient px-4 py-2 rounded-xl text-xs font-bold"
              >
                Generate Token
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
