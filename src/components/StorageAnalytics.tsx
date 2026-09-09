import { useMemo } from 'react';
import { BarChart, LineChart, Download } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { formatBytes } from '@/lib/api';

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
      .map(([name, data]) => ({ name: name.slice(5), uploads: data.count, size: data.size }));
  }, [files]);

  const providerUsage = useMemo(() => {
    return providers.map((p) => ({
      name: p.provider_name.length > 15 ? p.provider_name.slice(0, 12) + '...' : p.provider_name,
      used: p.current_bytes,
      capacity: p.max_bytes,
      pct: p.max_bytes > 0 ? (p.current_bytes / p.max_bytes) * 100 : 0,
    }));
  }, [providers]);

  const maxUploads = Math.max(...uploadsByDay.map((d) => d.uploads), 1);
  const cumulativeSize = useMemo(() => {
    let sum = 0;
    return uploadsByDay.map((d) => ({ ...d, cumulative: (sum += d.size) }));
  }, [uploadsByDay]);
  const maxCumulative = Math.max(...cumulativeSize.map((d) => d.cumulative), 1);

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
          <div className="h-48 flex items-end gap-[2px] overflow-x-auto">
            {uploadsByDay.map((d, i) => (
              <div key={i} className="flex-1 min-w-[4px] flex flex-col items-center gap-1" title={`${d.name}: ${d.uploads} files`}>
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${(d.uploads / maxUploads) * 100}%`,
                    minHeight: d.uploads > 0 ? '4px' : '0',
                    background: 'linear-gradient(180deg, #22c55e, #16a34a)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <LineChart className="w-4 h-4" style={{ color: '#3b82f6' }} />
            Storage Growth (Last 30 Days)
          </h3>
          <div className="h-48 relative">
            <div className="absolute inset-0 flex items-end gap-[2px] overflow-x-auto">
              {cumulativeSize.map((d, i) => (
                <div key={i} className="flex-1 min-w-[4px] flex flex-col items-center" title={`${d.name}: ${formatBytes(d.cumulative)}`}>
                  <div
                    className="w-full rounded-t transition-all duration-500"
                    style={{
                      height: `${(d.cumulative / maxCumulative) * 100}%`,
                      minHeight: d.cumulative > 0 ? '4px' : '0',
                      background: 'linear-gradient(180deg, rgba(59,130,246,0.4), rgba(59,130,246,0.05))',
                    }}
                  />
                </div>
              ))}
            </div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={cumulativeSize.map((d, i) => `${(i / Math.max(cumulativeSize.length - 1, 1)) * 100}%,${100 - (d.cumulative / maxCumulative) * 100}%`).join(' ')}
              />
            </svg>
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
