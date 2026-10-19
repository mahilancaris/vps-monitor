import React from 'react';
import {
  LayoutDashboard,
  Server,
  Bell,
  Settings,
  TrendingUp,
  Share2,
  HardDrive,
  FileText,
  Boxes,
  Layers,
  MapPin,
  CheckCircle2,
  Radio,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const { alerts, summary, isPhoneOnline } = useFleet();
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  const sections = [
    {
      title: 'MAIN',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'servers', label: 'Servers', icon: Server },
        { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlertsCount },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    },
    {
      title: 'MONITORING',
      items: [
        { id: 'metrics', label: 'System Metrics', icon: TrendingUp },
        { id: 'network', label: 'Network', icon: Share2 },
        { id: 'storage', label: 'Storage', icon: HardDrive },
        { id: 'logs', label: 'Logs', icon: FileText },
      ]
    },
    {
      title: 'INFRASTRUCTURE',
      items: [
        { id: 'nodes', label: 'Nodes', icon: Boxes },
        { id: 'clusters', label: 'Clusters', icon: Layers },
        { id: 'locations', label: 'Locations', icon: MapPin },
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  const isAllOperational = summary && summary.offline_servers === 0 && summary.delayed_servers === 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 pt-20 pb-6 px-4 z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 bg-[#fcfbfa]/85 dark:bg-[#0c1017]/85 backdrop-blur-2xl border-r border-amber-100/60 dark:border-white/5 flex flex-col justify-between overflow-y-auto scrollbar-none ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation Groups */}
        <div className="space-y-6">
          {sections.map((sec) => (
            <div key={sec.title}>
              <h4 className="text-[10px] font-black uppercase tracking-wider font-mono text-amber-900/60 dark:text-amber-400/60 px-3 mb-2">
                {sec.title}
              </h4>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 group ${
                        isActive
                          ? 'btn-gold-gradient font-bold scale-[1.01]'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-amber-500/10 dark:hover:bg-amber-400/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-amber-700 dark:group-hover:text-amber-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/30 text-white'
                            : 'bg-rose-500 text-white shadow-xs shadow-rose-500/40'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom System Status Widget */}
        <div className="mt-6 pt-4 border-t border-amber-100/60 dark:border-white/5">
          <div className="glass-panel p-3.5 rounded-2xl flex items-center space-x-3 shadow-xs">
            <div className={`p-2 rounded-xl ${isAllOperational ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
              <Sliders className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500">System Status</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isAllOperational ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'} animate-pulse`} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {isAllOperational ? 'Operational' : 'Attention Needed'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {isAllOperational ? 'All systems running' : `${summary?.offline_servers || 0} node offline`}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
