import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { useAuth } from '../context/AuthContext';
import { ServerCard } from '../components/ServerCard';
import { Modal } from '../components/Modal';
import { Server as ServerType } from '../types';
import { apiRequest } from '../services/api';
import { Plus, Server, Copy, Check, Terminal, ShieldAlert } from 'lucide-react';

interface ServersPageProps {
  onSelectServer: (server: ServerType) => void;
}

export const ServersPage: React.FC<ServersPageProps> = ({ onSelectServer }) => {
  const { filteredServers, refreshFleet, statusFilter, setStatusFilter } = useFleet();
  const { user } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Home');
  const [hostname, setHostname] = useState('');
  const [publicIp, setPublicIp] = useState('');
  const [privateIp, setPrivateIp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Generated Agent Token state after server creation
  const [generatedCred, setGeneratedCred] = useState<{ raw_token: string; server_id: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create Server
      const newServer = await apiRequest<ServerType>('/servers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          location,
          hostname: hostname || null,
          public_ip: publicIp || null,
          private_ip: privateIp || null
        })
      });

      // 2. Generate initial Agent Token
      const cred = await apiRequest<{ raw_token: string }>([`/servers/${newServer.id}/credentials`].join(''), {
        method: 'POST'
      });

      setGeneratedCred({ raw_token: cred.raw_token, server_id: newServer.id });
      refreshFleet();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInstallCommand = (token: string) => {
    const installCmd = `curl -sSL "${window.location.origin}/api/agent/install.sh" | sudo AGENT_TOKEN="${token}" API_URL="${window.location.origin}/api" bash`;
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Server Fleet Registry
          </h2>
          <p className="text-xs text-slate-400">
            Manage your Ubuntu home servers and Singapore/edge VPS nodes
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setGeneratedCred(null);
                setName('');
                setHostname('');
                setPublicIp('');
                setPrivateIp('');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll New Server</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Online', 'Delayed', 'Offline'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
              statusFilter.toLowerCase() === st.toLowerCase()
                ? 'bg-slate-800 text-cyan-400 border border-cyan-800/60 font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServers.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            onClick={onSelectServer}
          />
        ))}
      </div>

      {/* Add Server Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setGeneratedCred(null);
        }}
        title={generatedCred ? "Server Enrolled Successfully" : "Register Monitored Server"}
      >
        {generatedCred ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs">
              Server registered. Run the following command on your Ubuntu server to install the agent:
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Agent Secret Token</label>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
                {generatedCred.raw_token}
              </div>
              <p className="text-[11px] text-rose-400 mt-1">
                Save this token! It is stored securely as a cryptographic SHA-256 hash and cannot be viewed again.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">One-Line Agent Install Command</label>
              <div className="relative">
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {`curl -sSL "${window.location.origin}/api/agent/install.sh" | sudo AGENT_TOKEN="${generatedCred.raw_token}" API_URL="${window.location.origin}/api" bash`}
                </pre>
                <button
                  onClick={() => copyInstallCommand(generatedCred.raw_token)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title="Copy command"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Note: If installing on a remote server/VPS, replace <code>{window.location.origin}</code> with your central monitoring host IP or domain.
              </p>
            </div>

            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setGeneratedCred(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateServer} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Friendly Server Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Singapore VPS Edge or Home Ubuntu"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Home, Singapore, Tokyo, Frankfurt"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hostname (Optional)</label>
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="e.g. sg-vps-01"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Public IP</label>
                <input
                  type="text"
                  value={publicIp}
                  onChange={(e) => setPublicIp(e.target.value)}
                  placeholder="e.g. 139.180.201.88"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Private IP / VPN</label>
                <input
                  type="text"
                  value={privateIp}
                  onChange={(e) => setPrivateIp(e.target.value)}
                  placeholder="e.g. 10.0.0.5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Register Server & Generate Agent Token'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
