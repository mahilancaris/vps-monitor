# Troubleshooting Guide

### 1. Agent shows "HTTP Error 401" in `journalctl -u fleet-agent`
- **Cause:** The agent token in `/etc/fleet-agent/config.json` does not match the token registered for that server in the database, or the credential was revoked.
- **Fix:** In the dashboard, click on the server, open the "Rotate Agent Token" modal, generate a fresh token, update `/etc/fleet-agent/config.json`, and restart the service:
  ```bash
  sudo systemctl restart fleet-agent
  ```

### 2. Dashboard shows "STALE DATA — PHONE OFFLINE"
- **Cause:** The phone's network connection dropped, or the phone cannot route to the central monitoring API endpoint.
- **Fix:**
  - Verify phone Wi-Fi or cellular connectivity.
  - If using Tailscale / WireGuard, ensure the VPN client is toggled "Connected" on Android.
  - Verify central API health by visiting `https://your-domain.com/api/system/health` in a browser.

### 3. Server status shows "Delayed" or "Offline" even though server is running
- **Cause:**
  - Outbound HTTPS traffic on port 443 is blocked by a firewall on the monitored server.
  - Agent service crashed or was stopped.
- **Diagnostics:**
  ```bash
  # Check if agent service is active
  sudo systemctl status fleet-agent

  # Inspect agent logs for HTTP/DNS errors
  sudo journalctl -u fleet-agent -n 50 --no-pager

  # Test connectivity from the monitored server to the central API
  curl -Iv https://monitor.yourdomain.com/api/system/health
  ```

### 4. TOTP 2FA code fails verification ("Invalid verification code")
- **Cause:** Time desynchronization between your phone and the monitoring server. TOTP requires accurate time within +/- 30 seconds.
- **Fix:** On your Ubuntu server, verify NTP time sync:
  ```bash
  timedatectl status
  sudo timedatectl set-ntp on
  ```
  On your Android phone, enable "Automatic Date & Time" in Settings.

### 5. Docker Backend container exits on startup
- **Cause:** Database migration failed or database was not ready.
- **Fix:**
  ```bash
  docker compose logs db
  docker compose logs backend
  ```
  Ensure `.env` contains valid credentials and matches `POSTGRES_USER` / `POSTGRES_PASSWORD`.
