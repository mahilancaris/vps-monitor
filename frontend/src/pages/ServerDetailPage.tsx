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
  Check
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
        <RotateCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
        Loading server telemetry...
      </div>
    );
  }

  const latest = server.latest_metric;
  const isOnline = server.status === 'online';

  // Prepare chart points
  const cpuPoints = history.map(h => ({ timestamp: h.timestamp, value: h.cpu_percent }));
  const ramPoints = history.map(h => ({ timestamp: h.timestamp, value: h.ram_percent }));

  // Network IO aggregated points (KB/s)
  const netPoints = history.map(h => {
    let totalRate = 0;
    if (h.networks) {
      for (const n of h.networks) {
        totalRate += (n.tx_sec + n.rx_sec) / 1024;
      }
    }
    return { timestamp: h.timestamp, value: totalRate };
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition group"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Overview
        </button>

        {user?.role === 'admin' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setNewRawToken(null);
                setIsRotateModalOpen(true);
              }}
              className="inline-flex items-center space-x-1 text-xs font-mono text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 px-2.5 py-1.5 rounded-lg transition"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Rotate Agent Token</span>
            </button>
            <button
              onClick={handleDeleteServer}
              className="inline-flex items-center space-x-1 text-xs font-mono text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1.5 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Server Header Card */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {server.name}
              </h2>
              <span className="flex items-center text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <MapPin className="w-3 h-3 mr-1 text-cyan-600 dark:text-cyan-400" />
                {server.location}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              {server.os_info || 'Ubuntu Linux'} &bull; {server.cpu_model || 'Standard CPU'} ({server.cpu_cores} Cores)
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-mono border ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-400'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isOnline ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span className="font-bold uppercase tracking-wider">{server.status}</span>
            </div>
          </div>
        </div>

        {/* Specs Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Public IP</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{server.public_ip || 'None'}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Private / VPN IP</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{server.private_ip || 'None'}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Total RAM</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{((server.ram_total_mb || 0) / 1024).toFixed(1)} GB</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Last Heartbeat</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              {server.last_heartbeat ? new Date(server.last_heartbeat).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Temperature & Battery if available */}
        {(latest?.temperature_c || latest?.battery_percent !== null) && (
          <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs font-mono text-slate-600 dark:text-slate-300">
            {latest?.temperature_c && (
              <span className="flex items-center">
                <Thermometer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mr-1" />
                {latest.temperature_c.toFixed(1)} °C
              </span>
            )}
            {latest?.battery_percent !== null && latest?.battery_percent !== undefined && (
              <span className="flex items-center">
                <Battery className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                {latest.battery_percent.toFixed(0)}% {latest.battery_charging ? '(Charging)' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-2">
          {[
            { id: 'metrics', label: 'Metrics & Charts', icon: Cpu },
            { id: 'ports', label: `Open Ports (${server.listening_ports?.length || 0})`, icon: Shield },
            { id: 'disks', label: `Storage (${latest?.disks?.length || 0})`, icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition -mb-px ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Timeframe switcher for charts */}
        {activeTab === 'metrics' && (
          <div className="flex items-center space-x-1 pb-1">
            {(['1h', '6h', '24h'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                  timeframe === tf
                    ? 'bg-slate-900 dark:bg-slate-800 text-white dark:text-cyan-400 font-bold shadow-xs'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab: Metrics & Charts */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          <MetricChart
            title="CPU Utilization"
            unit="%"
            data={cpuPoints}
            color="cyan"
          />
          <MetricChart
            title="Memory (RAM) Footprint"
            unit="%"
            data={ramPoints}
            color="purple"
          />
          <MetricChart
            title="Total Network Throughput (Upload + Download)"
            unit=" KB/s"
            data={netPoints}
            color="emerald"
          />
        </div>
      )}

      {/* Tab: Open Ports & Security */}
      {activeTab === 'ports' && (
        <div className="space-y-3">
          <div className="p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 shadow-xs">
            <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1 flex items-center">
              <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mr-1.5" />
              Ubuntu Socket &amp; Listening Ports Inventory
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Safe inventory collected via local system socket inspection (<code>ss -lntup</code>).
              <strong> Important:</strong> A listening socket is not necessarily reachable from the public internet.
              Hardware firewalls, Ubuntu UFW, and cloud security groups may block external traffic.
            </p>
          </div>

          {server.listening_ports && server.listening_ports.length > 0 ? (
            <div className="space-y-2">
              {server.listening_ports.map((port) => (
                <PortBadge key={port.id} port={port} />
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500 font-mono shadow-xs">
              No listening ports detected on this server yet.
            </div>
          )}
        </div>
      )}

      {/* Tab: Disks Breakdown */}
      {activeTab === 'disks' && (
        <div className="space-y-3">
          {latest?.disks && latest.disks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {latest.disks.map((disk, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between font-mono text-xs mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{disk.mount_point}</span>
                    <span className="text-slate-500 dark:text-slate-400">{disk.filesystem || 'filesystem'}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        disk.percent_used > 90 ? 'bg-rose-500' : disk.percent_used > 75 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, disk.percent_used)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>{disk.used_gb} GB used of {disk.total_gb} GB</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{disk.percent_used}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500 font-mono shadow-xs">
              No disk partition metrics reported yet.
            </div>
          )}
        </div>
      )}

      {/* Rotate Agent Token Modal */}
      <Modal
        isOpen={isRotateModalOpen}
        onClose={() => setIsRotateModalOpen(false)}
        title="Rotate Server Agent Credential"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Rotating the credential creates a new token scoped exclusively to <strong>{server.name}</strong>.
            Existing tokens will remain valid until deleted or replaced in the agent's <code>/etc/fleet-agent/config.json</code>.
          </p>

          {!newRawToken ? (
            <button
              onClick={handleGenerateNewCredential}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
            >
              Generate New Agent Token
            </button>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-mono text-slate-600 dark:text-slate-400">New Secret Token</label>
              <div className="relative">
                <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-amber-700 dark:text-amber-300 break-all select-all pr-10">
                  {newRawToken}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newRawToken);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Update <code>/etc/fleet-agent/config.json</code> on the Ubuntu server and restart:
                <br />
                <code>sudo systemctl restart fleet-agent</code>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
