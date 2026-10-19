import React from 'react';
import { ListeningPort } from '../types';
import { Globe, Lock, ShieldAlert, Cpu } from 'lucide-react';

interface PortBadgeProps {
  port: ListeningPort;
}

export const PortBadge: React.FC<PortBadgeProps> = ({ port }) => {
  const isWildcard = port.is_wildcard || port.address === '0.0.0.0' || port.address === '::';
  const isLocalhost = port.address.startsWith('127.') || port.address === '::1' || port.address === 'localhost';

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition">
      <div className="flex items-center space-x-3">
        {/* Protocol & Port Badge */}
        <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs shadow-xs">
          <span className="uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">{port.protocol}</span>
          <span className="font-bold text-sky-600 dark:text-cyan-400 text-sm">{port.port}</span>
        </div>

        {/* Bind Address & Process */}
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">{port.address}</span>
            {port.process_name && (
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center">
                <Cpu className="w-3 h-3 mr-1 text-slate-500" />
                {port.process_name}
                {port.pid ? ` (PID ${port.pid})` : ''}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
            Last seen {new Date(port.last_seen).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Security Scope Tag */}
      <div className="flex items-center space-x-2 shrink-0">
        {isLocalhost ? (
          <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
            <Lock className="w-3 h-3 mr-1" />
            Loopback / Localhost Only
          </span>
        ) : isWildcard ? (
          <span
            title="Listening on 0.0.0.0 / ::. Note: Port may still be protected by ufw, iptables, or cloud security groups."
            className="inline-flex items-center text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md"
          >
            <Globe className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />
            Wildcard Interface
          </span>
        ) : (
          <span className="inline-flex items-center text-[11px] font-medium text-sky-700 dark:text-blue-400 bg-sky-50 dark:bg-blue-950/40 border border-sky-200 dark:border-blue-800/60 px-2 py-0.5 rounded-md">
            Private Interface
          </span>
        )}
      </div>
    </div>
  );
};
