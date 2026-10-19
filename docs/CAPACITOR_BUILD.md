# Packaging VPS Fleet Monitor as an Android APK with Capacitor

If you prefer installing an `.apk` file directly on your Android phone instead of a PWA, you can wrap the Vite React application with **Capacitor**.

---

## 1. Prerequisites

On your development workstation:
- **Node.js 20+** and **npm**
- **Android Studio** (with Android SDK platform 34+ and command-line tools)
- **Java JDK 17+**

---

## 2. Step-by-Step Build Instructions

### Step 1: Install Capacitor in the Frontend Directory
```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android --save
```

### Step 2: Initialize Capacitor Configuration
```bash
npx cap init "VPS Fleet Monitor" "com.vpsfleet.monitor" --web-dir "dist"
```

This creates a `capacitor.config.json` (or `.ts`):
```json
{
  "appId": "com.vpsfleet.monitor",
  "appName": "VPS Fleet Monitor",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": true
  }
}
```

### Step 3: Build the Web App & Add Android Platform
```bash
# 1. Build the production React bundle
npm run build

# 2. Add Android native project folder
npx cap add android

# 3. Copy web assets into native Android directory
npx cap copy android
```

### Step 4: Configure App Permissions
Open `frontend/android/app/src/main/AndroidManifest.xml` and ensure Internet permission is present:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <application
        android:usesCleartextTraffic="true"
        android:label="VPS Fleet Monitor"
        android:icon="@mipmap/ic_launcher"
        ... >
        ...
    </application>
</manifest>
```

### Step 5: Build Debug or Release APK
```bash
# Open directly in Android Studio:
npx cap open android

# Or build the APK via Gradle command line:
cd android
./gradlew assembleDebug
```

The resulting APK will be generated at:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 3. Installing on Your Android Phone

1. Transfer `app-debug.apk` to your phone via USB cable, Google Drive, or local HTTP server:
   ```bash
   python -m http.server 8080 --directory frontend/android/app/build/outputs/apk/debug
   ```
2. On your phone, tap the `.apk` file in your Downloads.
3. Allow **"Install unknown apps"** when prompted by Android Settings.
4. Launch **VPS Fleet Monitor** from your home screen.
