import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle, Settings, BarChart3, Shield, Activity,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, formatBytes, FileWithProvider, StorageProvider, Stats } from '@/lib/api';
import AdminDashboard from './AdminDashboard';
import AdminStorage from './AdminStorage';
import AdminSecurity from './AdminSecurity';
import ThemeSwitcher from '@/components/ThemeSwitcher';

type Tab = 'dashboard' | 'storage' | 'security';

export default function AdminPanel() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [files, setFiles] = useState<FileWithProvider[]>([]);
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    sounds[type === 'success' ? 'notification' : 'error']();
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const refreshAll = useCallback(async () => {
    if (!token) return;
    try {
      const [s, f, p] = await Promise.all([
        api.getStats(token),
        api.listFiles(token),
        api.listProviders(token),
      ]);
      setStats(s);
      setFiles(f.files);
      setProviders(p.providers);
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setLoading(false);
    }
  }, [token, showNotification]);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    refreshAll();
  }, [token, navigate, refreshAll]);

  function handleLogout() {
    sounds.click();
    logout();
    navigate('/');
  }

  if (!token) return null;

  const totalUsed = stats ? parseInt(stats.providers.used_bytes) : 0;
  const totalCap = stats ? parseInt(stats.providers.capacity_bytes) : 0;
  const usedPct = totalCap > 0 ? (totalUsed / totalCap) * 100 : 0;

  return (
    <div className="min-h-screen grid-bg" style={{ color: colors.text }}>
      <div className="scanline-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl border-b" style={{ background: `${colors.bg}cc`, borderColor: colors.border }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in-left">
            <div className="relative w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
              <Zap className="w-4 h-4" style={{ color: colors.bg }} strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-gradient-sci">LazyDrop</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest" style={{ color: `${colors.primary}90`, background: `${colors.primary}10`, border: `1px solid ${colors.primary}20` }}>Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3 animate-fade-in-up">
            <Link to="/" className="text-sm flex items-center gap-1.5 transition-colors" style={{ color: colors.textMuted }} onClick={() => sounds.click()}>
              <Activity className="w-3 h-3" />
              View site
            </Link>
            <ThemeSwitcher />
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: colors.textMuted }}>
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileText className="w-4 h-4" />} label="Files" value={stats ? stats.files.total_files : '—'} delay="0" colorKey="emerald" />
          <StatCard icon={<Download className="w-4 h-4" />} label="Downloads" value={stats ? stats.files.total_downloads : '—'} delay="100" colorKey="cyan" />
          <StatCard icon={<Cloud className="w-4 h-4" />} label="Buckets" value={stats ? stats.providers.total_providers : '—'} delay="200" colorKey="blue" />
          <StatCard
            icon={<HardDrive className="w-4 h-4" />}
            label="Storage"
            value={totalCap > 0 ? `${formatBytes(totalUsed)} / ${formatBytes(totalCap)}` : '—'}
            progress={usedPct}
            delay="300"
            colorKey="purple"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit animate-fade-in-up delay-400" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <TabButton active={tab === 'dashboard'} onClick={() => { setTab('dashboard'); sounds.click(); }} icon={<BarChart3 className="w-4 h-4" />}>
            Dashboard
          </TabButton>
          <TabButton active={tab === 'storage'} onClick={() => { setTab('storage'); sounds.click(); }} icon={<Settings className="w-4 h-4" />}>
            Storage
          </TabButton>
          <TabButton active={tab === 'security'} onClick={() => { setTab('security'); sounds.click(); }} icon={<Shield className="w-4 h-4" />}>
            Security
          </TabButton>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-12 h-12">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: colors.primary }} />
              <div className="absolute inset-0 rounded-full border animate-ping" style={{ borderColor: `${colors.primary}20` }} />
            </div>
            <p className="text-sm font-mono animate-pulse-glow" style={{ color: colors.textMuted }}>INITIALIZING...</p>
          </div>
        ) : tab === 'dashboard' ? (
          <AdminDashboard files={files} token={token!} onRefresh={refreshAll} onNotify={showNotification} />
        ) : tab === 'storage' ? (
          <AdminStorage providers={providers} token={token!} onRefresh={refreshAll} onNotify={showNotification} />
        ) : (
          <AdminSecurity
            token={token!}
            onNotify={showNotification}
            onCredentialsChanged={() => {
              logout();
              navigate('/admin/login');
            }}
          />
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl transition-all animate-slide-in-bottom"
          style={{
            background: notification.type === 'success' ? `${colors.success}15` : `${colors.danger}15`,
            borderColor: notification.type === 'success' ? `${colors.success}40` : `${colors.danger}40`,
            color: notification.type === 'success' ? colors.success : colors.danger,
          }}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{notification.msg}</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, progress, delay, colorKey }: {
  icon: React.ReactNode; label: string; value: string; progress?: number; delay: string; colorKey: string;
}) {
  const { colors } = useTheme();
  const colorMap: Record<string, string> = {
    emerald: colors.primary,
    cyan: colors.secondary,
    blue: colors.accent,
    purple: '#a855f7',
  };
  const c = colorMap[colorKey] || colors.primary;

  return (
    <div className="group p-4 rounded-2xl card-sci corner-accent animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-9 h-9 rounded-lg border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300" style={{ background: `${c}15`, borderColor: `${c}25`, color: c }}>
        {icon}
      </div>
      <div className="text-[10px] mb-1 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>{label}</div>
      <div className="text-lg font-bold truncate" style={{ color: colors.text }}>{value}</div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%`, background: colors.gradient }} />
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
      style={{
        background: active ? `${colors.primary}15` : 'transparent',
        color: active ? colors.primary : colors.textDim,
        border: active ? `1px solid ${colors.primary}30` : '1px solid transparent',
      }}
    >
      {icon}
      {children}
    </button>
  );
}
