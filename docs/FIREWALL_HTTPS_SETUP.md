# Firewall, HTTPS, and Reverse Proxy Setup Guide (Ubuntu 24.04 LTS)

This guide provides step-by-step instructions to configure Ubuntu 24.04 LTS for VPS Fleet Monitor, whether deploying publicly with automated Let's Encrypt certificates or privately over Tailscale/WireGuard.

---

## 1. Safety First: Detect Existing Web Servers

Before installing or altering any web server, inspect whether Apache, Nginx, or Caddy is already active on your server:

```bash
# Check status of common web servers
systemctl is-active nginx apache2 caddy 2>/dev/null || true

# Check what is currently listening on ports 80 and 443
sudo ss -lntup | grep -E ':(80|443)\s'
```

- **If you already run Nginx:** Add a server block for `monitor.yourdomain.com` without touching existing virtual hosts (see Section 3B).
- **If you already run Apache:** Enable `mod_proxy` and `mod_proxy_wstunnel` and configure a VirtualHost (see Section 3C).
- **If no web server is running:** We recommend **Caddy** for zero-configuration, automated Let's Encrypt TLS (see Section 3A).

---

## 2. Configure Ubuntu UFW Firewall

On Ubuntu 24.04 LTS, ensure your SSH port is allowed **before** enabling UFW to prevent accidental lockout:

```bash
# 1. Allow OpenSSH (critical)
sudo ufw allow OpenSSH

# 2. Allow HTTP and HTTPS for web access
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 3. Enable UFW
sudo ufw enable
sudo ufw status verbose
```

---

## 3. Reverse Proxy & TLS Configuration

### Option A: Caddy (Recommended for New Setups)
Caddy automatically provisions, verifies, and renews Let's Encrypt TLS certificates.

1. Install Caddy on Ubuntu 24.04:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update
   sudo apt install caddy
   ```

2. Add your domain block to `/etc/caddy/Caddyfile`:
   ```caddy
   monitor.yourdomain.com {
       # Proxy frontend and backend API
       reverse_proxy localhost:8080
   }
   ```

3. Reload Caddy:
   ```bash
   sudo systemctl reload caddy
   ```

---

### Option B: Nginx (If Nginx is Already Installed)
Create `/etc/nginx/sites-available/vps-fleet-monitor`:

```nginx
server {
    listen 80;
    server_name monitor.yourdomain.com;

    # Certbot will automatically inject SSL directives here
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and obtain Let's Encrypt certificate:
```bash
sudo ln -s /etc/nginx/sites-available/vps-fleet-monitor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d monitor.yourdomain.com
```

---

## 4. Private Network Alternative: Zero Public Exposure via Tailscale

If you prefer **not** to expose your monitoring dashboard to the public internet:

1. Install Tailscale on your Home Server, Singapore VPS, and Android Phone:
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```
2. Your home server receives a private IP in the `100.x.y.z` range.
3. Bind your docker-compose or backend to your Tailscale IP.
4. On your Android phone, install the **Tailscale app** from Google Play.
5. Access your dashboard at `http://100.x.y.z:8080` and install the PWA.
6. The dashboard is accessible only to your authenticated Tailscale devices.
