import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle, Settings, Shield, Sliders } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, formatBytes, FileWithProvider, StorageProvider, Stats } from '@/lib/api';
import AdminDashboard from './AdminDashboard';
import AdminStorage from './AdminStorage';
import AdminSecurity from './AdminSecurity';
import AdminAdvanced from './AdminAdvanced';
import ThemeSwitcher from '@/components/ThemeSwitcher';

type Tab = 'dashboard' | 'storage' | 'security' | 'advanced';

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
      const [s, f, p] = await Promise.all([api.getStats(token), api.listFiles(token), api.listProviders(token)]);
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
    if (!token) { navigate('/admin/login'); return; }
    refreshAll();
  }, [token, navigate, refreshAll]);

  function handleLogout() { sounds.click(); logout(); navigate('/'); }

  if (!token) return null;

  const totalUsed = stats ? parseInt(stats.providers.used_bytes || '0') : 0;
  const totalCap = stats ? parseInt(stats.providers.capacity_bytes || '0') : 0;
  const usedPct = totalCap > 0 ? (totalUsed / totalCap) * 100 : 0;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Files', icon: <FileText className="w-4 h-4" /> },
    { id: 'storage', label: 'Storage', icon: <Cloud className="w-4 h-4" /> },
    { id: 'security', label: 'Credentials', icon: <Shield className="w-4 h-4" /> },
    { id: 'advanced', label: 'Settings', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen grid-bg" style={{ color: colors.text }}>
      <header className="sticky top-0 z-20 border-b" style={{ background: `${colors.bg}dd`, borderColor: colors.border, backdropFilter: 'blur(8px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }}>
              <Zap className="w-4 h-4" style={{ color: colors.bg }} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-gradient-sci">LazyDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs" style={{ color: colors.textDim }} onClick={() => sounds.click()}>View site</Link>
            <ThemeSwitcher />
            <button onClick={handleLogout} className="text-xs flex items-center gap-1" style={{ color: colors.textDim }}>
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <MiniStat icon={<FileText className="w-4 h-4" />} label="Files" value={stats ? stats.files.total_files : '—'} />
          <MiniStat icon={<Download className="w-4 h-4" />} label="Downloads" value={stats ? stats.files.total_downloads : '—'} />
          <MiniStat icon={<Cloud className="w-4 h-4" />} label="Buckets" value={stats ? stats.providers.total_providers : '—'} />
          <MiniStat icon={<HardDrive className="w-4 h-4" />} label="Used" value={totalCap > 0 ? `${formatBytes(totalUsed)}/${formatBytes(totalCap)}` : '—'} progress={usedPct} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg overflow-x-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); sounds.click(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap" style={{ background: tab === t.id ? `${colors.primary}12` : 'transparent', color: tab === t.id ? colors.primary : colors.textDim }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            <p className="text-xs font-mono" style={{ color: colors.textDim }}>Loading...</p>
          </div>
        ) : tab === 'dashboard' ? (
          <AdminDashboard files={files} token={token!} onRefresh={refreshAll} onNotify={showNotification} />
        ) : tab === 'storage' ? (
          <AdminStorage providers={providers} token={token!} onRefresh={refreshAll} onNotify={showNotification} />
        ) : tab === 'security' ? (
          <AdminSecurity token={token!} onNotify={showNotification} onCredentialsChanged={() => { logout(); navigate('/admin/login'); }} />
        ) : (
          <AdminAdvanced token={token!} onNotify={showNotification} />
        )}
      </div>

      {notification && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm animate-fade-in-up" style={{ background: notification.type === 'success' ? `${colors.success}12` : `${colors.danger}12`, borderColor: notification.type === 'success' ? `${colors.success}30` : `${colors.danger}30`, color: notification.type === 'success' ? colors.success : colors.danger }}>
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.msg}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, progress }: { icon: React.ReactNode; label: string; value: string; progress?: number }) {
  const { colors } = useTheme();
  return (
    <div className="p-3 rounded-xl card-sci">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: colors.primary }}>{icon}</span>
        <span className="text-[10px] font-mono uppercase" style={{ color: colors.textDim }}>{label}</span>
      </div>
      <div className="text-sm font-bold truncate" style={{ color: colors.text }}>{value}</div>
      {progress !== undefined && (
        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: colors.gradient }} />
        </div>
      )}
    </div>
  );
}
