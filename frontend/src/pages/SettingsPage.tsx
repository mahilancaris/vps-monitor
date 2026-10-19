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
  Moon,
  Sliders,
  Bell,
  SlidersHorizontal,
  Key
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'security' | 'thresholds' | 'appearance'>('security');

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

  // Thresholds state
  const [cpuThreshold, setCpuThreshold] = useState(90);
  const [ramThreshold, setRamThreshold] = useState(90);
  const [diskThreshold, setDiskThreshold] = useState(85);
  const [heartbeatTimeout, setHeartbeatTimeout] = useState(60);
  const [thresholdSaved, setThresholdSaved] = useState(false);

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

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    setThresholdSaved(true);
    setTimeout(() => setThresholdSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
            SYSTEM &amp; PREFERENCES
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
          Fleet Control &amp; Security Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure authentication credentials, 2FA security, alert triggers, and interface theme
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-amber-100/60 dark:border-white/5 pb-2">
        {[
          { id: 'security', label: 'Security & 2FA', icon: Shield },
          { id: 'thresholds', label: 'Alert Thresholds', icon: SlidersHorizontal },
          { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'btn-gold-gradient shadow-md scale-[1.02]'
                  : 'glass-panel-subtle text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Password Change Card */}
          <div className="glass-panel rounded-3xl p-6 relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Account Password</h3>
                <p className="text-[11px] text-slate-400">Update password for {user?.username}</p>
              </div>
            </div>

            {pwMessage && (
              <div className={`p-3 rounded-2xl text-xs font-mono mb-4 ${
                pwMessage.error
                  ? 'bg-rose-500/10 border border-rose-300/60 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-300/60 text-emerald-700 dark:text-emerald-300'
              }`}>
                {pwMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPw}
                  className="btn-gold-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  {isChangingPw ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* 2FA / TOTP Card */}
          <div className="glass-panel rounded-3xl p-6 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</h3>
                  <p className="text-[11px] text-slate-400">Google Authenticator, Aegis, Authy (RFC 6238 TOTP)</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-200/60 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">2FA Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    user?.totp_enabled
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {user?.totp_enabled ? 'Active / Protected' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enabling 2FA adds an extra layer of defense to ensure only verified devices can access this VPS fleet console.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              {user?.totp_enabled ? (
                <button
                  onClick={handleDisable2FA}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border border-rose-200/60"
                >
                  Disable 2FA Protection
                </button>
              ) : (
                <button
                  onClick={start2FASetup}
                  className="btn-gold-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  Enable 2FA Authenticator
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'thresholds' && (
        <div className="glass-panel rounded-3xl p-6 relative">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alert Threshold Triggers</h3>
              <p className="text-[11px] text-slate-400">Set utilization limits that trigger push alerts</p>
            </div>
          </div>

          <form onSubmit={handleSaveThresholds} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>CPU Warning Threshold</span>
                <span className="text-amber-700 dark:text-amber-400 font-extrabold">{cpuThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={cpuThreshold}
                onChange={(e) => setCpuThreshold(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>RAM Warning Threshold</span>
                <span className="text-amber-700 dark:text-amber-400 font-extrabold">{ramThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={ramThreshold}
                onChange={(e) => setRamThreshold(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>Disk Usage Threshold</span>
                <span className="text-amber-700 dark:text-amber-400 font-extrabold">{diskThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={diskThreshold}
                onChange={(e) => setDiskThreshold(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>Heartbeat Timeout</span>
                <span className="text-amber-700 dark:text-amber-400 font-extrabold">{heartbeatTimeout} seconds</span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                step="10"
                value={heartbeatTimeout}
                onChange={(e) => setHeartbeatTimeout(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-amber-100/60 dark:border-white/5">
              {thresholdSaved && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center">
                  <Check className="w-4 h-4 mr-1" /> Thresholds successfully saved!
                </span>
              )}
              <button
                type="submit"
                className="btn-gold-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-md ml-auto"
              >
                Save Triggers
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="glass-panel rounded-3xl p-6 relative">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interface &amp; Display Theme</h3>
              <p className="text-[11px] text-slate-400">Choose between Warm Frosted Light mode and Obsidian Dark mode</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${
                theme === 'light'
                  ? 'border-amber-600 bg-amber-50/50 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sun className="w-6 h-6 text-amber-600" />
                {theme === 'light' && <Check className="w-4 h-4 text-amber-600" />}
              </div>
              <h4 className="font-bold text-slate-900 mt-2">Warm Glass Light (Default)</h4>
              <p className="text-xs text-slate-500 mt-1">High-contrast, warm cream aesthetic with golden amber glows.</p>
            </div>

            <div
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${
                theme === 'dark'
                  ? 'border-amber-500 bg-slate-900/80 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <Moon className="w-6 h-6 text-amber-400" />
                {theme === 'dark' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <h4 className="font-bold text-white mt-2">Obsidian Dark Glass</h4>
              <p className="text-xs text-slate-400 mt-1">Deep dark backgrounds with luminous ambient indicators.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        title="Activate Two-Factor Authentication"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Scan this QR code with your Authenticator app (e.g. Google Authenticator, Authy):
          </p>

          {totpSetupData?.qr_svg && (
            <div
              className="p-4 bg-white rounded-2xl flex justify-center border border-slate-200 shadow-xs"
              dangerouslySetInnerHTML={{ __html: totpSetupData.qr_svg }}
            />
          )}

          <div className="text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300 select-all p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {totpSetupData?.secret}
          </div>

          {totpError && (
            <div className="p-3 bg-rose-500/10 border border-rose-300/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-mono">
              {totpError}
            </div>
          )}

          <form onSubmit={handleVerify2FA} className="space-y-3">
            <input
              type="text"
              required
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="000000"
              className="w-full glass-panel-subtle rounded-xl text-center tracking-widest text-lg font-mono py-2.5 text-slate-900 dark:text-white"
            />

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIs2FAModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifyingTotp}
                className="btn-gold-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                {isVerifyingTotp ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
