import asyncio
import os
import sys
from datetime import datetime, timedelta
import random

# Adjust path to find app package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.future import select
from app.database import AsyncSessionLocal, engine, Base
from app.config import settings
from app.models.models import (
    User, UserRole, Server, ServerStatus, AgentCredential,
    Metric, DiskMetric, NetworkMetric, ListeningPort, Alert, AlertSeverity, AlertStatus
)
from app.utils.security import hash_password, hash_agent_token

async def seed():
    print("[*] Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("[*] Checking admin user...")
        res = await db.execute(select(User).where(User.username == settings.FIRST_ADMIN_USERNAME))
        admin = res.scalar_one_or_none()
        if not admin:
            admin = User(
                username=settings.FIRST_ADMIN_USERNAME,
                email=settings.FIRST_ADMIN_EMAIL,
                hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                role=UserRole.ADMIN.value,
                is_active=True
            )
            db.add(admin)
            await db.commit()
            print(f"    [+] Created initial admin: {admin.username} / (configured password)")
        else:
            print(f"    [i] Admin '{admin.username}' already exists.")

        # Check servers
        res = await db.execute(select(Server))
        existing_servers = res.scalars().all()
        if existing_servers:
            print(f"    [i] Found {len(existing_servers)} existing servers. Skipping demo seed.")
            return

        print("[*] Seeding demo servers (Home & Singapore VPS)...")
        now = datetime.utcnow()

        server_specs = [
            {
                "name": "Home Server",
                "location": "Home",
                "hostname": "home-srv-ubuntu",
                "public_ip": "104.28.19.42",
                "private_ip": "192.168.1.100",
                "os_info": "Ubuntu 24.04.1 LTS (x86_64)",
                "status": ServerStatus.ONLINE.value,
                "last_heartbeat": now - timedelta(seconds=8),
                "cpu_model": "Intel(R) Core(TM) i7-12700 (12 Cores)",
                "cpu_cores": 12,
                "ram_total_mb": 32140,
                "disk_total_gb": 930.5,
                "token": "fleet_agent_home_secret_key_demo_token_12345"
            },
            {
                "name": "Singapore VPS",
                "location": "Singapore",
                "hostname": "sg-vps-edge-01",
                "public_ip": "139.180.201.88",
                "private_ip": "10.0.4.15",
                "os_info": "Ubuntu 24.04 LTS (aarch64)",
                "status": ServerStatus.ONLINE.value,
                "last_heartbeat": now - timedelta(seconds=12),
                "cpu_model": "Ampere Altra (4 vCPU)",
                "cpu_cores": 4,
                "ram_total_mb": 8192,
                "disk_total_gb": 160.0,
                "token": "fleet_agent_singapore_secret_key_demo_token_67890"
            },
            {
                "name": "Frankfurt VPS",
                "location": "Frankfurt",
                "hostname": "fra-backup-node",
                "public_ip": "45.155.170.12",
                "private_ip": "10.0.8.20",
                "os_info": "Ubuntu 22.04.4 LTS (x86_64)",
                "status": ServerStatus.DELAYED.value,
                "last_heartbeat": now - timedelta(seconds=45),
                "cpu_model": "AMD EPYC 7763 (2 vCPU)",
                "cpu_cores": 2,
                "ram_total_mb": 4096,
                "disk_total_gb": 80.0,
                "token": "fleet_agent_frankfurt_secret_key_demo_token_54321"
            }
        ]

        created_servers = []
        for s in server_specs:
            srv = Server(
                name=s["name"],
                location=s["location"],
                hostname=s["hostname"],
                public_ip=s["public_ip"],
                private_ip=s["private_ip"],
                os_info=s["os_info"],
                status=s["status"],
                last_heartbeat=s["last_heartbeat"],
                cpu_model=s["cpu_model"],
                cpu_cores=s["cpu_cores"],
                ram_total_mb=s["ram_total_mb"],
                disk_total_gb=s["disk_total_gb"]
            )
            db.add(srv)
            await db.flush()

            # Add Agent credential
            cred = AgentCredential(
                server_id=srv.id,
                token_hash=hash_agent_token(s["token"]),
                name=f"{srv.name} primary agent",
                is_active=True
            )
            db.add(cred)

            # Add Listening Ports
            if s["name"] == "Home Server":
                ports = [
                    (22, "tcp", "0.0.0.0", "sshd", 1024, True, True),
                    (80, "tcp", "0.0.0.0", "caddy", 1210, True, True),
                    (443, "tcp", "0.0.0.0", "caddy", 1210, True, True),
                    (8000, "tcp", "127.0.0.1", "python3 (fleet-api)", 4150, False, False),
                    (5432, "tcp", "127.0.0.1", "postgres", 1120, False, False)
                ]
            else:
                ports = [
                    (22, "tcp", "0.0.0.0", "sshd", 980, True, True),
                    (80, "tcp", "0.0.0.0", "nginx", 1045, True, True),
                    (443, "tcp", "0.0.0.0", "nginx", 1045, True, True),
                    (9100, "tcp", "127.0.0.1", "node_exporter", 2040, False, False)
                ]

            for p_num, proto, addr, proc, pid, wild, pub in ports:
                db.add(ListeningPort(
                    server_id=srv.id,
                    port=p_num,
                    protocol=proto,
                    address=addr,
                    process_name=proc,
                    pid=pid,
                    is_wildcard=wild,
                    is_public_facing=pub,
                    last_seen=now
                ))

            # Add 2 hours of metrics points (every 3 minutes = 40 points)
            base_cpu = 18.0 if "Home" in s["name"] else 32.0
            base_ram = 8200 if "Home" in s["name"] else 4100
            for i in range(40, -1, -1):
                m_time = now - timedelta(minutes=i * 3)
                cpu_jitter = random.uniform(-6.0, 10.0)
                cpu_p = max(5.0, min(95.0, base_cpu + cpu_jitter))
                ram_jitter = random.randint(-150, 250)
                ram_u = base_ram + ram_jitter
                ram_p = round((ram_u / s["ram_total_mb"]) * 100, 1)

                m = Metric(
                    server_id=srv.id,
                    timestamp=m_time,
                    cpu_percent=round(cpu_p, 1),
                    load_1=round(cpu_p / 25.0, 2),
                    load_5=round((cpu_p / 25.0) * 0.9, 2),
                    load_15=round((cpu_p / 25.0) * 0.85, 2),
                    ram_used_mb=ram_u,
                    ram_percent=ram_p,
                    swap_used_mb=120,
                    swap_percent=3.2,
                    uptime_seconds=86400 * 14 + (40 - i) * 180,
                    temperature_c=42.5 + random.uniform(-2, 3),
                    battery_percent=None,
                    battery_charging=None
                )
                db.add(m)
                await db.flush()

                # Add disk metrics
                db.add(DiskMetric(
                    metric_id=m.id,
                    server_id=srv.id,
                    mount_point="/",
                    filesystem="ext4",
                    total_gb=round(s["disk_total_gb"] * 0.6, 1),
                    used_gb=round(s["disk_total_gb"] * 0.28, 1),
                    percent_used=46.7,
                    timestamp=m_time
                ))
                db.add(DiskMetric(
                    metric_id=m.id,
                    server_id=srv.id,
                    mount_point="/var",
                    filesystem="ext4",
                    total_gb=round(s["disk_total_gb"] * 0.4, 1),
                    used_gb=round(s["disk_total_gb"] * 0.15, 1),
                    percent_used=37.5,
                    timestamp=m_time
                ))

                # Add network metrics
                db.add(NetworkMetric(
                    metric_id=m.id,
                    server_id=srv.id,
                    interface="eth0",
                    bytes_sent=1024 * 1024 * (500 + i * 10),
                    bytes_recv=1024 * 1024 * (1200 + i * 25),
                    tx_sec=float(random.randint(45000, 280000)),
                    rx_sec=float(random.randint(120000, 950000)),
                    timestamp=m_time
                ))

            # Add Demo Alert for Frankfurt
            if s["name"] == "Frankfurt VPS":
                db.add(Alert(
                    server_id=srv.id,
                    alert_type="server_delayed",
                    severity=AlertSeverity.WARNING.value,
                    title="Server Delayed: Frankfurt VPS",
                    message="Frankfurt VPS heartbeat delayed by 45s. Agent may be overloaded or network degraded.",
                    status=AlertStatus.ACTIVE.value,
                    triggered_at=now - timedelta(seconds=45)
                ))

            created_servers.append(srv)

        await db.commit()
        print(f"[+] Successfully seeded {len(created_servers)} servers with metrics, ports, credentials, and alerts.")

if __name__ == "__main__":
    asyncio.run(seed())
