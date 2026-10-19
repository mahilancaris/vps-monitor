# Android PWA Installation & Offline Behavior Guide

## 1. What is a Progressive Web App (PWA)?

VPS Fleet Monitor includes a native Web App Manifest (`manifest.json`) and Service Worker (`sw.js`). When installed on Android:
- It appears in your Android App Drawer like a native app.
- It launches full-screen without the browser URL bar or navigation buttons.
- It caches the application shell locally for instant loading even when disconnected.
- It requires **no Google Play Store account, no developer fee, and no sideloading warning prompts**.

---

## 2. Step-by-Step Installation on Android

### Method A: Google Chrome (Recommended)
1. Open Google Chrome on your Android device.
2. Navigate to your VPS Fleet Monitor URL:
   - If using a domain: `https://monitor.yourdomain.com`
   - If using private Tailscale / WireGuard: `http://100.x.y.z:8080` or `http://10.x.y.z:8080`
   - If testing on home Wi-Fi: `http://192.168.1.100:8080`
3. Tap the **three vertical dots (⋮)** in the top right corner of Chrome.
4. Tap **"Install app"** or **"Add to Home screen"**.
5. When prompted with the app icon and name ("VPS Fleet Monitor"), tap **"Install"**.
6. The app will be installed to your home screen and launcher.

### Method B: Firefox for Android
1. Open Firefox for Android and visit your dashboard URL.
2. Tap the **three dots menu (⋮)** in the bottom or top toolbar.
3. Tap **"Install"** or the small house icon with a plus inside the address bar.
4. Tap **"Add"**.

---

## 3. Installing Locally Without Separate Frontend Hosting

If you prefer **not** to host the frontend on a public web server:
1. Run the Docker container or local server on your Home Server:
   ```bash
   docker compose up -d
   ```
2. Connect your phone to your home Wi-Fi network.
3. Open `http://<HOME_SERVER_LAN_IP>:8080` on your phone.
4. Install the app via "Add to Home screen".
5. The application code and static assets are now permanently cached on your phone.
6. When away from home, connect your phone to your home network using **WireGuard** or **Tailscale** to continue viewing live metrics seamlessly.

---

## 4. Understanding Android Background & Battery Restrictions

> [!CAUTION]
> **Android Battery Optimization Restrictions**
>
> 1. Modern Android versions (Android 12, 13, 14+) aggressively restrict background JavaScript execution and Service Worker timers when an app is minimized or the screen is locked to preserve battery life.
> 2. Because of this operating system constraint, web apps cannot guarantee continuous background polling while your phone is asleep.
> 3. **The Recommended Solution:** For guaranteed instant push alerts on server failure when the app is closed, configure the built-in **Telegram Bot Alert Channel** (in the Alerts tab). Telegram operates persistent push notification sockets on Android that bypass web app sleep limits.
