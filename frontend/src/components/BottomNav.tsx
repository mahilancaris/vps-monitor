import React from 'react';
import { LayoutDashboard, Server, Bell, Settings, Radio } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onNavigate }) => {
  const { alerts, isPhoneOnline } = useFleet();
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  const items = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'servers', label: 'Servers', icon: Server },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlertsCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-3 inset-x-0 mx-auto max-w-[360px] px-3 z-50 pointer-events-none">
      <nav 
        className="pointer-events-auto rounded-[28px] p-1.5 glass-panel !border-white/90 dark:!border-white/10 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12),0_4px_16px_rgba(14,165,233,0.15)] flex items-center justify-between backdrop-blur-2xl backdrop-saturate-200 transition-all duration-300"
        aria-label="Mobile Navigation Dock"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex items-center justify-center transition-all duration-300 active:scale-90 ${
                isActive
                  ? 'btn-gold-gradient text-white font-extrabold shadow-md shadow-amber-600/35 px-4 py-2.5 rounded-2xl space-x-2 scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2.5 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />

                {/* Notification Badge on inactive tabs */}
                {!isActive && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-gradient-to-tr from-rose-500 to-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm shadow-rose-500/60 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Expanding Label for Active Item */}
              {isActive && (
                <span className="text-xs tracking-wide whitespace-nowrap animate-fade-in font-sans">
                  {item.label}
                </span>
              )}

              {/* Notification Badge on active tab */}
              {isActive && item.badge !== undefined && item.badge > 0 && (
                <span className="bg-white/25 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
