# Production Security Checklist

Before exposing VPS Fleet Monitor in a production environment, complete each item in this checklist:

- [ ] **Change Default Admin Password:**
  Never run with the default password. Update immediately upon first login in the Settings tab.
- [ ] **Generate High-Entropy SECRET_KEY:**
  Generate a unique 64-character hex secret using:
  ```bash
  openssl rand -hex 32
  ```
  Set this value as `SECRET_KEY` in `.env`.
- [ ] **Enforce TLS/HTTPS:**
  Ensure the dashboard and API are only accessible over valid HTTPS (Let's Encrypt via Caddy, Nginx, or Cloudflare). Plain HTTP transmits credentials in cleartext.
- [ ] **Enable Two-Factor Authentication (TOTP):**
  Turn on TOTP in the Settings page and register your authenticator app.
- [ ] **Restrict CORS Origins:**
  Do not leave `CORS_ORIGINS="*"` in production. Set explicit trusted domains, e.g., `https://monitor.yourdomain.com`.
- [ ] **Run Agent under Least Privilege:**
  The `fleet-agent.service` systemd unit must run as the unprivileged `fleet-agent` user with `NoNewPrivileges=true` and `ProtectSystem=strict`.
- [ ] **Never Store Server Root Passwords or SSH Keys:**
  VPS Fleet Monitor is designed to never hold private keys or root credentials. If any tool asks for SSH keys to monitor servers, do not use it.
- [ ] **Rotate Agent Tokens Periodically:**
  Use the "Rotate Agent Token" button in the server drilldown tab whenever a team member departs or a server is reprovisioned.
- [ ] **Review Audit Logs:**
  Periodically check `/api/audit` to review login attempts, server additions, and credential revocations.
- [ ] **Database Network Isolation:**
  Ensure PostgreSQL is only bound to `127.0.0.1` or the internal Docker bridge network (`fleet_network`). Never expose port `5432` to the public internet.
