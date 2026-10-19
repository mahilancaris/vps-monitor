import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../types';
import { apiRequest } from '../services/api';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Send,
  Mail,
  Check,
  ShieldAlert
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { alerts, refreshFleet, acknowledgeAlert } = useFleet();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([]);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeTab === 'resolved') {
      apiRequest<Alert[]>('/alerts?status_filter=resolved')
        .then(setResolvedAlerts)
        .catch(console.error);
    }
  }, [activeTab]);

  const displayedAlerts = activeTab === 'active'
    ? alerts.filter(a => a.status !== 'resolved')
    : resolvedAlerts;

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTelegram(true);
    try {
      await apiRequest('/alerts/notifications/telegram', {
        method: 'PUT',
        body: JSON.stringify({
          is_enabled: true,
          min_severity: 'warning',
          config: {
            token: telegramToken,
            chat_id: telegramChatId
          }
        })
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to save Telegram settings');
    } finally {
      setIsSavingTelegram(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Infrastructure Alerts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time threshold evaluations, delayed heartbeats, and offline alerts
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'active'
                ? 'bg-white dark:bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active ({alerts.filter(a => a.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'resolved'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            History (Resolved)
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {displayedAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
            <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No {activeTab} alerts</h4>
            <p className="text-xs text-slate-500 mt-1">All monitored Ubuntu servers are within normal limits.</p>
          </div>
        ) : (
          displayedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 shrink-0 mt-0.5">
                  {severityIcon(alert.severity)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-md border ${severityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{alert.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-mono">
                    {alert.message}
                  </p>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-2">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Triggered {new Date(alert.triggered_at).toLocaleString()}
                    </span>
                    {alert.server_name && (
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{alert.server_name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {activeTab === 'active' && (
                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => acknowledgeAlert(alert.id, false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono transition"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => acknowledgeAlert(alert.id, true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono transition"
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notification Dispatcher Setup (Admin) */}
      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs backdrop-blur-md space-y-4">
          <div className="flex items-center space-x-2">
            <Send className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">
              Telegram Instant Notification Channel
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Receive push notifications on your phone via Telegram when a server misses heartbeats or exceeds CPU/RAM thresholds.
          </p>

          <form onSubmit={handleSaveTelegram} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">Telegram Bot Token</label>
              <input
                type="text"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">Telegram Chat ID</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="-100123456789 or user ID"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 font-mono"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                {savedSuccess && <span className="text-emerald-600 dark:text-emerald-400 flex items-center"><Check className="w-3.5 h-3.5 mr-1" /> Telegram settings saved</span>}
              </span>
              <button
                type="submit"
                disabled={isSavingTelegram}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-xs shadow-cyan-500/20"
              >
                {isSavingTelegram ? 'Saving...' : 'Save Telegram Channel'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
