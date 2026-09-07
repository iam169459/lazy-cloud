import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle, Shield, Sliders, Scan, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, formatBytes, FileWithProvider, StorageProvider, Stats } from '@/lib/api';
import AdminDashboard from './AdminDashboard';
import AdminStorage from './AdminStorage';
import AdminSecurity from './AdminSecurity';
import AdminAdvanced from './AdminAdvanced';
import AdminScan from './AdminScan';
import ThemeSwitcher from '@/components/ThemeSwitcher';

type Tab = 'dashboard' | 'storage' | 'security' | 'advanced' | 'scan';

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Files', icon: <FileText className="w-[18px] h-[18px]" /> },
  { id: 'storage', label: 'Storage', icon: <Cloud className="w-[18px] h-[18px]" /> },
  { id: 'security', label: 'Credentials', icon: <Shield className="w-[18px] h-[18px]" /> },
  { id: 'advanced', label: 'Settings', icon: <Sliders className="w-[18px] h-[18px]" /> },
  { id: 'scan', label: 'Scan', icon: <Scan className="w-[18px] h-[18px]" /> },
];

export default function AdminPanel() {
  const { token, logout } = useAuth();
  const nav = useNavigate();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [files, setFiles] = useState<FileWithProvider[]>([]);
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const notify = useCallback((type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg }); sounds[type === 'success' ? 'notification' : 'error']();
    setTimeout(() => setNotif(null), 4000);
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

  const pageTitles: Record<Tab, string> = {
    dashboard: 'Files',
    storage: 'Storage',
    security: 'Credentials',
    advanced: 'Settings',
    scan: 'Scan',
  };

  return (
    <div className="min-h-screen flex" style={{ color: colors.text }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: colors.bg, borderRight: `1px solid ${colors.border}` }}
      >
        {/* Logo */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <Link to="/" className="flex items-center gap-2.5" onClick={() => { sounds.click(); setSidebarOpen(false); }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm tracking-tight">LazyDrop</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg" style={{ color: colors.textMuted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="text-[10px] font-mono uppercase tracking-wider px-2 mb-2" style={{ color: colors.textDim }}>
            Navigation
          </div>
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); sounds.click(); setSidebarOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                  style={{
                    background: isActive ? `${colors.primary}12` : 'transparent',
                    color: isActive ? colors.primary : colors.textMuted,
                  }}
                >
                  <span style={{ color: isActive ? colors.primary : colors.textDim }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Secondary Nav */}
        <div className="px-3 py-3 shrink-0" style={{ borderTop: `1px solid ${colors.border}` }}>
          <div className="flex flex-col gap-0.5">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ color: colors.textMuted }}
              onClick={() => { sounds.click(); setSidebarOpen(false); }}
            >
              <span style={{ color: colors.textDim }}><FileText className="w-[18px] h-[18px]" /></span>
              View site
            </Link>
            <div className="flex items-center gap-3 px-3 py-2">
              <ThemeSwitcher compact />
            </div>
            <button
              onClick={() => { doLogout(); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={{ color: colors.textMuted }}
            >
              <span style={{ color: colors.textDim }}><LogOut className="w-[18px] h-[18px]" /></span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 px-5 flex items-center justify-between shrink-0 lg:hidden" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg" style={{ color: colors.textMuted }}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
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
              <h1 className="text-xl font-semibold tracking-tight mb-1">{pageTitles[tab]}</h1>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {tab === 'dashboard' && 'Upload, manage, and share your files.'}
                {tab === 'storage' && 'Connect and manage S3-compatible storage buckets.'}
                {tab === 'security' && 'Update admin credentials and security settings.'}
                {tab === 'advanced' && 'Configure themes, file TTL, and system preferences.'}
                {tab === 'scan' && 'Scan storage buckets for orphaned or mismatched files.'}
              </p>
            </div>

            {/* Summary Cards - only on dashboard */}
            {tab === 'dashboard' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <SummaryCard
                  icon={<FileText className="w-4 h-4" />}
                  label="Total files"
                  value={stats ? stats.files.total_files : '—'}
                />
                <SummaryCard
                  icon={<Download className="w-4 h-4" />}
                  label="Downloads"
                  value={stats ? stats.files.total_downloads : '—'}
                />
                <SummaryCard
                  icon={<Cloud className="w-4 h-4" />}
                  label="Buckets"
                  value={stats ? stats.providers.total_providers : '—'}
                />
                <SummaryCard
                  icon={<HardDrive className="w-4 h-4" />}
                  label="Storage"
                  value={cap > 0 ? `${formatBytes(used)} / ${formatBytes(cap)}` : '—'}
                  accent={pct > 80 ? colors.warning : undefined}
                  progress={pct > 0 ? pct : undefined}
                />
              </div>
            )}

            {/* Main Content */}
            {loading ? (
              <div className="flex flex-col items-center py-24 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
                <p className="text-sm" style={{ color: colors.textMuted }}>Loading...</p>
              </div>
            ) : tab === 'dashboard' ? <AdminDashboard files={files} token={token!} onRefresh={refresh} onNotify={notify} />
            : tab === 'storage' ? <AdminStorage providers={providers} token={token!} onRefresh={refresh} onNotify={notify} />
            : tab === 'security' ? <AdminSecurity token={token!} onNotify={notify} onCredentialsChanged={() => { logout(); nav('/admin/login'); }} />
            : tab === 'scan' ? <AdminScan token={token!} onNotify={notify} />
            : <AdminAdvanced token={token!} onNotify={notify} />}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notif && (
        <div
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium animate-fade-up"
          style={{
            background: notif.type === 'success' ? `${colors.success}12` : `${colors.danger}12`,
            border: `1px solid ${notif.type === 'success' ? `${colors.success}25` : `${colors.danger}25`}`,
            color: notif.type === 'success' ? colors.success : colors.danger,
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
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.primaryGlow, color: colors.primary }}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: colors.textMuted }}>{label}</span>
      </div>
      <div className="text-xl font-bold tracking-tight" style={{ color: accent || colors.text }}>{value}</div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: progress > 90
                ? `linear-gradient(90deg, ${colors.warning}, ${colors.danger})`
                : colors.gradient,
            }}
          />
        </div>
      )}
    </div>
  );
}
