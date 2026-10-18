import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Activity,
  DollarSign,
  Cpu,
  Layers,
  Database,
  Download,
  AlertTriangle,
  CheckCircle2,
  Bell,
  RefreshCw,
  Terminal,
  Trash2,
} from 'lucide-react';
import { AdminStats, AuditLogEntry } from '../types';

interface AdminViewProps {
  isAdmin: boolean;
  onLoginAdmin: (email: string, pass: string) => boolean;
  onLogoutAdmin: () => void;
  adminEmail: string;
}

export const AdminView: React.FC<AdminViewProps> = ({
  isAdmin,
  onLoginAdmin,
  onLogoutAdmin,
  adminEmail,
}) => {
  const SUPER_ADMIN_EMAIL = 'r71468973@gmail.com';

  const [inputEmail, setInputEmail] = useState(SUPER_ADMIN_EMAIL);
  const [inputPass, setInputPass] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [flags, setFlags] = useState<Record<string, boolean>>({
    voiceAssistant: true,
    clapDetection: true,
    marketAnalysis: true,
    geminiLive: true,
    adminPanel: true,
    pwaDownload: true,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

  const fetchAdminStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (data.featureFlags) setFlags(data.featureFlags);
        if (data.systemAnnouncement) setNewAnnouncement(data.systemAnnouncement);
      }
    } catch (e) {
      console.warn('Failed to fetch admin stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (inputEmail.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      setAuthError(`Access denied. Super Administrator privileges are restricted strictly to ${SUPER_ADMIN_EMAIL}.`);
      return;
    }
    const success = onLoginAdmin(inputEmail.trim(), inputPass);
    if (!success) {
      setAuthError('Authentication verification failed.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: SUPER_ADMIN_EMAIL,
          newAnnouncement,
          updatedFlags: flags,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchAdminStats();
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/admin/export-backup', {
        headers: { 'x-admin-email': SUPER_ADMIN_EMAIL },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brainmate-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Backup download failed:', e);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-4 pt-10 pb-20 space-y-4">
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-slate-800 p-6 shadow-2xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-black text-white">Super Administrator Portal</h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to verified owner account ({SUPER_ADMIN_EMAIL}). Ordinary users cannot self-promote.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3 text-left">
            <div>
              <label className="text-slate-300 font-semibold text-xs block mb-1">
                Authorized Admin Email
              </label>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold text-xs block mb-1">
                Security Password / Passcode
              </label>
              <input
                type="password"
                value={inputPass}
                onChange={(e) => setInputPass(e.target.value)}
                placeholder="Enter admin key or passphrase"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Verify & Enter Super Admin Panel
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            Brain Mate Zero-Trust Security Protocol • Protected by Role Validation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 pt-2 max-w-4xl mx-auto px-4">
      {/* Top Header */}
      <div className="rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 p-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">Super Administrator Control Panel</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                OWNER
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Authenticated: {SUPER_ADMIN_EMAIL}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminStats}
            disabled={loadingStats}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            title="Refresh Server Stats"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onLogoutAdmin}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold"
          >
            Exit Admin
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total AI Interactions</span>
          <div className="text-xl font-extrabold font-mono text-cyan-400">
            {stats?.totalAiQueries || 24}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Gemini 3.8 Flash</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Tokens Consumed</span>
          <div className="text-xl font-extrabold font-mono text-indigo-400">
            {(stats?.totalTokensUsed || 18450).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Input + Output</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Est. API Cost</span>
          <div className="text-xl font-extrabold font-mono text-emerald-400">
            ${stats?.estimatedCostUSD || '0.003'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Flash Low-Latency Tier</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Server Uptime</span>
          <div className="text-xl font-extrabold font-mono text-amber-400">
            {stats ? `${Math.floor(stats.serverUptimeSeconds / 60)}m` : 'Active'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Full-Stack Node.js</span>
        </div>
      </div>

      {/* Feature Flags & Announcement Manager */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" /> Feature Flags Configuration
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {Object.entries(flags).map(([key, enabled]) => (
            <label
              key={key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 cursor-pointer hover:border-slate-700"
            >
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setFlags({ ...flags, [key]: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded"
              />
            </label>
          ))}
        </div>

        {/* Global Announcement */}
        <div className="pt-2">
          <label className="text-xs text-slate-300 font-semibold block mb-1">
            Broadcast System Announcement
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              placeholder="e.g. Brain Mate v1.1 update scheduled..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Update
            </button>
          </div>
          {saveSuccess && (
            <span className="text-[11px] text-emerald-400 mt-1 block">
              ✓ Settings saved and broadcasted successfully.
            </span>
          )}
        </div>
      </div>

      {/* Secure Data Export & Backup */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-amber-400" /> Secure Data Export & Backup
          </h3>

          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Cryptographic Backup</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Exports a tamper-evident, SHA256 checksummed backup containing audit trails, configuration states, and telemetry data. Private user chats remain encrypted.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-emerald-400" /> Administrative Audit Trail
        </h3>

        <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
          {stats?.auditLogs && stats.auditLogs.length > 0 ? (
            stats.auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-2 text-slate-300"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-emerald-400 shrink-0">[{log.action}]</span>
                  <span className="truncate">{log.details}</span>
                </div>
                <span className="text-slate-500 text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-xs py-2">No administrative events recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
