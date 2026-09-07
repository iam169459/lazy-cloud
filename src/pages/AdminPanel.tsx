import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle, Shield, Sliders, Scan } from 'lucide-react';
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

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Files', icon: <FileText className="w-4 h-4" /> },
  { id: 'storage', label: 'Storage', icon: <Cloud className="w-4 h-4" /> },
  { id: 'security', label: 'Credentials', icon: <Shield className="w-4 h-4" /> },
  { id: 'advanced', label: 'Settings', icon: <Sliders className="w-4 h-4" /> },
  { id: 'scan', label: 'Scan', icon: <Scan className="w-4 h-4" /> },
];

export default function AdminPanel() {
  const { token, logout } = useAuth();
  const nav = useNavigate();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('dashboard');
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

  return (
    <div className="min-h-screen" style={{ color: colors.text }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-20" style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm tracking-tight">LazyDrop</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/" className="btn btn-ghost text-xs" onClick={() => sounds.click()}>
              View site
            </Link>
            <ThemeSwitcher />
            <button onClick={doLogout} className="btn btn-ghost text-xs">
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="max-w-6xl mx-auto px-5">
        {/* Page Intro */}
        <div className="pt-6 pb-4">
          <h1 className="text-lg font-semibold tracking-tight mb-1">Dashboard</h1>
          <p className="text-sm" style={{ color: colors.textMuted }}>Manage files, storage buckets, and system settings.</p>
        </div>

        {/* Summary Cards */}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-xl mb-6" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); sounds.click(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive ? colors.cardBg : 'transparent',
                  color: isActive ? colors.primary : colors.textMuted,
                  boxShadow: isActive ? `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${colors.border}` : 'none',
                }}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="pb-12">
          {loading ? (
            <div className="flex flex-col items-center py-24 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
              <p className="text-sm" style={{ color: colors.textMuted }}>Loading dashboard...</p>
            </div>
          ) : tab === 'dashboard' ? <AdminDashboard files={files} token={token!} onRefresh={refresh} onNotify={notify} />
          : tab === 'storage' ? <AdminStorage providers={providers} token={token!} onRefresh={refresh} onNotify={notify} />
          : tab === 'security' ? <AdminSecurity token={token!} onNotify={notify} onCredentialsChanged={() => { logout(); nav('/admin/login'); }} />
          : tab === 'scan' ? <AdminScan token={token!} onNotify={notify} />
          : <AdminAdvanced token={token!} onNotify={notify} />}
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
