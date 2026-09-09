import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Check, Loader2, Link2, HardDrive, Scan, Plus, Share2, Lock, Clock, Copy, X, Download, Grid } from 'lucide-react';
import { api, formatBytes, formatDate, FileWithProvider, ShareInfo } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import DataTable, { Column, BulkAction } from '@/components/DataTable';
import UploadQueue from '@/components/UploadQueue';
import StorageAnalytics from '@/components/StorageAnalytics';

import { StorageProvider } from '@/lib/api';

interface Props {
  files: FileWithProvider[];
  providers: StorageProvider[];
  token: string;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminDashboard({ files, providers, token, onRefresh, onNotify }: Props) {
  const { colors } = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ fileId: string; shares: ShareInfo[] } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareForm, setShareForm] = useState({ password: '', expiresInDays: '', downloadLimit: '' });
  const [showUploadQueue, setShowUploadQueue] = useState(false);
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

  async function openShareModal(fileId: string) {
    sounds.click();
    setSharingId(fileId);
    try {
      const { shares } = await api.listShares(fileId, token);
      setShareModal({ fileId, shares });
    } catch (e: any) {
      onNotify('error', e.message);
    } finally {
      setSharingId(null);
    }
  }

  async function createShare(e: React.FormEvent) {
    e.preventDefault();
    if (!shareModal) return;
    setShareLoading(true);
    try {
      const result = await api.createShare(
        shareModal.fileId,
        shareForm.password || undefined,
        shareForm.expiresInDays ? parseInt(shareForm.expiresInDays) : undefined,
        shareForm.downloadLimit ? parseInt(shareForm.downloadLimit) : undefined,
        token
      );
      sounds.store();
      onNotify('success', 'Share created');
      setShareForm({ password: '', expiresInDays: '', downloadLimit: '' });
      const { shares } = await api.listShares(shareModal.fileId, token);
      setShareModal({ fileId: shareModal.fileId, shares });
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setShareLoading(false);
    }
  }

  async function deleteShare(shareId: string) {
    if (!shareModal) return;
    if (!confirm('Delete this share?')) return;
    sounds.click();
    try {
      await api.deleteShare(shareId, token);
      sounds.delete();
      onNotify('success', 'Share deleted');
      const { shares } = await api.listShares(shareModal.fileId, token);
      setShareModal({ fileId: shareModal.fileId, shares });
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    }
  }

  function copyShareLink(shareUrl: string) {
    navigator.clipboard.writeText(shareUrl);
    sounds.copy();
    onNotify('success', 'Share link copied');
  }

  function closeShareModal() {
    setShareModal(null);
    setShareForm({ password: '', expiresInDays: '', downloadLimit: '' });
  }

  const columns: Column<FileWithProvider>[] = [
    {
      key: 'original_name',
      label: 'File',
      sortable: true,
      render: (f) => {
        const isPopular = f.download_count > 10;
        const isLarge = f.file_size > 50 * 1024 * 1024;
        return (
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#22c55e' }} />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium truncate max-w-[160px]">{f.original_name}</span>
              {isPopular && <span className="status-badge status-success">Popular</span>}
              {isLarge && !isPopular && <span className="status-badge status-warning">Large</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'file_size',
      label: 'Size',
      sortable: true,
      render: (f) => <span className="text-xs font-mono whitespace-nowrap" style={{ color: colors.textMuted }}>{formatBytes(f.file_size)}</span>,
    },
    {
      key: 'provider_name',
      label: 'Bucket',
      sortable: true,
      render: (f) => (
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: colors.textMuted }}>
          {f.provider_name || '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (f) => <span className="text-xs whitespace-nowrap" style={{ color: colors.textMuted }}>{formatDate(f.created_at)}</span>,
    },
    {
      key: 'download_count',
      label: 'Downloads',
      sortable: true,
      render: (f) => <span className="text-xs font-mono" style={{ color: colors.textMuted }}>{f.download_count}</span>,
    },
  ];

  const rowActions = [
    {
      label: 'Copy link',
      icon: <Link2 className="w-3.5 h-3.5" />,
      onClick: (f) => copyLink(f.id),
    },
    {
      label: 'Share',
      icon: <Share2 className="w-3.5 h-3.5" />,
      onClick: (f) => openShareModal(f.id),
      disabled: (f) => sharingId === f.id,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (f) => del(f.id, f.original_name),
      variant: 'danger',
      disabled: (f) => deletingId === f.id,
    },
  ];

  const bulkActions: BulkAction<FileWithProvider>[] = [
    {
      label: 'Delete selected',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: async (selected) => {
        sounds.click();
        if (!confirm(`Delete ${selected.length} file(s)?`)) return;
        for (const f of selected) {
          try { await api.deleteFile(f.id, token); } catch {}
        }
        sounds.delete();
        onNotify('success', `Deleted ${selected.length} file(s)`);
        onRefresh();
      },
      variant: 'danger',
    },
    {
      label: 'Download selected',
      icon: <Download className="w-3.5 h-3.5" />,
      onClick: async (selected) => {
        sounds.click();
        for (const f of selected) {
          try {
            const data = await api.getDownloadUrl(f.id);
            const a = document.createElement('a');
            a.href = data.url;
            a.download = f.original_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(data.url);
          } catch {}
        }
        onNotify('success', `Started ${selected.length} download(s)`);
      },
    },
  ];

  const recentFiles = files.slice(0, 10);

  if (shareModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div className="glass-card w-full max-w-md animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold">Share Link</h3>
            <button onClick={closeShareModal} className="p-1 rounded-md" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={createShare} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Password (optional)</label>
              <input
                type="password"
                value={shareForm.password}
                onChange={(e) => setShareForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Leave empty for no password"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Expires in days (optional)</label>
              <input
                type="number"
                value={shareForm.expiresInDays}
                onChange={(e) => setShareForm(prev => ({ ...prev, expiresInDays: e.target.value }))}
                placeholder="e.g. 7"
                min="1"
                max="365"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Download limit (optional)</label>
              <input
                type="number"
                value={shareForm.downloadLimit}
                onChange={(e) => setShareForm(prev => ({ ...prev, downloadLimit: e.target.value }))}
                placeholder="e.g. 10"
                min="1"
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={shareLoading}
              className="btn btn-primary w-full"
            >
              {shareLoading ? 'Creating...' : 'Create Share Link'}
            </button>
          </form>

          {shareModal.shares.length > 0 && (
            <div className="px-6 pb-6">
              <h4 className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Existing Shares</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {shareModal.shares.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg" style={{ background: 'var(--input)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>{s.shareId.slice(0, 8)}...</span>
                      <button
                        onClick={() => copyShareLink(`${window.location.origin}/s/${s.shareId}`)}
                        className="p-1.5 rounded text-xs" style={{ color: 'var(--text-muted)' }}
                        title="Copy link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono mb-2" style={{ color: 'var(--text-dim)' }}>
                      {s.requiresPassword && <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}><Lock className="w-3 h-3" />Password</span>}
                      {s.expiresAt && <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><Clock className="w-3 h-3" />Expires {formatDate(s.expiresAt)}</span>}
                      {s.downloadLimit && <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{s.downloadsRemaining !== null ? `${s.downloadsRemaining}/${s.downloadLimit}` : 'Unlimited'}</span>}
                    </div>
                    <button
                      onClick={() => deleteShare(s.id)}
                      className="text-xs font-medium text-right" style={{ color: '#ef4444' }}
                    >
                      Delete share
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showUploadQueue) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 lg:items-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-2xl max-h-[80vh] lg:max-h-[600px] animate-slide-up" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <UploadQueue
            token={token}
            onClose={() => setShowUploadQueue(false)}
            onComplete={() => { onRefresh(); onNotify('success', 'Uploads completed'); }}
          />
        </div>
      </div>
    );
  }

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
          onClick={() => { sounds.click(); setShowUploadQueue(true); }}
          className="btn btn-secondary text-xs"
        >
          <Grid className="w-3.5 h-3.5" />
          Upload queue
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

      {/* Storage Analytics */}
      <StorageAnalytics files={files} providers={providers} totalDownloads={files.reduce((sum, f) => sum + f.download_count, 0)} />

      {/* Recent Activity Table */}
      <DataTable
        columns={columns}
        data={files}
        actions={rowActions}
        bulkActions={bulkActions}
        keyExtractor={(f) => f.id}
        searchPlaceholder="Search files..."
        searchKeys={['original_name', 'provider_name', 'mime_type']}
        pageSize={10}
        selectable
        emptyIcon={<FileText className="w-10 h-10" />}
        emptyTitle="No files yet"
        emptyDescription="Upload your first file to get started"
      />
    </div>
  );
}
