import React from 'react';
import { Server, Sun, Moon, RotateCw, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFleet } from '../context/FleetContext';

interface NavbarProps {
  onNavigate: (tab: string) => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activeTab }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { refreshFleet, isLoading, isPhoneOnline } = useFleet();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('overview')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              VPS Fleet Monitor
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800">
                Ubuntu 24.04
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 leading-none">Home &amp; Edge Infrastructure</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'servers', label: 'Servers' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Actions & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live stream / Network Pill */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              isPhoneOnline
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isPhoneOnline ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
            <span className="hidden sm:inline font-sans">{isPhoneOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Manual Refresh */}
          <button
            onClick={() => refreshFleet()}
            disabled={isLoading}
            title="Refresh Fleet Metrics"
            aria-label="Refresh Fleet Metrics"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title="Toggle Dark/Light Mode"
            aria-label="Toggle Dark/Light Mode"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User & Logout */}
          {user && (
            <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
              <span className="hidden lg:inline text-xs font-mono text-slate-300">
                {user.username}
                <span className="ml-1 text-[10px] text-slate-500 uppercase">({user.role})</span>
              </span>
              <button
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
