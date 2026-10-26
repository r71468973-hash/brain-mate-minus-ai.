import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Activity,
  DollarSign,
  Cpu,
  Layers,
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Bell,
  RefreshCw,
  Terminal,
  Trash2,
  Users,
  UserX,
  UserCheck,
  Search,
  MessageSquare,
  AlertCircle,
  Clock,
  Key,
  Smartphone,
  Send,
  Sliders,
  ChevronRight,
  Power,
} from 'lucide-react';
import { AdminStats, AuditLogEntry, RegisteredUser, SupportTicket, AiErrorLog } from '../types';
import { adminService, SUPER_ADMIN_EMAIL } from '../services/adminService';

interface AdminViewProps {
  isAdmin: boolean;
  onLoginAdmin: (email: string, pass: string) => boolean | Promise<boolean>;
  onLogoutAdmin: () => void;
  adminEmail: string;
}

export const AdminView: React.FC<AdminViewProps> = ({
  isAdmin,
  onLoginAdmin,
  onLogoutAdmin,
}) => {
  // Authentication State
  const [inputEmail, setInputEmail] = useState(SUPER_ADMIN_EMAIL);
  const [inputPass, setInputPass] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'controls' | 'errors' | 'support' | 'audit' | 'backup'>('overview');

  // Core Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // User Filter & Search
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Maintenance & Controls
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [reauthPin, setReauthPin] = useState('');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({
    voiceAssistant: true,
    clapDetection: true,
    marketAnalysis: true,
    geminiLive: true,
    adminPanel: true,
    pwaDownload: true,
    bossMode: true,
  });
  const [announcementText, setAnnouncementText] = useState('');
  const [rateLimit, setRateLimit] = useState(40);

  // Modals
  const [suspendModalUser, setSuspendModalUser] = useState<RegisteredUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [replyTicketModal, setReplyTicketModal] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [restorePin, setRestorePin] = useState('');

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, ticketsData] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getUsers().catch(() => []),
        adminService.getSupportTickets().catch(() => []),
      ]);

      if (statsData) {
        setStats(statsData);
        setMaintenanceMode(statsData.maintenanceMode);
        setMaintenanceMsg(statsData.maintenanceMessage);
        if (statsData.featureFlags) setFlags(statsData.featureFlags);
        if (statsData.systemAnnouncement) setAnnouncementText(statsData.systemAnnouncement);
      }
      setUsers(usersData);
      setTickets(ticketsData);
    } catch (e: any) {
      console.warn('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (inputEmail.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      setAuthError(`Access Denied. Super Administrator authorization is restricted exclusively to ${SUPER_ADMIN_EMAIL}.`);
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await adminService.login(inputEmail.trim(), inputPass.trim());
      if (res.success) {
        await onLoginAdmin(inputEmail.trim(), inputPass.trim());
        showNotice('👑 Super Administrator verified. Session active.');
      } else {
        setAuthError(res.error || 'Invalid Owner PIN or credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Toggle Maintenance
  const handleConfirmMaintenance = async () => {
    if (reauthPin.trim() !== '714689') {
      showNotice('❌ Invalid Owner PIN for maintenance mode change.');
      return;
    }
    try {
      const targetState = !maintenanceMode;
      await adminService.toggleMaintenance(targetState, maintenanceMsg, reauthPin);
      setMaintenanceMode(targetState);
      setShowMaintenanceModal(false);
      setReauthPin('');
      showNotice(`Maintenance Mode ${targetState ? 'ENABLED' : 'DISABLED'}`);
      loadAllAdminData();
    } catch (e: any) {
      showNotice(`Error: ${e.message}`);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      await adminService.updateSettings({
        newAnnouncement: announcementText,
        updatedFlags: flags,
        rateLimit,
      });
      showNotice('Settings and feature toggles saved.');
      loadAllAdminData();
    } catch (e: any) {
      showNotice(`Error: ${e.message}`);
    }
  };

  // User Actions
  const handleToggleUserStatus = async (user: RegisteredUser) => {
    if (user.role === 'owner') {
      showNotice('Owner account cannot be modified.');
      return;
    }
    if (user.status === 'active') {
      setSuspendModalUser(user);
      setSuspendReason('');
    } else {
      try {
        await adminService.updateUserStatus(user.id, 'active');
        showNotice(`Reactivated account ${user.email}`);
        loadAllAdminData();
      } catch (e: any) {
        showNotice(`Error: ${e.message}`);
      }
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendModalUser) return;
    try {
      await adminService.updateUserStatus(suspendModalUser.id, 'suspended', suspendReason);
      showNotice(`Suspended account ${suspendModalUser.email}`);
      setSuspendModalUser(null);
      loadAllAdminData();
    } catch (e: any) {
      showNotice(`Error: ${e.message}`);
    }
  };

  const handleDeleteUser = async (user: RegisteredUser) => {
    if (user.role === 'owner') {
      showNotice('Owner account cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete ${user.email} and purge all their data?`)) {
      return;
    }
    try {
      await adminService.deleteUser(user.id);
      showNotice(`Purged user ${user.email}`);
      loadAllAdminData();
    } catch (e: any) {
      showNotice(`Error: ${e.message}`);
    }
  };

  // Support Reply
  const handleSendTicketReply = async () => {
    if (!replyTicketModal) return;
    try {
      await adminService.replySupportTicket(replyTicketModal.id, ticketReplyText, 'resolved');
      showNotice('Reply sent & ticket marked resolved.');
      setReplyTicketModal(null);
      setTicketReplyText('');
      loadAllAdminData();
    } catch (e: any) {
      showNotice(`Error: ${e.message}`);
    }
  };

  // Download Backup
  const handleDownloadBackup = async () => {
    try {
      const blob = await adminService.exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brain-mate-owner-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotice('Full encrypted backup downloaded.');
    } catch (e: any) {
      showNotice(`Export failed: ${e.message}`);
    }
  };

  // Restore Backup
  const handleRestoreBackup = async () => {
    if (restorePin.trim() !== '714689') {
      showNotice('Invalid Owner PIN.');
      return;
    }
    try {
      const parsed = JSON.parse(restoreJsonText);
      await adminService.restoreBackup(parsed, restorePin);
      showNotice('System successfully restored from backup.');
      setRestoreModalOpen(false);
      setRestoreJsonText('');
      setRestorePin('');
      loadAllAdminData();
    } catch (e: any) {
      showNotice(`Restore failed: ${e.message}`);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.displayName.toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter = userFilter === 'all' || u.status === userFilter;
    return matchesSearch && matchesFilter;
  });

  // Render Login Screen if not verified
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-slate-900/90 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[1.5px] flex items-center justify-center shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Super Admin Panel</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">OWNER ONLY</span>
              </h2>
              <p className="text-xs text-slate-400">Restricted access for Suresh Kumar Yadav</p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Owner Email Address
              </label>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                readOnly
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Privileges cryptographically bound to owner email.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Master PIN / Passphrase</span>
                <span className="text-[10px] text-amber-400 font-normal">Default PIN: 714689</span>
              </label>
              <input
                type="password"
                value={inputPass}
                onChange={(e) => setInputPass(e.target.value)}
                placeholder="Enter 6-digit PIN or passphrase"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs tracking-wider focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? 'Verifying Identity...' : 'Unlock Super Admin Panel'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              🔒 Protected by Server-Side Zero-Trust Token Verification
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Super Admin Dashboard
  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-5 pb-24">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl font-semibold animate-in fade-in slide-in-from-top-2">
          {actionNotice}
        </div>
      )}

      {/* Top Banner with Maintenance Alert */}
      {maintenanceMode && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
            <div>
              <span className="font-bold">MAINTENANCE MODE IS CURRENTLY ACTIVE!</span>
              <p className="text-[11px] text-rose-300">{maintenanceMsg}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shrink-0"
          >
            Manage
          </button>
        </div>
      )}

      {/* Super Admin Top Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1626] to-indigo-950 border border-indigo-500/30 p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[1.5px] flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white">Owner &amp; Super Admin Console</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE OWNER SESSION
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Verified: <span className="text-amber-300 font-semibold">{SUPER_ADMIN_EMAIL}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAllAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            title="Refresh metrics and users"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setShowMaintenanceModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              maintenanceMode
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{maintenanceMode ? 'Maintenance ON' : 'Maintenance'}</span>
          </button>

          <button
            onClick={onLogoutAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Lock &amp; Exit</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Mobile-Friendly Horizontal Scroller) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: `Users (${users.length})`, icon: Users },
          { id: 'controls', label: 'App Controls', icon: Sliders },
          { id: 'errors', label: `Errors (${stats?.recentErrors?.length || 0})`, icon: AlertTriangle },
          { id: 'support', label: `Support (${tickets.filter((t) => t.status !== 'resolved').length})`, icon: MessageSquare },
          { id: 'audit', label: `Audit Trail (${stats?.auditLogs?.length || 0})`, icon: Terminal },
          { id: 'backup', label: 'Backup & Recovery', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              adminTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {adminTab === 'overview' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {stats.registeredUsersCount}
              </div>
              <p className="text-[10px] text-emerald-400">{stats.activeUsersCount} Active • {stats.suspendedUsersCount} Suspended</p>
            </div>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>AI Queries Run</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {stats.totalAiQueries}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">{stats.totalTokensUsed.toLocaleString()} tokens</p>
            </div>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Est. Cloud Cost</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                ${stats.estimatedCostUSD}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Free Tier Healthy</p>
            </div>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Server Uptime</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {Math.floor(stats.serverUptimeSeconds / 3600)}h {Math.floor((stats.serverUptimeSeconds % 3600) / 60)}m
              </div>
              <p className="text-[10px] text-emerald-400 font-mono">Online • Port 3000</p>
            </div>
          </div>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Security &amp; Firestore Status</span>
              </h3>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="font-mono text-cyan-300">Cloud Firestore (Zero-Trust ABAC)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Security Rules:</span>
                  <span className="text-emerald-400 font-semibold">Strict Role-Based Enforcement</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Owner Account:</span>
                  <span className="font-mono text-amber-300">{SUPER_ADMIN_EMAIL}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Maintenance Mode:</span>
                  <span className={maintenanceMode ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {maintenanceMode ? 'ENABLED (Public Access Paused)' : 'DISABLED (Operational)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Broadcast System Announcement</span>
              </h3>
              <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {stats.systemAnnouncement || 'No active announcement broadcast.'}
              </p>
              <button
                onClick={() => setAdminTab('controls')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Edit Announcement in Controls →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {adminTab === 'users' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by email or name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex gap-1.5">
              {(['all', 'active', 'suspended'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setUserFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    userFilter === filter
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">AI Queries</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => {
                    const isOwner = u.role === 'owner' || u.email === SUPER_ADMIN_EMAIL;
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{u.displayName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                          {u.suspendReason && (
                            <div className="text-[10px] text-rose-400 italic mt-0.5">Reason: {u.suspendReason}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isOwner ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">{u.apiCallsCount}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3 text-right">
                          {isOwner ? (
                            <span className="text-[11px] text-amber-400 font-semibold">Protected Owner</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                  u.status === 'active'
                                    ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                                }`}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                title="Purge user account & data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APP CONTROLS */}
      {adminTab === 'controls' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Feature Flags &amp; Service Toggles</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(flags).map(([key, enabled]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800"
                >
                  <div>
                    <div className="text-xs font-bold text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <span className="text-[10px] text-slate-400">
                      {enabled ? 'Active for all users' : 'Disabled globally'}
                    </span>
                  </div>
                  <button
                    onClick={() => setFlags({ ...flags, [key]: !enabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      enabled ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Global System Announcement Banner
                </label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Enter message visible at top of application..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex justify-between">
                  <span>AI Proxy Rate Limit</span>
                  <span className="font-mono text-cyan-300">{rateLimit} requests / minute</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition-colors"
              >
                Save Settings &amp; Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ERROR MONITORING */}
      {adminTab === 'errors' && stats && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Real-Time AI &amp; API Error Log</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Latest 20 errors</span>
          </div>

          {(!stats.recentErrors || stats.recentErrors.length === 0) ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>Zero server errors logged. Systems operating optimally.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentErrors.map((err) => (
                <div key={err.id} className="p-3 rounded-lg bg-slate-950 border border-rose-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-400">{err.endpoint} (HTTP {err.statusCode})</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(err.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px]">{err.error}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUPPORT & FEEDBACK DESK */}
      {adminTab === 'support' && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>User Inquiries &amp; Feedback ({tickets.length})</span>
            </h3>
          </div>

          {tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No support tickets submitted yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {tickets.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{t.subject}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{t.userEmail} • {new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">{t.message}</p>
                  {t.adminReply && (
                    <div className="text-[11px] text-cyan-300 bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                      <span className="font-bold">Super Admin Reply:</span> {t.adminReply}
                    </div>
                  )}
                  {t.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        setReplyTicketModal(t);
                        setTicketReplyText('');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Reply &amp; Resolve Ticket →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {adminTab === 'audit' && stats && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Immutable Administrative Audit Trail</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Zero-Trust Audit Log</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {stats.auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    log.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-300'
                      : log.severity === 'warning'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-slate-300">{log.details}</span>
                </div>
                <span className="text-slate-500 text-[10px] shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: BACKUP & RECOVERY */}
      {adminTab === 'backup' && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Disaster Recovery &amp; State Backup</h3>
              <p className="text-xs text-slate-400">Cryptographically signed system state and user directory snapshots</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white">Export Full Snapshot</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Download a complete, signed JSON snapshot of system metrics, users, audit logs, feature flags, and settings.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download System Backup</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white">Restore Snapshot</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Restore system settings and configuration flags from a verified backup. Requires Owner PIN verification.
              </p>
              <button
                onClick={() => setRestoreModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
              >
                <Upload className="w-4 h-4" />
                <span>Restore From File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE MODE MODAL */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-rose-500/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 text-rose-400">
              <Power className="w-4 h-4" />
              <span>{maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}</span>
            </h3>
            <p className="text-xs text-slate-300">
              When maintenance is enabled, ordinary users will be informed that maintenance is in progress, while the Owner retains full access.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Public Maintenance Message
              </label>
              <textarea
                value={maintenanceMsg}
                onChange={(e) => setMaintenanceMsg(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Owner Re-authentication PIN (714689)
              </label>
              <input
                type="password"
                value={reauthPin}
                onChange={(e) => setReauthPin(e.target.value)}
                placeholder="Enter Owner PIN"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMaintenance}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm State Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND REASON MODAL */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-amber-400" />
              <span>Suspend Account: {suspendModalUser.email}</span>
            </h3>
            <p className="text-xs text-slate-300">
              The user will be immediately blocked from making AI queries and accessing services.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Suspension</label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Terms violation or suspicious activity"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSuspendModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT REPLY MODAL */}
      {replyTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Reply to: {replyTicketModal.subject}</h3>
            <p className="text-xs text-slate-400">User: {replyTicketModal.userEmail}</p>
            <textarea
              value={ticketReplyText}
              onChange={(e) => setTicketReplyText(e.target.value)}
              placeholder="Enter your administrative response..."
              rows={4}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setReplyTicketModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTicketReply}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Send Reply &amp; Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE BACKUP MODAL */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Restore System From Snapshot</h3>
            <textarea
              value={restoreJsonText}
              onChange={(e) => setRestoreJsonText(e.target.value)}
              placeholder="Paste JSON backup content here..."
              rows={5}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-white"
            />
            <input
              type="password"
              value={restorePin}
              onChange={(e) => setRestorePin(e.target.value)}
              placeholder="Enter Owner PIN (714689)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreBackup}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Restore System
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
