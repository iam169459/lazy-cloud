// Hallmark · v2.0.0 — Admin Panel redesign
// Stamp: tokens.css imported via index.css
// Material: Admin file management, user management, storage, security, audit
// Audience: System administrators
// Use: Manage files, users, storage, security, API keys, audit logs
// Tone: Utilitarian/technical with editorial voice
// Genre: SaaS → modern-minimal

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle,
  Shield, Sliders, Scan, Menu, X, ChevronsLeft, ChevronsRight, Terminal, Key, Activity, Users
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, formatBytes, FileWithProvider, StorageProvider, Stats } from '@/lib/api';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminStorage = lazy(() => import('./AdminStorage'));
const AdminSecurity = lazy(() => import('./AdminSecurity'));
const AdminAdvanced = lazy(() => import('./AdminAdvanced'));
const AdminScan = lazy(() => import('./AdminScan'));
const AdminSystem = lazy(() => import('./AdminSystem'));
const AdminApiKeys = lazy(() => import('./AdminApiKeys'));
const AdminAuditLog = lazy(() => import('./AdminAuditLog'));
const AdminUsers = lazy(() => import('./AdminUsers'));

type Tab = 'dashboard' | 'storage' | 'security' | 'api-keys' | 'audit-log' | 'advanced' | 'scan' | 'system' | 'users';

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Files', icon: <FileText className="w-[18px] h-[18px]" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-[18px] h-[18px]" /> },
  { id: 'storage', label: 'Storage', icon: <Cloud className="w-[18px] h-[18px]" /> },
  { id: 'advanced', label: 'Settings', icon: <Sliders className="w-[18px] h-[18px]" /> },
  { id: 'api-keys', label: 'API Keys', icon: <Key className="w-[18px] h-[18px]" /> },
  { id: 'audit-log', label: 'Audit Log', icon: <Activity className="w-[18px] h-[18px]" /> },
  { id: 'scan', label: 'Scan', icon: <Scan className="w-[18px] h-[18px]" /> },
  { id: 'system', label: 'System', icon: <Terminal className="w-[18px] h-[18px]" /> },
];

const pageDescriptions: Record<Tab, string> = {
  dashboard: 'Upload, manage, and share your files.',
  users: 'Manage registered users and permissions.',
  storage: 'Manage your storage backends.',
  advanced: 'Configure themes, credentials, 2FA, and system preferences.',
  'api-keys': 'Manage API keys for programmatic access.',
  'audit-log': 'View admin action audit trail.',
  scan: 'Scan storage for orphaned or mismatched files.',
  system: 'System info, update and maintenance.',
};

const pageTitles: Record<Tab, string> = {
  dashboard: 'Files',
  storage: 'Storage',
  security: 'Credentials',
  'api-keys': 'API Keys',
  'audit-log': 'Audit Log',
  advanced: 'Settings',
  scan: 'Scan',
  system: 'System',
};

export default function AdminPanel() {
  const { token, logout } = useAuth();
  const nav = useNavigate();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [files, setFiles] = useState<FileWithProvider[]>([]);
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [notifExiting, setNotifExiting] = useState(false);

  const notify = useCallback((type: 'success' | 'error', msg: string) => {
    setNotifExiting(false);
    setNotif({ type, msg }); sounds[type === 'success' ? 'notification' : 'error']();
    setTimeout(() => { setNotifExiting(true); setTimeout(() => { setNotif(null); setNotifExiting(false); }, 300); }, 3700);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [s, f, p] = await Promise.all([api.getStats(token), api.listFiles(token), api.listProviders(token)]);
      setStats(s); setFiles(f.files); setProviders(p.providers);
    } catch (e: any) { notify('error', e.message); } finally { setLoading(false); }
  }, [token, notify]);

  useEffect(() => { if (!token) { nav('/admin/login'); return; } refresh(); }, [token, nav, refresh]);

  function doLogout() { sounds.click(); logout(); nav('/'); }
  if (!token) return null;

  const used = stats ? parseInt(stats.providers.used_bytes || '0') : 0;
  const cap = stats ? parseInt(stats.providers.capacity_bytes || '0') : 0;
  const pct = cap > 0 ? (used / cap) * 100 : 0;

  const sidebarWidth = collapsed ? 68 : 240;

  return (
    <div className="min-h-screen flex" style={{ color: 'var(--text)' }}>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'var(--bg)cc', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-200 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          background: 'var(--card-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border)',
        }}
        role="navigation"
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="h-14 px-4 flex items-center shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link
            to="/"
            className="flex items-center gap-2.5 overflow-hidden"
            onClick={() => { sounds.click(); setMobileOpen(false); }}
            aria-label="LazyDrop — home"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--gradient)' }}>
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap">LazyDrop</span>
            )}
          </Link>
        </div>

        {/* Primary Nav */}
        <nav className="flex-1 px-2 py-3">
          {!collapsed && (
            <div className="text-xs mb-2 px-2" style={{ color: 'var(--text-dim)' }}>
              Navigation
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); sounds.click(); setMobileOpen(false); }}
                  className="flex items-center gap-3 rounded-lg text-sm font-medium"
                  style={{
                    padding: collapsed ? '0.625rem' : '0.625rem 0.75rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: isActive ? 'var(--primary-glow)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  active:scale-95
                >
                  <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="px-2 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-0.5">
            {/* Collapse Toggle — desktop only */}
            <button
              onClick={() => { sounds.click(); setCollapsed(!collapsed); }}
              className="hidden lg:flex items-center gap-3 rounded-lg text-sm font-medium w-full"
              style={{
                padding: collapsed ? '0.625rem' : '0.625rem 0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'var(--text-dim)',
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              active:scale-95
            >
              {collapsed ? <ChevronsRight className="w-[18px] h-[18px]" /> : <ChevronsLeft className="w-[18px] h-[18px]" />}
              {!collapsed && <span>Collapse</span>}
            </button>

            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg text-sm font-medium"
              style={{
                padding: collapsed ? '0.625rem' : '0.625rem 0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'var(--text-muted)',
              }}
              onClick={() => { sounds.click(); setMobileOpen(false); }}
              title={collapsed ? 'View site' : undefined}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              active:scale-95
            >
              <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}><FileText className="w-[18px] h-[18px]" /></span>
              {!collapsed && <span>View site</span>}
            </Link>

            {!collapsed && (
              <div className="px-2 py-1.5">
                <ThemeSwitcher compact />
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center py-1">
                <ThemeSwitcher compact iconOnly />
              </div>
            )}

            <button
              onClick={() => { doLogout(); setMobileOpen(false); }}
              className="flex items-center gap-3 rounded-lg text-sm font-medium text-left w-full"
              style={{
                padding: collapsed ? '0.625rem' : '0.625rem 0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'var(--text-muted)',
              }}
              title={collapsed ? 'Logout' : undefined}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              active:scale-95
            >
              <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}><LogOut className="w-[18px] h-[18px]" /></span>
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Bar */}
        <header className="h-14 px-5 flex items-center justify-between shrink-0 lg:hidden" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95" style={{ color: 'var(--text-muted)' }} aria-label="Open navigation">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient)' }}>
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm">LazyDrop</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl px-5 py-6">
            {/* Page Intro */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight mb-1" style={{ fontFamily: "'Fira Code', monospace" }}>
                {pageTitles[tab]}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{pageDescriptions[tab]}</p>
            </div>

            {/* Summary Cards - only on dashboard */}
            {tab === 'dashboard' && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <SummaryCard
                  icon={<FileText className="w-4 h-4" />}
                  label="Total files"
                  value={stats.files.total_files}
                />
                <SummaryCard
                  icon={<Download className="w-4 h-4" />}
                  label="Downloads"
                  value={stats.files.total_downloads}
                />
                <SummaryCard
                  icon={<Cloud className="w-4 h-4" />}
                  label="Buckets"
                  value={stats.providers.total_providers}
                />
                <SummaryCard
                  icon={<HardDrive className="w-4 h-4" />}
                  label="Storage"
                  value={cap > 0 ? `${formatBytes(used)} / ${formatBytes(cap)}` : '—'}
                  accent={pct > 80 ? '#f59e0b' : undefined}
                  progress={pct > 0 ? pct : undefined}
                />
              </div>
            )}

            {/* Main Content */}
            {loading ? (
              <div className="flex flex-col items-center py-24 gap-4">
                <Loader2 className="w-8 h-8 motion-safe:animate-spin" style={{ color: 'var(--primary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading&#8230;</p>
              </div>
            ) : <div key={tab} className="tab-content">
            <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 motion-safe:animate-spin" style={{ color: 'var(--primary)' }} /></div>}>
            {tab === 'dashboard' ? <AdminDashboard files={files} token={token!} onRefresh={refresh} onNotify={notify} />
            : tab === 'users' ? <AdminUsers token={token!} onNotify={notify} />
            : tab === 'storage' ? <AdminStorage providers={providers} token={token!} onRefresh={refresh} onNotify={notify} />
            : tab === 'security' ? <AdminSecurity token={token!} onNotify={notify} onCredentialsChanged={() => { logout(); nav('/admin/login'); }} />
            : tab === 'api-keys' ? <AdminApiKeys token={token!} onNotify={notify} />
            : tab === 'audit-log' ? <AdminAuditLog token={token!} onNotify={notify} />
            : tab === 'scan' ? <AdminScan token={token!} onNotify={notify} />
            : tab === 'system' ? <AdminSystem token={token!} onNotify={notify} />
            : <AdminAdvanced token={token!} onNotify={notify} />}
            </Suspense>
            </div>}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notif && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium animate-fade-up ${notifExiting ? 'toast-exit' : ''}`}
          role="alert"
          aria-live="assertive"
          style={{
            background: notif.type === 'success' ? 'var(--success)14' : 'var(--danger)14',
            border: `1px solid ${notif.type === 'success' ? 'var(--success)33' : 'var(--danger)33'}`,
            color: notif.type === 'success' ? 'var(--success)' : 'var(--danger)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {notif.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notif.msg}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, accent, progress }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
  progress?: number;
}) {
  const { colors } = useTheme();
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="text-xl font-bold tracking-tight" style={{ color: accent || 'var(--text)' }}>{value}</div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--text)08' }}>
          <div
            className="h-full rounded-full transition-transform duration-700"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: progress > 90
                ? `linear-gradient(90deg, var(--warning), var(--danger))`
                : `linear-gradient(90deg, var(--success), var(--accent))`,
            }}
          />
        </div>
      )}
    </div>
  );
}