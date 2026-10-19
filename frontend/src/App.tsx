import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { OverviewPage } from './pages/OverviewPage';
import { ServersPage } from './pages/ServersPage';
import { ServerDetailPage } from './pages/ServerDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { Server } from './types';
import { RotateCw } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
        <RotateCw className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
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
    setSelectedServer(null); // Clear active detail view when navigating
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white dark:selection:text-slate-950 transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient luminous glow background orbs */}
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-br from-cyan-400/15 to-sky-500/10 dark:from-cyan-500/10 dark:to-transparent rounded-full blur-3xl pointer-events-none animate-float-slow -z-10" />
      <div className="fixed top-1/3 right-0 translate-x-1/4 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-400/10 to-purple-400/5 dark:from-indigo-600/10 dark:to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/5 dark:from-emerald-500/10 dark:to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Subtle Dot Matrix Background Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.15] -z-10" 
        style={{
          backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Offline Warning Banner */}
      <OfflineBanner />

      {/* Top Navbar */}
      <Navbar onNavigate={handleNavigate} activeTab={activeTab} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
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
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onNavigate={handleNavigate} />
    </div>
  );
};
