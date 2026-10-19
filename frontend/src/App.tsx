import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { OverviewPage } from './pages/OverviewPage';
import { ServersPage } from './pages/ServersPage';
import { ServerDetailPage } from './pages/ServerDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MonitoringViews } from './pages/MonitoringViews';
import { LoginPage } from './pages/LoginPage';
import { Server } from './types';
import { RotateCw } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#0b0f17] flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
        <RotateCw className="w-8 h-8 animate-spin text-amber-600 mb-3" />
        Initializing VPS Fleet Monitor...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectServer = (server: Server) => {
    setSelectedServer(server);
  };

  const handleBackFromDetail = () => {
    setSelectedServer(null);
  };

  const handleNavigate = (tab: string) => {
    setSelectedServer(null);
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const isMonitoringSubView = ['metrics', 'network', 'storage', 'logs', 'nodes', 'clusters', 'locations'].includes(activeTab);

  return (
    <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-600 selection:text-white transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient warm luminous glow background orbs */}
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-400/15 to-orange-400/10 dark:from-amber-600/10 dark:to-transparent rounded-full blur-3xl pointer-events-none animate-float-slow -z-10" />
      <div className="fixed top-1/3 right-0 translate-x-1/4 w-[650px] h-[650px] bg-gradient-to-bl from-yellow-300/10 to-amber-500/5 dark:from-amber-700/10 dark:to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-stone-200/20 to-amber-200/10 dark:from-stone-800/10 dark:to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Subtle Dot Matrix Background Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.15] -z-10" 
        style={{
          backgroundImage: 'radial-gradient(rgba(180, 83, 9, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Offline Warning Banner */}
      <OfflineBanner />

      {/* Top Navbar */}
      <Navbar
        onNavigate={handleNavigate}
        activeTab={activeTab}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Persistent Left Sidebar on Desktop */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isOpenMobile={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area (offset with lg:pl-64 for persistent sidebar) */}
      <div className="flex-1 lg:pl-64 transition-all duration-300">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {selectedServer ? (
            <ServerDetailPage
              serverId={selectedServer.id}
              onBack={handleBackFromDetail}
            />
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewPage
                  onSelectServer={handleSelectServer}
                  onNavigate={handleNavigate}
                />
              )}
              {activeTab === 'servers' && (
                <ServersPage
                  onSelectServer={handleSelectServer}
                />
              )}
              {activeTab === 'alerts' && <AlertsPage />}
              {activeTab === 'settings' && <SettingsPage />}
              {isMonitoringSubView && (
                <MonitoringViews
                  view={activeTab}
                  onSelectServer={handleSelectServer}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Dock */}
      <BottomNav activeTab={activeTab} onNavigate={handleNavigate} />
    </div>
  );
};
