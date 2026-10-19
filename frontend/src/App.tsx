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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Offline Warning Banner */}
      <OfflineBanner />

      {/* Top Navbar */}
      <Navbar onNavigate={handleNavigate} activeTab={activeTab} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
