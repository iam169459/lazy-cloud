import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle, Settings, BarChart3, Shield, Activity, Sliders, Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, formatBytes, FileWithProvider, StorageProvider, Stats } from '@/lib/api';
import AdminDashboard from './AdminDashboard';
import AdminStorage from './AdminStorage';
import AdminSecurity from './AdminSecurity';
import AdminAdvanced from './AdminAdvanced';
import AdminUsers from './AdminUsers';
import ThemeSwitcher from '@/components/ThemeSwitcher';

type Tab = 'dashboard' | 'storage' | 'users' | 'security' | 'advanced';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const totalUsed = stats ? parseInt(stats.providers.used_bytes || '0') : 0;
  const totalCap = stats ? parseInt(stats.providers.capacity_bytes || '0') : 0;
  const usedPct = totalCap > 0 ? (totalUsed / totalCap) * 100 : 0;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'storage', label: 'Storage', icon: <Cloud className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen grid-bg" style={{ color: colors.text }}>

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl border-b" style={{ background: `${colors.bg}cc`, borderColor: colors.border }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 animate-fade-in-left">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
              <Zap className="w-4 h-4" style={{ color: colors.bg }} strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-gradient-sci text-sm sm:text-base">LazyDrop</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest hidden sm:inline-block" style={{ color: `${colors.primary}90`, background: `${colors.primary}10`, border: `1px solid ${colors.primary}20` }}>Admin</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3 animate-fade-in-up">
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

          {/* Mobile menu button */}
          <button
            onClick={() => { setMobileMenuOpen(!mobileMenuOpen); sounds.click(); }}
            className="sm:hidden p-2 rounded-lg"
            style={{ color: colors.textMuted }}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t px-4 py-3 space-y-2 animate-slide-down" style={{ borderColor: colors.border, background: `${colors.bg}ee` }}>
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ color: colors.textMuted }} onClick={() => { sounds.click(); setMobileMenuOpen(false); }}>
              <Activity className="w-4 h-4" />
              View site
            </Link>
            <ThemeSwitcher />
            <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full" style={{ color: colors.textMuted }}>
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
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

        {/* Tabs - horizontal scroll on mobile */}
        <div className="flex gap-1 mb-6 sm:mb-8 p-1 rounded-xl w-full overflow-x-auto animate-fade-in-up delay-400" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, WebkitOverflowScrolling: 'touch' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); sounds.click(); }}
              className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0"
              style={{
                background: tab === t.id ? `${colors.primary}15` : 'transparent',
                color: tab === t.id ? colors.primary : colors.textDim,
                border: tab === t.id ? `1px solid ${colors.primary}30` : '1px solid transparent',
              }}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
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
        ) : tab === 'users' ? (
          <AdminUsers token={token!} onNotify={showNotification} />
        ) : tab === 'security' ? (
          <AdminSecurity
            token={token!}
            onNotify={showNotification}
            onCredentialsChanged={() => {
              logout();
              navigate('/admin/login');
            }}
          />
        ) : (
          <AdminAdvanced token={token!} onNotify={showNotification} />
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl border backdrop-blur-xl transition-all animate-slide-in-bottom max-w-[90vw]"
          style={{
            background: notification.type === 'success' ? `${colors.success}15` : `${colors.danger}15`,
            borderColor: notification.type === 'success' ? `${colors.success}40` : `${colors.danger}40`,
            color: notification.type === 'success' ? colors.success : colors.danger,
          }}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
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
    <div className="group p-3 sm:p-4 rounded-2xl card-sci corner-accent animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300" style={{ background: `${c}15`, borderColor: `${c}25`, color: c }}>
        {icon}
      </div>
      <div className="text-[10px] mb-1 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>{label}</div>
      <div className="text-base sm:text-lg font-bold truncate" style={{ color: colors.text }}>{value}</div>
      {progress !== undefined && (
        <div className="mt-2 sm:mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%`, background: colors.gradient }} />
        </div>
      )}
    </div>
  );
}
