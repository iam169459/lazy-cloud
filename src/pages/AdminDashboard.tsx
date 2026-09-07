import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Check, Loader2, Link2, HardDrive, Scan, Plus } from 'lucide-react';
import { api, formatBytes, formatDate, FileWithProvider } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface Props {
  files: FileWithProvider[];
  token: string;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminDashboard({ files, token, onRefresh, onNotify }: Props) {
  const { colors } = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fl: FileList) => {
    if (!fl.length || uploading) return;
    setUploading(true); setProgress(0); sounds.upload();
    try {
      await api.uploadFile(fl[0], token, (p) => setProgress(p));
      sounds.store(); onNotify('success', `${fl[0].name} uploaded`); onRefresh();
    } catch (e: any) {
      sounds.error(); onNotify('error', e.message || 'Upload failed');
    } finally {
      setUploading(false); setProgress(0); if (ref.current) ref.current.value = '';
    }
  }, [uploading, token, onNotify, onRefresh]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files);
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/file/${id}`);
    sounds.copy(); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return; sounds.click(); setDeletingId(id);
    try { await api.deleteFile(id, token); sounds.delete(); onNotify('success', 'Deleted'); onRefresh(); }
    catch (e: any) { sounds.error(); onNotify('error', e.message); }
    finally { setDeletingId(null); }
  }

  const recentFiles = files.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Upload Zone — Glass Card */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && ref.current?.click()}
        className="glass-card p-6 sm:p-8 text-center cursor-pointer"
        style={{
          borderColor: dragOver ? '#22c55e' : undefined,
          transition: 'all 0.2s ease',
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload a file"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ref.current?.click(); } }}
      >
        <input ref={ref} type="file" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#22c55e' }} />
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs mb-1 font-mono" style={{ color: colors.textMuted }}>
                <span style={{ color: '#22c55e' }}>UPLOADING</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #22c55e, #3b82f6)' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6" style={{ color: '#22c55e' }} />
            <p className="text-sm font-medium">Drop a file or click to upload</p>
            <p className="text-xs font-mono" style={{ color: colors.textDim }}>Auto-routed to next available bucket</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { sounds.click(); ref.current?.click(); }}
          className="btn btn-primary text-xs"
          disabled={uploading}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload file
        </button>
        <button
          onClick={() => { sounds.click(); onNotify('success', 'Navigate to Scan tab'); }}
          className="btn btn-secondary text-xs"
        >
          <Scan className="w-3.5 h-3.5" />
          Scan buckets
        </button>
        <button
          onClick={() => { sounds.click(); onNotify('success', 'Navigate to Storage tab'); }}
          className="btn btn-secondary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add provider
        </button>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "'Fira Code', monospace" }}>
            Recent activity
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: colors.textDim }}>
            {files.length} total
          </span>
        </div>
        {recentFiles.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: colors.textDim }} />
            <p className="text-sm" style={{ color: colors.textMuted }}>No files yet</p>
            <p className="text-xs mt-1" style={{ color: colors.textDim }}>Upload your first file to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="text-left text-[10px] border-b font-mono uppercase" style={{ color: colors.textDim, borderColor: 'rgba(255,255,255,0.06)' }}>
                  <th className="px-4 py-2.5">File</th>
                  <th className="px-4 py-2.5">Size</th>
                  <th className="px-4 py-2.5 hidden md:table-cell">Bucket</th>
                  <th className="px-4 py-2.5 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-2.5 hidden sm:table-cell">Downloads</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.map((f) => {
                  const isPopular = f.download_count > 10;
                  const isLarge = f.file_size > 50 * 1024 * 1024;
                  return (
                    <tr
                      key={f.id}
                      className="border-b transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-medium truncate max-w-[160px]">{f.original_name}</span>
                            {isPopular && <span className="status-badge status-success">Popular</span>}
                            {isLarge && !isPopular && <span className="status-badge status-warning">Large</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono whitespace-nowrap" style={{ color: colors.textMuted }}>
                        {formatBytes(f.file_size)}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: colors.textMuted }}>
                          {f.provider_name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden lg:table-cell whitespace-nowrap" style={{ color: colors.textMuted }}>
                        {formatDate(f.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden sm:table-cell font-mono" style={{ color: colors.textMuted }}>
                        {f.download_count}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyLink(f.id)}
                            className="p-2 rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                            style={{ color: copiedId === f.id ? '#22c55e' : colors.textDim }}
                            aria-label={copiedId === f.id ? 'Link copied' : 'Copy download link'}
                            title={copiedId === f.id ? 'Copied!' : 'Copy link'}
                          >
                            {copiedId === f.id ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => del(f.id, f.original_name)}
                            disabled={deletingId === f.id}
                            className="p-2 rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-50 transition-colors"
                            style={{ color: colors.textDim }}
                            aria-label={`Delete ${f.original_name}`}
                            title="Delete file"
                          >
                            {deletingId === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
