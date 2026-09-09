import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { useTheme } from '@/lib/theme';
import { formatBytes } from '@/lib/api';

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface StorageAnalyticsProps {
  files: Array<{ created_at: string; file_size: number }>;
  providers: Array<{ current_bytes: number; max_bytes: number; provider_name: string }>;
  totalDownloads: number;
}

export default function StorageAnalytics({ files, providers, totalDownloads }: StorageAnalyticsProps) {
  const { colors } = useTheme();

  const uploadsByDay = useMemo(() => {
    const counts: Record<string, { count: number; size: number }> = {};
    files.forEach((f) => {
      const day = f.created_at.split('T')[0];
      if (!counts[day]) counts[day] = { count: 0, size: 0 };
      counts[day].count++;
      counts[day].size += f.file_size;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([name, data]) => ({ name, uploads: data.count, size: data.size }));
  }, [files]);

  const providerUsage = useMemo(() => {
    return providers.map((p) => ({
      name: p.provider_name.length > 15 ? p.provider_name.slice(0, 12) + '...' : p.provider_name,
      used: p.current_bytes,
      capacity: p.max_bytes,
      pct: p.max_bytes > 0 ? (p.current_bytes / p.max_bytes) * 100 : 0,
    }));
  }, [providers]);

  const downloadsByDay = useMemo(() => {
    return [
      { name: 'Mon', downloads: 0 },
      { name: 'Tue', downloads: 0 },
      { name: 'Wed', downloads: 0 },
      { name: 'Thu', downloads: 0 },
      { name: 'Fri', downloads: 0 },
      { name: 'Sat', downloads: 0 },
      { name: 'Sun', downloads: 0 },
    ];
  }, []);

  const totalUsed = providers.reduce((sum, p) => sum + p.current_bytes, 0);
  const totalCap = providers.reduce((sum, p) => sum + p.max_bytes, 0);

  const chartColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart className="w-4 h-4" style={{ color: '#22c55e' }} />
            Uploads (Last 30 Days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uploadsByDay} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: colors.textDim, fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: colors.textDim, fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: number) => [value.toLocaleString(), 'uploads']}
                />
                <Bar dataKey="uploads" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <LineChart className="w-4 h-4" style={{ color: '#3b82f6' }} />
            Storage Growth (Last 30 Days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uploadsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: colors.textDim, fontSize: 10 }} />
                <YAxis tick={{ fill: colors.textDim, fontSize: 10 }} tickFormatter={(v) => formatBytes(v)} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: number) => [formatBytes(value), 'cumulative']}
                />
                <Area type="monotone" dataKey="size" stroke="#3b82f6" fillOpacity={0.2} fill="url(#colorStorage)" />
                <defs>
                  <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BarChart className="w-4 h-4" style={{ color: '#f59e0b' }} />
          Provider Usage
        </h3>
        <div className="space-y-3">
          {providerUsage.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-xs font-mono w-32 truncate" style={{ color: colors.textMuted }}>{p.name}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(p.pct, 100)}%`,
                    background: `linear-gradient(90deg, ${chartColors[i % chartColors.length]}, ${chartColors[(i + 1) % chartColors.length]})`,
                  }}
                />
              </div>
              <span className="text-xs font-mono w-24 text-right" style={{ color: p.pct > 90 ? '#f59e0b' : colors.textMuted }}>
                {p.pct.toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono w-28 text-right" style={{ color: colors.textDim }}>
                {formatBytes(p.used)} / {formatBytes(p.capacity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
              <BarChart className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>Total Files</span>
          </div>
          <p className="text-xl font-bold">{files.length.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <LineChart className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>Total Storage</span>
          </div>
          <p className="text-xl font-bold">{formatBytes(totalUsed)} / {formatBytes(totalCap)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <Download className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>Total Downloads</span>
          </div>
          <p className="text-xl font-bold">{totalDownloads.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
              <BarChart className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>Providers</span>
          </div>
          <p className="text-xl font-bold">{providers.length}</p>
        </div>
      </div>
    </div>
  );
}