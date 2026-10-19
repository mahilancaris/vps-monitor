import React, { useState } from 'react';
import {
  Server,
  Sun,
  Moon,
  RotateCw,
  LogOut,
  Radio,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFleet } from '../context/FleetContext';

interface NavbarProps {
  onNavigate: (tab: string) => void;
  activeTab: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  activeTab,
  onToggleSidebar,
  isSidebarOpen
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { refreshFleet, isLoading, isPhoneOnline, alerts, searchQuery, setSearchQuery } = useFleet();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  return (
    <header className="sticky top-0 z-40 bg-[#fdfcfb]/80 dark:bg-[#0c1017]/85 backdrop-blur-xl border-b border-amber-100/60 dark:border-white/5 transition-colors duration-200 shadow-[0_4px_25px_-5px_rgba(180,83,9,0.03)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left Brand & Mobile Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-amber-100/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 lg:hidden transition"
            aria-label="Toggle Navigation Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => onNavigate('overview')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center shadow-md shadow-amber-600/30 group-hover:scale-105 transition-all duration-300">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  VPS Fleet Monitor
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                  Ubuntu 24.04
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                Home &amp; Edge Infrastructure
              </p>
            </div>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search servers by name, IP, hostname..."
              className="w-full glass-panel-subtle rounded-2xl pl-11 pr-16 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-sans transition-all shadow-xs"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100/80 dark:bg-slate-800 rounded border border-slate-200/80 dark:border-slate-700 shadow-xs">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Actions & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live Status Pill */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono border backdrop-blur-md transition-all ${
              isPhoneOnline
                ? 'bg-emerald-50/90 border-emerald-300/60 text-emerald-800 shadow-xs shadow-emerald-500/10 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-400'
                : 'bg-rose-50/90 border-rose-300/60 text-rose-800 shadow-xs shadow-rose-500/10 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isPhoneOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-sans font-semibold">{isPhoneOnline ? 'Live' : 'Offline'}</span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => onNavigate('alerts')}
            title="Active Alerts"
            className="p-2.5 rounded-2xl glass-panel-subtle text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition relative hover:scale-105 active:scale-95 shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title="Toggle Dark/Light Mode"
            aria-label="Toggle Dark/Light Mode"
            className="p-2.5 rounded-2xl glass-panel-subtle text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition hover:scale-105 active:scale-95 shadow-xs"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile Pill with Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2.5 p-1.5 sm:pr-3 rounded-2xl glass-panel-subtle hover:bg-amber-500/10 transition shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-200 to-amber-300 dark:from-amber-800 dark:to-amber-700 text-amber-900 dark:text-amber-100 font-bold flex items-center justify-center text-xs shadow-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {user.role === 'admin' ? 'Administrator' : user.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl p-1.5 shadow-2xl z-50 animate-fade-in border border-amber-100/80 dark:border-white/10"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-amber-100/60 dark:border-white/5 mb-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.username}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email || 'admin@fleet.local'}</p>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Account Security</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
