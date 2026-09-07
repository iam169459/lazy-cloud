import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle, Shield, Sliders } from 'lucide-react';
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Files', icon: <FileText className="w-4 h-4" /> },
    { id: 'storage', label: 'Storage', icon: <Cloud className="w-4 h-4" /> },
    { id: 'security', label: 'Credentials', icon: <Shield className="w-4 h-4" /> },
    { id: 'advanced', label: 'Settings', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen grid-bg" style={{ color: colors.text }}>
      <header className="sticky top-0 z-20 border-b backdrop-blur-md" style={{ background: `${colors.bg}cc`, borderColor: colors.border }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm text-gradient">LazyDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs" style={{ color: colors.textDim }} onClick={() => sounds.click()}>View site</Link>
            <ThemeSwitcher />
            <button onClick={doLogout} className="text-xs flex items-center gap-1" style={{ color: colors.textDim }}>
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Mini icon={<FileText className="w-4 h-4" />} label="Files" val={stats ? stats.files.total_files : '—'} />
          <Mini icon={<Download className="w-4 h-4" />} label="Downloads" val={stats ? stats.files.total_downloads : '—'} />
          <Mini icon={<Cloud className="w-4 h-4" />} label="Buckets" val={stats ? stats.providers.total_providers : '—'} />
          <Mini icon={<HardDrive className="w-4 h-4" />} label="Used" val={cap > 0 ? `${formatBytes(used)}/${formatBytes(cap)}` : '—'} pct={pct} />
        </div>
        <div className="flex gap-1 mb-5 p-1 rounded-lg overflow-x-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); sounds.click(); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-xs font-medium transition-all whitespace-nowrap min-h-[40px]" style={{ background: tab === t.id ? 'rgba(99,102,241,0.12)' : 'transparent', color: tab === t.id ? '#818cf8' : colors.textDim }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#818cf8' }} />
            <p className="text-xs" style={{ color: colors.textDim }}>Loading...</p>
          </div>
        ) : tab === 'dashboard' ? <AdminDashboard files={files} token={token!} onRefresh={refresh} onNotify={notify} />
        : tab === 'storage' ? <AdminStorage providers={providers} token={token!} onRefresh={refresh} onNotify={notify} />
        : tab === 'security' ? <AdminSecurity token={token!} onNotify={notify} onCredentialsChanged={() => { logout(); nav('/admin/login'); }} />
        : <AdminAdvanced token={token!} onNotify={notify} />}
      </div>

      {notif && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm animate-fade-up" style={{ background: notif.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderColor: notif.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: notif.type === 'success' ? '#22c55e' : '#ef4444' }}>
          {notif.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notif.msg}
        </div>
      )}
    </div>
  );
}

function Mini({ icon, label, val, pct }: { icon: React.ReactNode; label: string; val: string; pct?: number }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: '#818cf8' }}>{icon}</span>
        <span className="text-[10px] font-mono uppercase" style={{ color: '#64748b' }}>{label}</span>
      </div>
      <div className="text-sm font-bold truncate">{val}</div>
      {pct !== undefined && (
        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        </div>
      )}
    </div>
  );
}
