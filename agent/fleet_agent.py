#!/usr/bin/env python3
"""
VPS Fleet Monitor - Lightweight Ubuntu System Agent
Runs as a lightweight systemd daemon on Ubuntu 24.04 / 22.04 LTS servers.
Collects CPU, RAM, Disk, Network throughput, and safe listening ports (via ss -lntup).
Transmits metrics over secure TLS to the Fleet Monitor API.
"""

import os
import sys
import time
import json
import socket
import platform
import subprocess
import logging
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error
import ssl

try:
    import psutil
except ImportError:
    print("Error: 'psutil' is required. Run: sudo apt install python3-psutil or pip install psutil")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("fleet-agent")

class FleetAgent:
    def __init__(self, config_path: str = "/etc/fleet-agent/config.json"):
        self.config_path = config_path
        self.config = self.load_config()
        self.api_url = self.config.get("api_url", "https://monitor.example.com/api").rstrip("/")
        self.agent_token = self.config.get("agent_token", "")
        self.heartbeat_interval = int(self.config.get("heartbeat_interval", 15))
        self.metrics_interval = int(self.config.get("metrics_interval", 15))
        self.verify_ssl = bool(self.config.get("verify_ssl", True))

        # Network rate calculation state
        self.prev_net_io: Dict[str, Any] = {}
        self.prev_net_time: float = 0.0

        if not self.agent_token:
            logger.error(f"Missing 'agent_token' in configuration file: {config_path}")
            sys.exit(1)

    def load_config(self) -> Dict[str, Any]:
        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        # Check current working directory fallback for testing
        local_path = os.path.join(os.path.dirname(__file__), "config.json")
        if os.path.exists(local_path):
            with open(local_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def get_os_info(self) -> str:
        try:
            if os.path.exists("/etc/os-release"):
                with open("/etc/os-release") as f:
                    lines = f.readlines()
                info = {}
                for l in lines:
                    if "=" in l:
                        k, v = l.strip().split("=", 1)
                        info[k] = v.strip('"')
                pretty = info.get("PRETTY_NAME", platform.platform())
                return f"{pretty} ({platform.machine()})"
        except Exception:
            pass
        return f"{platform.system()} {platform.release()} ({platform.machine()})"

    def get_cpu_model(self) -> str:
        try:
            if os.path.exists("/proc/cpuinfo"):
                with open("/proc/cpuinfo") as f:
                    for line in f:
                        if "model name" in line:
                            return line.split(":", 1)[1].strip()
        except Exception:
            pass
        return platform.processor() or "Unknown CPU"

    def get_uptime_seconds(self) -> int:
        return int(time.time() - psutil.boot_time())

    def collect_listening_ports(self) -> List[Dict[str, Any]]:
        """
        Safely scans listening TCP and UDP ports using 'ss -lntup' if available,
        or falls back to safe psutil net_connections.
        Only extracts port numbers, protocol, and bind addresses.
        NEVER extracts environment variables, passwords, or process memory.
        """
        ports = []
        seen = set()

        # Try ss utility first (standard on Ubuntu)
        try:
            cmd = ["ss", "-lntup"]
            out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True, timeout=3)
            lines = out.strip().split("\n")
            # Headers: Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
            for line in lines[1:]:
                parts = line.split()
                if len(parts) < 5:
                    continue
                netid = parts[0].lower() # tcp or udp
                if "tcp" not in netid and "udp" not in netid:
                    continue
                protocol = "tcp" if "tcp" in netid else "udp"
                local_addr_str = parts[4]

                # Parse IP and Port (handles [::]:port or 0.0.0.0:port)
                if ":" in local_addr_str:
                    addr, port_str = local_addr_str.rsplit(":", 1)
                    addr = addr.strip("[]")
                    try:
                        port_num = int(port_str)
                    except ValueError:
                        continue

                    # Extract process name if present: users:(("sshd",pid=1024,fd=3))
                    proc_name = "unknown"
                    pid = None
                    if len(parts) >= 7 and "users:" in parts[6]:
                        u_str = parts[6]
                        if '"' in u_str:
                            proc_name = u_str.split('"')[1]
                        if "pid=" in u_str:
                            try:
                                pid = int(u_str.split("pid=")[1].split(",")[0])
                            except ValueError:
                                pass

                    key = (protocol, port_num, addr)
                    if key not in seen:
                        seen.add(key)
                        ports.append({
                            "port": port_num,
                            "protocol": protocol,
                            "address": addr,
                            "process_name": proc_name,
                            "pid": pid
                        })
            if ports:
                return ports
        except Exception:
            pass

        # Fallback to psutil
        try:
            conns = psutil.net_connections(kind="inet")
            for c in conns:
                if c.status == psutil.CONN_LISTEN:
                    proto = "tcp" if c.type == socket.SOCK_STREAM else "udp"
                    addr = c.laddr.ip
                    port_num = c.laddr.port
                    proc_name = "unknown"
                    if c.pid:
                        try:
                            proc_name = psutil.Process(c.pid).name()
                        except Exception:
                            pass
                    key = (proto, port_num, addr)
                    if key not in seen:
                        seen.add(key)
                        ports.append({
                            "port": port_num,
                            "protocol": proto,
                            "address": addr,
                            "process_name": proc_name,
                            "pid": c.pid
                        })
        except Exception:
            pass

        return ports

    def collect_metrics(self) -> Dict[str, Any]:
        now = time.time()
        cpu_p = psutil.cpu_percent(interval=0.5)
        load1, load5, load15 = (0.0, 0.0, 0.0)
        if hasattr(os, "getloadavg"):
            try:
                load1, load5, load15 = os.getloadavg()
            except Exception:
                pass

        vm = psutil.virtual_memory()
        swap = psutil.swap_memory()

        # Mount points / Disks
        disks = []
        total_disk_gb = 0.0
        seen_mounts = set()
        for p in psutil.disk_partitions(all=False):
            if p.mountpoint in seen_mounts:
                continue
            seen_mounts.add(p.mountpoint)
            try:
                du = psutil.disk_usage(p.mountpoint)
                tot_gb = round(du.total / (1024**3), 2)
                used_gb = round(du.used / (1024**3), 2)
                total_disk_gb += tot_gb
                disks.append({
                    "mount_point": p.mountpoint,
                    "filesystem": p.fstype,
                    "total_gb": tot_gb,
                    "used_gb": used_gb,
                    "percent_used": du.percent
                })
            except (PermissionError, FileNotFoundError):
                continue

        # Network throughput calculation
        net_io = psutil.net_io_counters(pernic=True)
        networks = []
        time_elapsed = max(0.001, now - self.prev_net_time) if self.prev_net_time > 0 else 0

        for iface, io in net_io.items():
            if iface.startswith("lo"):
                continue # Skip loopback
            tx_sec = 0.0
            rx_sec = 0.0
            if iface in self.prev_net_io and time_elapsed > 0:
                prev = self.prev_net_io[iface]
                tx_sec = max(0.0, (io.bytes_sent - prev.bytes_sent) / time_elapsed)
                rx_sec = max(0.0, (io.bytes_recv - prev.bytes_recv) / time_elapsed)

            networks.append({
                "interface": iface,
                "bytes_sent": float(io.bytes_sent),
                "bytes_recv": float(io.bytes_recv),
                "tx_sec": round(tx_sec, 2),
                "rx_sec": round(rx_sec, 2)
            })

        self.prev_net_io = net_io
        self.prev_net_time = now

        # Temperature
        temp_c = None
        if hasattr(psutil, "sensors_temperatures"):
            try:
                temps = psutil.sensors_temperatures()
                for name, entries in temps.items():
                    if entries:
                        temp_c = entries[0].current
                        break
            except Exception:
                pass

        # Battery
        battery_pct = None
        battery_chg = None
        if hasattr(psutil, "sensors_battery"):
            try:
                bat = psutil.sensors_battery()
                if bat:
                    battery_pct = bat.percent
                    battery_chg = bat.power_plugged
            except Exception:
                pass

        ports = self.collect_listening_ports()

        return {
            "agent_version": "1.0.0",
            "os_info": self.get_os_info(),
            "hostname": socket.gethostname(),
            "cpu_model": self.get_cpu_model(),
            "cpu_cores": psutil.cpu_count(logical=True) or 1,
            "ram_total_mb": int(vm.total / (1024 * 1024)),
            "disk_total_gb": round(total_disk_gb, 1),
            "cpu_percent": cpu_p,
            "load_1": round(load1, 2),
            "load_5": round(load5, 2),
            "load_15": round(load15, 2),
            "ram_used_mb": int(vm.used / (1024 * 1024)),
            "ram_percent": vm.percent,
            "swap_used_mb": int(swap.used / (1024 * 1024)),
            "swap_percent": swap.percent,
            "uptime_seconds": self.get_uptime_seconds(),
            "temperature_c": temp_c,
            "battery_percent": battery_pct,
            "battery_charging": battery_chg,
            "disks": disks,
            "networks": networks,
            "ports": ports
        }

    def send_post(self, endpoint: str, data: Dict[str, Any]) -> bool:
        url = f"{self.api_url}{endpoint}"
        payload = json.dumps(data).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "X-Server-Token": self.agent_token,
            "User-Agent": "VPSFleetAgent/1.0.0"
        }

        ctx = ssl.create_default_context()
        if not self.verify_ssl:
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=8) as response:
                return response.status in (200, 201)
        except urllib.error.HTTPError as e:
            logger.error(f"HTTP Error {e.code} posting to {url}: {e.reason}")
            return False
        except Exception as e:
            logger.error(f"Network error posting to {url}: {e}")
            return False

    def run(self):
        logger.info(f"VPS Fleet Agent started. Connecting to {self.api_url}")
        logger.info(f"Heartbeat interval: {self.heartbeat_interval}s. Hostname: {socket.gethostname()}")

        last_heartbeat = 0.0
        last_metric = 0.0

        while True:
            now = time.time()

            # Heartbeat check
            if now - last_heartbeat >= self.heartbeat_interval:
                hb_payload = {
                    "agent_version": "1.0.0",
                    "hostname": socket.gethostname(),
                    "os_info": self.get_os_info(),
                    "uptime_seconds": self.get_uptime_seconds()
                }
                success = self.send_post("/agent/heartbeat", hb_payload)
                if success:
                    last_heartbeat = now
                    logger.debug("Heartbeat transmitted successfully.")

            # Metrics check
            if now - last_metric >= self.metrics_interval:
                try:
                    metrics = self.collect_metrics()
                    success = self.send_post("/agent/metrics", metrics)
                    if success:
                        last_metric = now
                        logger.info(f"Metrics transmitted (CPU: {metrics['cpu_percent']}%, RAM: {metrics['ram_percent']}%, Ports: {len(metrics['ports'])})")
                except Exception as e:
                    logger.error(f"Error collecting or transmitting metrics: {e}")

            time.sleep(1)

if __name__ == "__main__":
    cfg_arg = sys.argv[1] if len(sys.argv) > 1 else "/etc/fleet-agent/config.json"
    agent = FleetAgent(config_path=cfg_arg)
    try:
        agent.run()
    except KeyboardInterrupt:
        logger.info("Agent stopped by SIGINT.")
