export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'readonly';
  is_active: boolean;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiskMetric {
  mount_point: string;
  filesystem?: string;
  total_gb: number;
  used_gb: number;
  percent_used: number;
}

export interface NetworkMetric {
  interface: string;
  bytes_sent: number;
  bytes_recv: number;
  tx_sec: number;
  rx_sec: number;
}

export interface Metric {
  id: number;
  timestamp: string;
  cpu_percent: number;
  load_1: number;
  load_5: number;
  load_15: number;
  ram_used_mb: number;
  ram_percent: number;
  swap_used_mb: number;
  swap_percent: number;
  uptime_seconds: number;
  temperature_c?: number | null;
  battery_percent?: number | null;
  battery_charging?: boolean | null;
  disks: DiskMetric[];
  networks: NetworkMetric[];
}

export interface ListeningPort {
  id: number;
  port: number;
  protocol: 'tcp' | 'udp';
  address: string;
  process_name?: string;
  pid?: number | null;
  is_wildcard: boolean;
  is_public_facing: boolean;
  last_seen: string;
}

export type ServerStatusType = 'online' | 'delayed' | 'offline' | 'disabled';

export interface Server {
  id: number;
  name: string;
  location: string;
  hostname?: string;
  public_ip?: string;
  private_ip?: string;
  os_info?: string;
  status: ServerStatusType;
  last_heartbeat?: string;
  cpu_model?: string;
  cpu_cores: number;
  ram_total_mb: number;
  disk_total_gb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  latest_metric?: Metric;
  recent_metrics?: Metric[];
  listening_ports?: ListeningPort[];
  active_alerts_count?: number;
}

export interface Alert {
  id: number;
  server_id: number;
  server_name?: string;
  server_location?: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export interface FleetSummary {
  total_servers: number;
  online_servers: number;
  delayed_servers: number;
  offline_servers: number;
  overall_cpu_avg: number;
  overall_ram_used_mb: number;
  overall_ram_total_mb: number;
  overall_ram_percent: number;
  overall_disk_used_gb: number;
  overall_disk_total_gb: number;
  overall_disk_percent: number;
  active_alerts: number;
  last_updated: string;
}
