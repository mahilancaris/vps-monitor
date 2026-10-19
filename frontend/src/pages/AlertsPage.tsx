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
  ShieldAlert,
  Server,
  Filter,
  RotateCw
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { alerts, refreshFleet, acknowledgeAlert, isLoading } = useFleet();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
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

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');
  const displayedAlerts = (activeTab === 'active' ? activeAlerts : resolvedAlerts)
    .filter(a => severityFilter === 'all' || a.severity.toLowerCase() === severityFilter.toLowerCase());

  const severityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-amber-600" />;
    }
  };

  const severityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
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
    <div className="space-y-6 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black uppercase tracking-widest font-mono text-amber-700 dark:text-amber-400">
              ALERTS &amp; INCIDENTS
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Infrastructure Alerts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time threshold evaluations, delayed heartbeats, and offline notifications
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refreshFleet()}
            disabled={isLoading}
            className="p-2.5 rounded-2xl glass-panel-subtle text-slate-600 hover:text-slate-900 dark:text-slate-300 transition"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Severity Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'active'
                ? 'btn-gold-gradient shadow-md scale-[1.02]'
                : 'glass-panel-subtle text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Active Incidents</span>
            {activeAlerts.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'active' ? 'bg-white/30 text-white' : 'bg-rose-500 text-white'
              }`}>
                {activeAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'resolved'
                ? 'btn-gold-gradient shadow-md scale-[1.02]'
                : 'glass-panel-subtle text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Resolved History
          </button>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 self-start sm:self-auto">
          {['all', 'critical', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold capitalize transition-all ${
                severityFilter === sev
                  ? 'btn-gold-gradient shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="space-y-3">
        {displayedAlerts.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/80" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {activeTab === 'active' ? 'All Systems Clear' : 'No Resolved Incidents'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {activeTab === 'active'
                ? 'No active infrastructure incidents or overdue server heartbeats reported.'
                : 'No historical alert records for the current filter.'}
            </p>
          </div>
        ) : (
          displayedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="glass-panel glass-interactive rounded-2xl p-4 sm:p-5 relative overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-2xl glass-panel-subtle shadow-xs">
                    {severityIcon(alert.severity)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${severityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Node #{alert.server_id}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(alert.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {alert.message}
                    </h4>
                  </div>
                </div>

                {alert.status === 'active' && (
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="btn-gold-gradient px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer select-none"
                    >
                      Acknowledge
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Channels Configuration Card */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Instant Alert Dispatch Channels
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Connect Telegram bot or Webhook endpoints for automated push alerts on server failures
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveTelegram} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
              Telegram Bot Token
            </label>
            <input
              type="text"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="e.g. -100123456789 or @channel"
              className="w-full glass-panel-subtle rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center">
                <Check className="w-4 h-4 mr-1" /> Telegram alert channel configured!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Critical and offline alerts will be dispatched immediately.
              </span>
            )}

            <button
              type="submit"
              disabled={isSavingTelegram}
              className="btn-gold-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-md"
            >
              {isSavingTelegram ? 'Saving...' : 'Save Notification Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
