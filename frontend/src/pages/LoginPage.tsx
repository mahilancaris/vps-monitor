import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Server, Lock, User, Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await login(username, password, totpCode || undefined);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('totp')) {
        setRequires2FA(true);
        setErrorMessage('Two-Factor Authentication code required.');
      } else {
        setErrorMessage(err.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 -left-32 w-[450px] h-[450px] bg-gradient-to-br from-cyan-400/20 to-sky-500/10 dark:from-cyan-600/15 dark:to-transparent rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-400/20 to-purple-500/10 dark:from-indigo-600/15 dark:to-transparent rounded-full blur-3xl pointer-events-none animate-float-slow" />

      {/* Subtle Dot Grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.15]" 
        style={{
          backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-md w-full glass-panel rounded-3xl p-6 sm:p-9 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-indigo-600 flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-sky-500/30">
            <Server className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            VPS Fleet Monitor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mobile-First Multi-Server Infrastructure Dashboard
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-300/60 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5 font-bold">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full glass-panel-subtle rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 font-mono transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5 font-bold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full glass-panel-subtle rounded-2xl pl-11 pr-11 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 font-mono transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {requires2FA && (
            <div className="animate-fade-in">
              <label className="block text-xs font-mono text-sky-600 dark:text-cyan-400 mb-1.5 flex items-center font-bold">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                TOTP 2FA Verification Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-sky-600 dark:text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full glass-panel-subtle rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Fleet'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Protected by Argon2id &amp; Short-Lived JWT Tokens
          </p>
        </div>
      </div>
    </div>
  );
};
