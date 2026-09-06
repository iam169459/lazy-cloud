import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap, LogOut, FileText, HardDrive, Download, Cloud, Loader2, Check, AlertCircle, Settings, BarChart3, Shield, Activity,
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
    <div className="min-h-screen bg-[#06060c] text-white grid-bg">
      <div className="scanline-overlay" />

      <header className="sticky top-0 z-20 bg-[#06060c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in-left">
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center glow-emerald">
              <Zap className="w-4 h-4 text-[#06060c]" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold tracking-tight text-gradient-sci">LazyDrop</span>
              <span className="text-[10px] text-emerald-400/60 ml-2 px-2 py-0.5 rounded-full bg-emerald-400/5 border border-emerald-400/10 font-mono uppercase tracking-widest">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4 animate-fade-in-up">
            <Link to="/" className="text-sm text-gray-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              View site
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileText className="w-4 h-4" />} label="Files" value={stats ? stats.files.total_files : '—'} delay="0" color="emerald" />
          <StatCard icon={<Download className="w-4 h-4" />} label="Downloads" value={stats ? stats.files.total_downloads : '—'} delay="100" color="cyan" />
          <StatCard icon={<Cloud className="w-4 h-4" />} label="Buckets" value={stats ? stats.providers.total_providers : '—'} delay="200" color="blue" />
          <StatCard
            icon={<HardDrive className="w-4 h-4" />}
            label="Storage"
            value={totalCap > 0 ? `${formatBytes(totalUsed)} / ${formatBytes(totalCap)}` : '—'}
            progress={usedPct}
            delay="300"
            color="purple"
          />
        </div>

        <div className="flex gap-1 mb-8 p-1 rounded-xl bg-white/[0.02] border border-white/5 w-fit animate-fade-in-up delay-400">
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
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-12 h-12">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
              <div className="absolute inset-0 rounded-full border border-emerald-400/20 animate-ping" />
            </div>
            <p className="text-sm text-gray-500 font-mono animate-pulse-glow">INITIALIZING...</p>
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
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl transition-all animate-slide-in-bottom ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 glow-emerald'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{notification.msg}</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, progress, delay, color }: {
  icon: React.ReactNode; label: string; value: string; progress?: number; delay: string; color: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-400/20 to-emerald-500/10 border-emerald-400/10',
    cyan: 'from-cyan-400/20 to-cyan-500/10 border-cyan-400/10',
    blue: 'from-blue-400/20 to-blue-500/10 border-blue-400/10',
    purple: 'from-purple-400/20 to-purple-500/10 border-purple-400/10',
  };
  const glows: Record<string, string> = {
    emerald: 'group-hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
    cyan: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]',
    blue: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    purple: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
  };
  const bars: Record<string, string> = {
    emerald: 'from-emerald-400 to-cyan-400',
    cyan: 'from-cyan-400 to-blue-400',
    blue: 'from-blue-400 to-purple-400',
    purple: 'from-purple-400 to-pink-400',
  };
  return (
    <div className={`group p-4 rounded-2xl card-sci corner-accent animate-fade-in-up`} style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors[color]} border flex items-center justify-center text-${color}-400 mb-3 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div className="text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold truncate">{value}</div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${bars[color]} transition-all duration-1000`}
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
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
        active
          ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 glow-emerald'
          : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {children}
      {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-emerald-400" />}
    </button>
  );
}
