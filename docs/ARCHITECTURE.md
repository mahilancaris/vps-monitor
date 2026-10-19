# VPS Fleet Monitor — System Architecture & Security Boundaries

## 1. System Overview

**VPS Fleet Monitor** is a multi-server infrastructure monitoring system designed for mobile-first operation. It allows monitoring heterogeneous Linux servers (e.g. an Ubuntu home server, a cloud VPS in Singapore, and arbitrary future edge nodes) from a single progressive web app (PWA) installed on an Android device.

```
+-------------------------------------------------------------------------+
|                        ANDROID PHONE / CLIENT                           |
|  - Standalone PWA (Vite + React + Tailwind) / Optional Capacitor APK    |
|  - Offline Shell & Cache with "STALE DATA — PHONE OFFLINE" Banner       |
+-------------------------------------------------------------------------+
                                    │
                                    │ HTTPS / WSS
                                    ▼
+-------------------------------------------------------------------------+
|                    CENTRAL MONITORING BACKEND (API)                     |
|  - FastAPI (Python 3.11+)                                               |
|  - Argon2id Password Hashing & Short-Lived JWT + Refresh Tokens         |
|  - TOTP Two-Factor Authentication                                       |
|  - Central Evaluator Loop (Transitions: Online -> Delayed -> Offline)   |
|  - Alert Dispatcher (Telegram Bot & SMTP Email)                         |
|  - PostgreSQL Database (with SQLite local-dev support)                  |
+-------------------------------------------------------------------------+
             ▲                                             ▲
             │ HTTPS (X-Server-Token)                      │ HTTPS (X-Server-Token)
             │ Heartbeat (15s)                             │ Heartbeat (15s)
             │                                             │
+----------------------------+              +-----------------------------+
|    HOME UBUNTU SERVER      |              |        SINGAPORE VPS        |
|  - Ubuntu 24.04.1 LTS      |              |  - Ubuntu 24.04 LTS         |
|  - Systemd 'fleet-agent'   |              |  - Systemd 'fleet-agent'    |
|  - Least Privilege User    |              |  - Least Privilege User     |
|  - psutil & ss -lntup      |              |  - psutil & ss -lntup       |
+----------------------------+              +-----------------------------+
```

---

## 2. Fundamental Connectivity Limitation Explained

> [!IMPORTANT]
> **Dashboard Location vs. Network Reachability**
>
> 1. The PWA dashboard can be installed locally on your Android phone and cached offline by the browser service worker.
> 2. **However, live telemetric monitoring inherently requires network connectivity between your phone and the monitoring endpoint.**
> 3. If the monitoring backend is hosted inside your home server behind a residential NAT without a public IP:
>    - Your phone will monitor servers while on Home Wi-Fi.
>    - To monitor remotely while traveling (cellular or public Wi-Fi), you must connect your phone via a secure private mesh VPN like **WireGuard** or **Tailscale**, OR deploy the central backend onto your Singapore VPS with a public domain and HTTPS certificate.
> 4. When your phone has no internet connection, the app displays a prominent **"STALE DATA — PHONE OFFLINE"** banner showing the exact cached timestamp. Stale data is never represented as live telemetry.

---

## 3. Server Heartbeat State Machine

```
              Heartbeat arrives within 15s
                     +-----------+
                     |           |
                     v           |
               +-------------+   |
               |   ONLINE    |---+
               +-------------+
                      │
                      │ Overdue > 35s
                      v
               +-------------+
               |   DELAYED   | ---> Triggers WARNING Alert
               +-------------+
                      │
                      │ Overdue > 60s
                      v
               +-------------+
               |   OFFLINE   | ---> Triggers CRITICAL Alert
               +-------------+
```

- **Interval:** 15 seconds by default (configurable).
- **Delayed Threshold:** 35 seconds. Server is marked amber.
- **Offline Threshold:** 60 seconds. Server is marked red, triggering Telegram/Email notification.
- **Auto-Recovery:** When an agent heartbeat is received, the server automatically returns to `ONLINE` status, and any active offline/delayed alerts are marked `RESOLVED`.

---

## 4. Security Boundaries & Credential Isolation

1. **No SSH Keys or Secrets on Central Dashboard:**
   The dashboard never stores, requires, or handles SSH keys, SSH passwords, root credentials, or server configuration files.
2. **Push-Based Architecture (Agent to API):**
   Monitored servers initiate outbound HTTPS requests to the central monitoring API. The API never opens inbound shell connections into monitored servers. This prevents firewall port forwarding holes on your home server.
3. **Scoped Agent Tokens:**
   Each monitored server has its own unique, randomly generated 32-byte agent token (e.g., `fleet_agent_...`).
   Tokens are stored in the database hashed using **SHA-256**. The raw token is only visible to the administrator once upon creation. If a server is compromised, revoking its token has zero impact on other servers.
4. **Least-Privilege Agent Service:**
   The `fleet-agent` daemon runs as a dedicated system user (`fleet-agent`), bounded by systemd security primitives (`ProtectSystem=strict`, `NoNewPrivileges=true`, `PrivateTmp=true`).
5. **Listening Ports vs. Public Reachability:**
   Local socket scanning uses `ss -lntup`. Sockets listening on `0.0.0.0` or `::` are flagged as **Wildcard Interface** with a warning that reaching them depends on external firewalls, router port forwards, or cloud security groups.
