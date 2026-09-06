import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle, Settings, BarChart3, Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, formatBytes, FileWithProvider, StorageProvider, Stats } from '@/lib/api';
import AdminDashboard from './AdminDashboard';
import AdminStorage from './AdminStorage';
import AdminSecurity from './AdminSecurity';

type Tab = 'dashboard' | 'storage' | 'security';

export default function AdminPanel() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [files, setFiles] = useState<FileWithProvider[]>([]);
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
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
    logout();
    navigate('/');
  }

  if (!token) return null;

  const totalUsed = stats ? parseInt(stats.providers.used_bytes) : 0;
  const totalCap = stats ? parseInt(stats.providers.capacity_bytes) : 0;
  const usedPct = totalCap > 0 ? (totalUsed / totalCap) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0a0a0f]" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight">LazyDrop</span>
            <span className="text-xs text-gray-500 ml-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">View site</Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileText className="w-4 h-4" />} label="Files" value={stats ? stats.files.total_files : '—'} />
          <StatCard icon={<Download className="w-4 h-4" />} label="Downloads" value={stats ? stats.files.total_downloads : '—'} />
          <StatCard icon={<Cloud className="w-4 h-4" />} label="Buckets" value={stats ? stats.providers.total_providers : '—'} />
          <StatCard
            icon={<HardDrive className="w-4 h-4" />}
            label="Storage used"
            value={totalCap > 0 ? `${formatBytes(totalUsed)} / ${formatBytes(totalCap)}` : '—'}
            progress={usedPct}
          />
        </div>

        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
          <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon={<BarChart3 className="w-4 h-4" />}>
            Dashboard
          </TabButton>
          <TabButton active={tab === 'storage'} onClick={() => setTab('storage')} icon={<Settings className="w-4 h-4" />}>
            Storage
          </TabButton>
          <TabButton active={tab === 'security'} onClick={() => setTab('security')} icon={<Shield className="w-4 h-4" />}>
            Security
          </TabButton>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
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

      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-lg transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, progress }: { icon: React.ReactNode; label: string; value: string; progress?: number }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold truncate">{value}</div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
