import React from 'react';
import { useFleet } from '../context/FleetContext';
import {
  TrendingUp,
  Share2,
  HardDrive,
  FileText,
  Boxes,
  Layers,
  MapPin,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Server as ServerType } from '../types';

interface MonitoringViewsProps {
  view: string;
  onSelectServer?: (server: ServerType) => void;
}

export const MonitoringViews: React.FC<MonitoringViewsProps> = ({ view, onSelectServer }) => {
  const { filteredServers, summary } = useFleet();

  const renderViewContent = () => {
    switch (view) {
      case 'metrics':
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
                TELEMETRY &amp; GAUGES
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Fleet System Metrics
              </h2>
              <p className="text-xs text-slate-500 mt-1">Aggregated CPU, RAM and Load across all active nodes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-5 rounded-3xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                  <span className="font-bold flex items-center gap-1.5"><Cpu className="w-4 h-4 text-amber-600" /> Average CPU</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">{summary?.overall_cpu_avg || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="h-full btn-gold-gradient rounded-full" style={{ width: `${summary?.overall_cpu_avg || 0}%` }} />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-3xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                  <span className="font-bold flex items-center gap-1.5"><Layers className="w-4 h-4 text-purple-600" /> RAM Used</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">{((summary?.overall_ram_used_mb || 0) / 1024).toFixed(1)} GB</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${summary?.overall_ram_percent || 0}%` }} />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-3xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                  <span className="font-bold flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-emerald-600" /> Storage Used</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">{summary?.overall_disk_used_gb || 0} GB</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${summary?.overall_disk_percent || 0}%` }} />
                </div>
              </div>
            </div>

            {/* Per-Node Live Metric Table */}
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Node Metrics Breakdown</h3>
              <div className="space-y-3">
                {filteredServers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectServer && onSelectServer(s)}
                    className="glass-panel-subtle p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:scale-[1.01] transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{s.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{s.public_ip || s.hostname || 'No IP'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-xs font-mono">
                      <div>CPU: <span className="font-bold text-amber-700 dark:text-amber-400">{s.latest_metric ? `${s.latest_metric.cpu_percent.toFixed(1)}%` : '0%'}</span></div>
                      <div>RAM: <span className="font-bold text-purple-600">{s.latest_metric ? `${s.latest_metric.ram_percent.toFixed(1)}%` : '0%'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
                BANDWIDTH &amp; TRAFFIC
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Fleet Network Ingress / Egress
              </h2>
              <p className="text-xs text-slate-500 mt-1">Real-time socket rates, ingress, and egress transmission</p>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Node Interfaces</h3>
                <div className="flex items-center space-x-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-600" /> TX (Egress)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> RX (Ingress)</span>
                </div>
              </div>

              <div className="space-y-3">
                {filteredServers.map((s) => (
                  <div key={s.id} className="glass-panel-subtle p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400">{s.location} Cluster</div>
                    </div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      Active Telemetry Streaming
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
                FILESYSTEMS &amp; VOLUMES
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Fleet Storage Volumes
              </h2>
              <p className="text-xs text-slate-500 mt-1">Mounted partitions, NVMe/SSD wear, and volume capacity</p>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <div className="space-y-4">
                {filteredServers.map((s) => {
                  const disks = s.latest_metric?.disks || [];
                  return (
                    <div key={s.id} className="glass-panel-subtle p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{s.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{disks.length} Partition(s)</span>
                      </div>
                      {disks.length > 0 ? (
                        disks.map((d, i) => (
                          <div key={i} className="mt-2 text-xs font-mono">
                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                              <span>{d.mount_point}</span>
                              <span>{d.used_gb} / {d.total_gb} GB ({d.percent_used}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div className="h-full btn-gold-gradient rounded-full" style={{ width: `${d.percent_used}%` }} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400">Telemetry reporting in progress</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'logs':
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
                SYSTEM &amp; AUDIT TRAIL
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Real-Time Event Logs
              </h2>
              <p className="text-xs text-slate-500 mt-1">Audit log records of server logins, heartbeats, and threshold alerts</p>
            </div>

            <div className="glass-panel rounded-3xl p-5 sm:p-6 font-mono text-xs">
              <div className="p-4 bg-slate-900/90 text-amber-300 rounded-2xl space-y-2 max-h-[400px] overflow-y-auto">
                <div>[SYSTEM] Fleet Controller started on 0.0.0.0:8000</div>
                <div>[AUTH] Admin authenticated successfully (JWT session issued)</div>
                <div>[AGENT] Heartbeat evaluation check: {summary?.total_servers || 0} registered server(s)</div>
                <div>[STATUS] Fleet operational health check completed</div>
              </div>
            </div>
          </div>
        );

      case 'nodes':
      case 'clusters':
      case 'locations':
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
                INFRASTRUCTURE TOPOLOGY
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {view.charAt(0).toUpperCase() + view.slice(1)} Fleet Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-1">Multi-location cluster nodes and edge infrastructure</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServers.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectServer && onSelectServer(s)}
                  className="glass-panel glass-interactive p-5 rounded-3xl cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100/70 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                      {s.location} Cluster
                    </span>
                    <span className={`w-2 h-2 rounded-full ${s.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">{s.name}</h4>
                  <p className="text-xs font-mono text-slate-400 mt-1">{s.public_ip || s.hostname || 'Local IP'}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="pb-24 md:pb-10">{renderViewContent()}</div>;
};
