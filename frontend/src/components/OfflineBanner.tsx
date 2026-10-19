import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const OfflineBanner: React.FC = () => {
  const { isPhoneOnline, cachedTimestamp } = useFleet();

  if (isPhoneOnline && !cachedTimestamp) {
    return null;
  }

  const formattedTime = cachedTimestamp
    ? new Date(cachedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Unknown time';

  return (
    <div
      role="alert"
      className="bg-amber-500/15 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium sticky top-0 z-50 backdrop-blur-md"
    >
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span>
          <strong className="tracking-wide uppercase bg-amber-500/30 px-1.5 py-0.5 rounded text-[11px] font-bold mr-1.5 text-amber-300">
            STALE DATA — PHONE OFFLINE
          </strong>
          Remote server metrics cannot be refreshed without an active connection. Showing snapshot from {formattedTime}.
        </span>
      </div>
      <div className="hidden sm:flex items-center text-[11px] opacity-75">
        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Never live
      </div>
    </div>
  );
};
