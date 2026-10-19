import React from 'react';
import { LayoutDashboard, Server, Bell, Settings } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onNavigate }) => {
  const { alerts } = useFleet();
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  const items = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'servers', label: 'Servers', icon: Server },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlertsCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] transition-colors duration-200 shadow-sm">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
                isActive
                  ? 'text-sky-600 dark:text-cyan-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-slate-950">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-sky-500 dark:bg-cyan-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
