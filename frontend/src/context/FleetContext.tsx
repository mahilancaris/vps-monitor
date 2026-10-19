import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Server, FleetSummary, Alert } from '../types';
import { apiRequest } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { fleetWs } from '../services/websocket';
import { useAuth } from './AuthContext';

interface FleetContextType {
  servers: Server[];
  summary: FleetSummary | null;
  alerts: Alert[];
  isPhoneOnline: boolean;
  cachedTimestamp: string | null;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  locationFilter: string;
  setLocationFilter: (loc: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  filteredServers: Server[];
  availableLocations: string[];
  refreshFleet: () => Promise<void>;
  acknowledgeAlert: (alertId: number, resolved?: boolean) => Promise<void>;
}

const FleetContext = createContext<FleetContextType>({} as FleetContextType);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isPhoneOnline, setIsPhoneOnline] = useState<boolean>(navigator.onLine);
  const [cachedTimestamp, setCachedTimestamp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Monitor browser/phone network state
  useEffect(() => {
    const handleOnline = () => {
      setIsPhoneOnline(true);
      refreshFleet();
    };
    const handleOffline = () => {
      setIsPhoneOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshFleet = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Parallel requests for speed
      const [srvs, sum, alrts] = await Promise.all([
        apiRequest<Server[]>('/servers'),
        apiRequest<FleetSummary>('/metrics/fleet'),
        apiRequest<Alert[]>('/alerts?status_filter=active')
      ]);

      setServers(srvs);
      setSummary(sum);
      setAlerts(alrts);
      setIsPhoneOnline(true);
      setCachedTimestamp(null);

      // Save fresh data to local offline cache
      offlineStorage.saveFleetData(srvs, sum, alrts);
    } catch (e) {
      console.warn('API fetch failed, loading offline cached fleet data:', e);
      setIsPhoneOnline(false);
      const cached = offlineStorage.getCachedFleetData();
      if (cached.servers.length > 0 || cached.summary) {
        setServers(cached.servers);
        setSummary(cached.summary);
        setAlerts(cached.alerts);
        setCachedTimestamp(cached.timestamp);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load and periodic refresh (default 15s)
  useEffect(() => {
    if (user) {
      refreshFleet();
      fleetWs.connect();

      // Listen for WebSocket live updates
      const unsubscribe = fleetWs.subscribe((msg) => {
        if (msg.event === 'server_status_changed' || msg.event === 'metric_received') {
          // Fast refresh
          refreshFleet();
        } else if (msg.event === 'new_alert' || msg.event === 'alert_resolved') {
          refreshFleet();
        }
      });

      const interval = setInterval(refreshFleet, 15000);

      return () => {
        clearInterval(interval);
        unsubscribe();
        fleetWs.disconnect();
      };
    }
  }, [user, refreshFleet]);

  const acknowledgeAlert = async (alertId: number, resolved: boolean = false) => {
    await apiRequest(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ resolved })
    });
    refreshFleet();
  };

  // Derive unique locations
  const availableLocations = ['All', ...Array.from(new Set(servers.map(s => s.location)))];

  // Filtered servers
  const filteredServers = servers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.hostname && s.hostname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLoc = locationFilter === 'All' || s.location === locationFilter;
    const matchesStatus = statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesLoc && matchesStatus;
  });

  return (
    <FleetContext.Provider
      value={{
        servers,
        summary,
        alerts,
        isPhoneOnline,
        cachedTimestamp,
        isLoading,
        searchQuery,
        setSearchQuery,
        locationFilter,
        setLocationFilter,
        statusFilter,
        setStatusFilter,
        filteredServers,
        availableLocations,
        refreshFleet,
        acknowledgeAlert
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => useContext(FleetContext);
