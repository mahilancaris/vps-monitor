# VPS Fleet Monitor 🚀
### Mobile-First Multi-Server Infrastructure Monitoring Platform

A lightweight, production-grade monitoring application built specifically for developers and sysadmins who manage multiple Ubuntu servers (home servers, cloud VPS instances in Singapore, Frankfurt, etc.) and need a native-feeling Android PWA dashboard.

---

## 🌟 Key Features

- **📱 Mobile-First Native PWA:** Installable directly on Android phones via "Add to Home Screen" with offline app shell caching.
- **⚡ Zero App Store Friction:** Works without publishing to Google Play or hosting frontends separately. Optional Capacitor packaging for direct APK generation.
- **🛡️ Rock-Solid Security:**
  - Password hashing with **Argon2id**.
  - Short-lived JWT access tokens and secure refresh token handling.
  - Optional **TOTP Two-Factor Authentication** with QR code pairing.
  - Rate limiting with sliding-window algorithm and account lockout protection (5 failed logins -> 15 min lock).
  - Scoped agent credentials stored as SHA-256 hashes.
  - **Zero server secrets or SSH keys stored or transferred.**
- **⏱️ Precision Heartbeat Monitoring:**
  - Real-time 15s heartbeats with transition states: `Online` ➔ `Delayed (>35s)` ➔ `Offline (>60s)`.
  - Stale data detection: Unambiguous **"STALE DATA — PHONE OFFLINE"** banner when phone is disconnected.
- **🔍 Listening Ports & Security Auditing:** Safe local socket inspection via `ss -lntup` with clear distinction between localhost, private, and wildcard interfaces.
- **📈 Rich Telemetry:** Multi-core CPU utilization, load averages, RAM & swap, disk mount points (`/`, `/var`, etc.), and upload/download network throughput with interactive area charts.
- **🔔 Multi-Channel Alerting:** Instant push notifications via Telegram Bot and SMTP Email upon server heartbeat timeouts or threshold breaches.
- **🐧 Ubuntu 24.04 & 22.04 LTS Ready:** Hardened `systemd` agent service running under an unprivileged user (`fleet-agent`).

---

## 🏗️ Architecture

```
[ Monitored Ubuntu Servers ]             [ Central Monitoring Host ]            [ Android Phone ]
 Home Ubuntu  (15s push)  ──HTTPS──┐
 Singapore VPS (15s push)  ──HTTPS──┼──> [ FastAPI Backend + Postgres ] <──WSS/HTTPS──> [ PWA Dashboard ]
 Future Nodes (15s push)  ──HTTPS──┘         │
                                             └──> [ Telegram / SMTP Alerts ]
```

---

## 🚀 Quick Start (Docker Deployment)

### 1. Clone & Configure
```bash
git clone https://github.com/vps-fleet-monitor/vps-fleet-monitor.git
cd vps-fleet-monitor

cp .env.example .env
# Edit .env and replace SECRET_KEY and FIRST_ADMIN_PASSWORD
```

### 2. Launch Central Dashboard & Database
```bash
docker compose up -d
```
Access the dashboard at `http://<SERVER_IP>:8080`.
Default credentials (from your `.env`):
- Username: `admin`
- Password: (configured in `.env`)

---

## 🐧 Installing the Ubuntu Agent on Monitored Servers

1. Open the dashboard, go to the **Servers** tab, and click **"Enroll New Server"**.
2. Enter the friendly name (e.g. `Singapore VPS`) and location (`Singapore`).
3. Copy the one-line command and run it on your Ubuntu 24.04 server:
```bash
curl -sSL https://raw.githubusercontent.com/vps-fleet-monitor/agent/main/install-agent.sh | sudo AGENT_TOKEN="fleet_agent_..." API_URL="https://monitor.yourdomain.com/api" bash
```

The agent will automatically install as a secure `fleet-agent.service` systemd unit and start transmitting heartbeats every 15 seconds.

---

## 📁 Repository Structure

```
├── docker-compose.yml              # Complete Docker Compose stack (Postgres + Backend + Frontend)
├── .env.example                    # Environment variable template
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application & lifespan background evaluator
│   │   ├── config.py               # Pydantic Settings
│   │   ├── database.py             # Async SQLAlchemy session & engine
│   │   ├── models/                 # ORM models (users, servers, metrics, ports, alerts, audit)
│   │   ├── schemas/                # Pydantic validation schemas
│   │   ├── api/                    # REST & WebSocket route handlers
│   │   ├── services/               # Background heartbeat evaluator, alert dispatchers, WS manager
│   │   └── utils/                  # Argon2id hasher, JWT, TOTP 2FA, rate limiter
│   ├── migrations/                 # Alembic async migration versions
│   ├── scripts/
│   │   ├── seed_demo_data.py       # Seeds realistic Home & Singapore VPS demo metrics
│   │   └── prune_history.py        # 30-day metrics retention cleaner
│   └── tests/                      # Pytest unit and integration test suite
├── agent/
│   ├── fleet_agent.py              # Lightweight Ubuntu system agent
│   ├── fleet-agent.service         # Hardened least-privilege systemd unit
│   └── install-agent.sh            # Automated installer for Ubuntu 24.04 LTS
├── frontend/
│   ├── public/
│   │   ├── manifest.json           # Android PWA Web App Manifest
│   │   ├── sw.js                   # Service Worker for offline app shell
│   │   └── icons/                  # 192x192 & 512x512 PWA icons
│   ├── src/
│   │   ├── context/                # Auth, Theme, and Fleet state providers
│   │   ├── components/             # Mobile Navbar, BottomNav, StatCard, ServerCard, MetricChart, PortBadge
│   │   └── pages/                  # Overview, Servers, ServerDetail, Alerts, Settings, Login
├── docs/
│   ├── ARCHITECTURE.md             # System architecture & connectivity boundaries
│   ├── ANDROID_PWA_GUIDE.md        # Android installation & battery caveats
│   ├── CAPACITOR_BUILD.md          # Capacitor Android APK build guide
│   ├── FIREWALL_HTTPS_SETUP.md     # UFW, Caddy, Nginx, Let's Encrypt & Tailscale guide
│   ├── BACKUP_RESTORE.md           # PostgreSQL & SQLite backup and recovery
│   ├── SECURITY_CHECKLIST.md       # Pre-deployment security hardening checklist
│   └── TROUBLESHOOTING.md          # Diagnostics for common connectivity & agent issues
```

---

## 🧪 Running Tests Locally

```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate, On Linux: source venv/bin/activate
pip install -r requirements.txt
pytest
```

---

## 🔒 Security Note on Network Connectivity

The PWA dashboard shell runs offline on your Android phone, but **live monitoring inherently requires a route to the central monitoring API**.
To monitor your servers when away from home without exposing a public web port, deploy the monitoring dashboard on your Singapore VPS or connect your phone via **Tailscale** / **WireGuard** mesh VPN.
