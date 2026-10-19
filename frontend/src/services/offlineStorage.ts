import { Server, FleetSummary, Alert } from '../types';

const STORAGE_KEYS = {
  SERVERS: 'fleet_cached_servers',
  SUMMARY: 'fleet_cached_summary',
  ALERTS: 'fleet_cached_alerts',
  TIMESTAMP: 'fleet_cached_timestamp'
};

export const offlineStorage = {
  saveFleetData(servers: Server[], summary: FleetSummary | null, alerts: Alert[]) {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.SERVERS, JSON.stringify(servers));
      if (summary) {
        localStorage.setItem(STORAGE_KEYS.SUMMARY, JSON.stringify(summary));
      }
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, now);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  getCachedFleetData(): {
    servers: Server[];
    summary: FleetSummary | null;
    alerts: Alert[];
    timestamp: string | null;
  } {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SERVERS);
      const sum = localStorage.getItem(STORAGE_KEYS.SUMMARY);
      const a = localStorage.getItem(STORAGE_KEYS.ALERTS);
      const t = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);

      return {
        servers: s ? JSON.parse(s) : [],
        summary: sum ? JSON.parse(sum) : null,
        alerts: a ? JSON.parse(a) : [],
        timestamp: t
      };
    } catch (e) {
      return { servers: [], summary: null, alerts: [], timestamp: null };
    }
  },

  clearCache() {
    localStorage.removeItem(STORAGE_KEYS.SERVERS);
    localStorage.removeItem(STORAGE_KEYS.SUMMARY);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
  }
};
