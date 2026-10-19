import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../services/api';
import { Modal } from '../components/Modal';
import {
  Settings,
  User,
  Shield,
  Smartphone,
  KeyRound,
  Check,
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // 2FA Setup
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; qr_svg?: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMessage({ text: 'New passwords do not match.', error: true });
      return;
    }
    setIsChangingPw(true);
    setPwMessage(null);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      setPwMessage({ text: 'Password successfully updated!', error: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMessage({ text: err.message || 'Failed to change password', error: true });
    } finally {
      setIsChangingPw(false);
    }
  };

  const start2FASetup = async () => {
    try {
      const res = await apiRequest<{ secret: string; qr_svg?: string }>('/auth/totp/setup', {
        method: 'POST'
      });
      setTotpSetupData(res);
      setIs2FAModalOpen(true);
    } catch (e: any) {
      alert(e.message || 'Failed to initialize TOTP');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingTotp(true);
    setTotpError('');
    try {
      await apiRequest('/auth/totp/verify', {
        method: 'POST',
        body: JSON.stringify({ code: verifyCode })
      });
      await refreshUser();
      setIs2FAModalOpen(false);
      setVerifyCode('');
      setTotpSetupData(null);
    } catch (e: any) {
      setTotpError(e.message || 'Invalid 6-digit code');
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt('Enter current 6-digit TOTP code to disable 2FA:');
    if (!code) return;
    try {
      await apiRequest('/auth/totp/disable', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      await refreshUser();
    } catch (e: any) {
      alert(e.message || 'Failed to disable 2FA');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Settings &amp; Security
        </h2>
        <p className="text-xs text-slate-400">
          User authentication, TOTP two-factor security, and Android PWA deployment
        </p>
      </div>

      {/* Profile & 2FA Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          User Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Username</span>
            <span className="text-slate-200 font-bold">{user?.username}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Email</span>
            <span className="text-slate-200">{user?.email}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Role</span>
            <span className="text-cyan-400 font-bold uppercase">{user?.role}</span>
          </div>
        </div>

        {/* 2FA Toggle Section */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">
                Two-Factor Authentication (TOTP)
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure your monitoring login with Google Authenticator, Aegis, or 1Password.
            </p>
          </div>

          {user?.totp_enabled ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-emerald-400 flex items-center bg-emerald-950/40 border border-emerald-800 px-2.5 py-1 rounded-lg">
                <Check className="w-3.5 h-3.5 mr-1" /> Enabled
              </span>
              <button
                onClick={handleDisable2FA}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono hover:bg-rose-900/60 transition"
              >
                Disable
              </button>
            </div>
          ) : (
            <button
              onClick={start2FASetup}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition shadow-lg shadow-cyan-500/20"
            >
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {/* Appearance & Theme Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            Theme &amp; Appearance
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Currently active: <span className="font-mono text-cyan-400 font-bold uppercase">{theme} mode</span>
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
        </button>
      </div>

      {/* Change Password Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          Update Password (Argon2id)
        </h3>

        {pwMessage && (
          <div className={`p-3 rounded-xl text-xs font-mono ${pwMessage.error ? 'bg-rose-950/40 border border-rose-800 text-rose-300' : 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'}`}>
            {pwMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">New Password (min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              disabled={isChangingPw}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-semibold transition"
            >
              {isChangingPw ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Android PWA & Network Connectivity Architecture Guide */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          Android Installation &amp; Network Architecture
        </h3>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-2">
          <p className="font-semibold flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-400 shrink-0" />
            Crucial Architecture &amp; Connectivity Limitation
          </p>
          <p className="text-[11px] leading-relaxed">
            The frontend application can be installed directly on your Android phone as a standalone PWA via <strong>"Add to Home screen"</strong>.
            However, <strong>remote server monitoring requires network reachability</strong> to the central monitoring API.
            If your central backend is hosted on your home server without a public IP, your phone must be connected to your home Wi-Fi or connected via a secure mesh VPN (such as <strong>WireGuard</strong> or <strong>Tailscale</strong>).
            Alternatively, deploy the central backend to your Singapore VPS so both your home server and phone can communicate with it over standard HTTPS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Add to home screen steps */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200">Installing on Android (Chrome):</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 font-mono text-[11px]">
              <li>Open Chrome on your Android device.</li>
              <li>Navigate to your dashboard URL (e.g. <code>https://monitor.yourdomain.com</code>).</li>
              <li>Tap the three dots menu in the top right.</li>
              <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
              <li>The VPS Fleet Monitor icon will appear in your app drawer as a standalone app.</li>
            </ol>
          </div>

          {/* Android Battery Restrictions Note */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200">Android Background Limits:</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Android aggressively throttles background JavaScript execution and Service Worker timers to save battery life.
              For guaranteed real-time alerts when the app is closed, configure the <strong>Telegram Bot notification channel</strong> on the Alerts tab.
            </p>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        title="Scan 2FA Authenticator QR Code"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Scan this QR code using your authenticator app (Google Authenticator, Bitwarden, Aegis):
          </p>

          {totpSetupData?.qr_svg && (
            <div
              className="bg-white p-4 rounded-xl flex items-center justify-center max-w-[200px] mx-auto shadow-lg"
              dangerouslySetInnerHTML={{ __html: totpSetupData.qr_svg }}
            />
          )}

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Manual Secret Key</label>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-400 select-all text-center">
              {totpSetupData?.secret}
            </div>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-3">
            {totpError && (
              <p className="text-xs text-rose-400 font-mono">{totpError}</p>
            )}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Enter 6-digit verification code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingTotp}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
            >
              {isVerifyingTotp ? 'Verifying...' : 'Verify and Enable 2FA'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
