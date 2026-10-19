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
    <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#0b0f17] flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors">
      {/* Background ambient glowing orbs in warm amber & gold */}
      <div className="absolute top-1/4 -left-32 w-[450px] h-[450px] bg-gradient-to-br from-amber-400/20 to-orange-500/10 dark:from-amber-600/15 dark:to-transparent rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-gradient-to-bl from-amber-300/20 to-yellow-500/10 dark:from-amber-700/15 dark:to-transparent rounded-full blur-3xl pointer-events-none animate-float-slow" />

      {/* Subtle Dot Grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.15]" 
        style={{
          backgroundImage: 'radial-gradient(rgba(180, 83, 9, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-md w-full glass-panel rounded-3xl p-6 sm:p-9 shadow-2xl relative z-10 border border-amber-100/80 dark:border-white/10">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-amber-600/35">
            <Server className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            VPS Fleet Monitor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Home &amp; Edge Multi-Server Infrastructure Console
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
                className="w-full glass-panel-subtle rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-sans transition-all shadow-xs"
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
                className="w-full glass-panel-subtle rounded-2xl pl-11 pr-11 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-sans transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {requires2FA && (
            <div className="animate-fade-in">
              <label className="block text-xs font-mono text-amber-700 dark:text-amber-400 mb-1.5 font-bold">
                Two-Factor Code (TOTP)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full glass-panel-subtle rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-mono text-center tracking-widest transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gold-gradient py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider font-mono shadow-md mt-2 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <ShieldCheck className="w-4 h-4 mr-1.5" />
            )}
            <span>{isLoading ? 'Verifying...' : 'Sign In to Console'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
