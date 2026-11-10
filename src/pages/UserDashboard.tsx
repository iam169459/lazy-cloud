// Hallmark · v2.0.0 — User Dashboard redesign
// Stamp: tokens.css imported via index.css
// Material: User file management, file sharing, storage monitoring
// Audience: End users managing their files
// Use: Upload, share, download, delete files; view storage
// Tone: Utilitarian/technical with editorial voice
// Genre: SaaS → modern-minimal

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HardDrive, Upload, File, Share2, Trash2, Copy, LogOut, User, Plus, Lock, Clock, Download, Loader2, X, ExternalLink, FolderOpen } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useUserAuth } from '@/lib/userAuth';
import { api, formatBytes, formatDate } from '@/lib/api';
import { sounds } from '@/lib/sounds';

interface FileRecord { id: string; original_name: string; file_size: number; mime_type: string; download_count: number; created_at: string; encrypted: boolean; }
interface ShareRecord { id: string; file_id: string; file_name: string; download_count: number; download_limit: number | null; expires_at: string | null; created_at: string; }
interface Stats { fileCount: number; shareCount: number; storageUsed: number; storageLimit: number; }

export default function UserDashboard() {
  const { colors } = useTheme();
  const { user, token, logout } = useUserAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<'files' | 'shares' | 'profile'>('files');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ fileCount: 0, shareCount: 0, storageUsed: 0, storageLimit: 10737418240 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareModal, setShareModal] = useState<string | null>(null);
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiry, setShareExpiry] = useState('');
  const [shareLimit, setShareLimit] = useState('');
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { nav('/login'); return; }
    loadData();
  }, [token]);

  const notify = useCallback((type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    sounds[type === 'success' ? 'success' : 'error']();
    setTimeout(() => setNotif(null), 3000);
  }, []);

  async function loadData() {
    if (!token) return;
    try {
      const [f, s, st] = await Promise.all([
        api.getUserFiles(token),
        api.getUserShares(token),
        api.getUserStats(token),
      ]);
      setFiles(f);
      setShares(s);
      setStats(st);
    } catch (e: any) {
      notify('error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true); setProgress(0);
    try {
      await api.userUpload(file, token, setProgress);
      sounds.success();
      notify('success', 'File uploaded');
      await loadData();
    } catch (err: any) {
      sounds.error();
      notify('error', err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(fileId: string) {
    if (!token || !confirm('Delete this file?')) return;
    try {
      await api.deleteUserFile(fileId, token);
      sounds.click();
      notify('success', 'File deleted');
      await loadData();
    } catch (err: any) { notify('error', err.message); }
  }

  async function handleCreateShare() {
    if (!token || !shareModal) return;
    try {
      const opts: any = {};
      if (sharePassword) opts.password = sharePassword;
      if (shareExpiry) opts.expiresInDays = Number(shareExpiry);
      if (shareLimit) opts.downloadLimit = Number(shareLimit);
      const result = await api.createUserShare(token, shareModal, opts);
      sounds.success();
      const url = `${window.location.origin}/s/${result.share.id}`;
      await navigator.clipboard.writeText(url);
      notify('success', 'Share link copied!');
      setShareModal(null);
      setSharePassword('');
      setShareExpiry('');
      setShareLimit('');
      await loadData();
    } catch (err: any) { notify('error', err.message); }
  }

  async function handleDeleteShare(shareId: string) {
    if (!token) return;
    try {
      await api.deleteUserShare(shareId, token);
      sounds.click();
      notify('success', 'Share removed');
      await loadData();
    } catch (err: any) { notify('error', err.message); }
  }

  function handleLogout() {
    logout();
    nav('/');
  }

  const storagePct = stats.storageLimit > 0 ? Math.min((stats.storageUsed / stats.storageLimit) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="w-6 h-6 motion-safe:animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Notification */}
      {notif && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-sm font-medium animate-scale-in" style={{
          background: notif.type === 'success' ? 'var(--success)18' : 'var(--danger)18',
          color: notif.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${notif.type === 'success' ? 'var(--success)33' : 'var(--danger)33'}`
        }}>
          {notif.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg)cc', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient)' }}>
            <FolderOpen className="w-4 h-4" style={{ color: 'var(--bg)' }} />
          </div>
          <h1 className="text-sm font-bold" style={{ color: 'var(--text)' }}>LazyDrop</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono hidden sm:block" style={{ color: 'var(--text-dim)' }}>
            <User className="w-3 h-3 inline mr-1" />{user?.username}
          </span>
          <button onClick={handleLogout} className="p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: 'var(--text-dim)' }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="card p-4">
            <File className="w-5 h-5 mb-2" style={{ color: 'var(--primary)' }} />
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stats.fileCount}</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Files</p>
          </div>
          <div className="card p-4">
            <Share2 className="w-5 h-5 mb-2" style={{ color: 'var(--accent)' }} />
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stats.shareCount}</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Shares</p>
          </div>
          <div className="card p-4 col-span-2 md:col-span-1">
            <HardDrive className="w-5 h-5 mb-2" style={{ color: 'var(--success)' }} />
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{formatBytes(stats.storageUsed)}</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>of {formatBytes(stats.storageLimit)}</p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--text)10' }}>
              <div className="h-full rounded-full transition-transform" style={{ width: `${storagePct}%`, background: storagePct > 90 ? 'var(--danger)' : 'var(--primary)' }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--text)08' }}>
          {([
            ['files', 'My Files', File],
            ['shares', 'Shares', Share2],
            ['profile', 'Profile', User],
          ] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key as any)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{
              background: tab === key ? 'var(--card-bg)' : 'transparent',
              color: tab === key ? 'var(--primary)' : 'var(--text-dim)',
              boxShadow: tab === key ? '0 1px 3px var(--text)10' : 'none'
            }}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Files Tab */}
        {tab === 'files' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>My Files</h2>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-primary flex items-center gap-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--gradient)', color: 'var(--bg)' }}>
                {uploading ? <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? `${progress}%` : 'Upload'}
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            </div>

            {files.length === 0 ? (
              <div className="text-center py-16 card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text)30' }} />
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No files yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text)40' }}>Upload your first file to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    <File className="w-5 h-5 shrink-0" style={{ color: 'var(--primary)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{f.original_name}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{formatBytes(f.file_size)} · {formatDate(f.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShareModal(f.id)} className="p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{ color: 'var(--text-dim)' }} title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <a href={`/file/${f.id}`} target="_blank" rel="noopener" className="p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{ color: 'var(--text-dim)' }} title="Download link">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => handleDelete(f.id)} className="p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{ color: 'var(--danger)' }} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shares Tab */}
        {tab === 'shares' && (
          <div>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Active Shares</h2>
            {shares.length === 0 ? (
              <div className="text-center py-16 card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <Share2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text)30' }} />
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No shares yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text)40' }}>Create a share from your files</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    <Share2 className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{s.file_name}</p>
                      <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                        <span><Download className="w-3 h-3 inline" /> {s.download_count}{s.download_limit ? `/${s.download_limit}` : ''}</span>
                        {s.expires_at && <span><Clock className="w-3 h-3 inline" /> {formatDate(s.expires_at)}</span>}
                      </div>
                    </div>
                    <button onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/s/${s.id}`); notify('success', 'Copied!'); }} className="p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{ color: 'var(--text-dim)' }} title="Copy link">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteShare(s.id)} className="p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{ color: 'var(--danger)' }} title="Delete share">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="card p-6 max-w-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Profile</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Username</span><span className="font-mono" style={{ color: 'var(--text)' }}>{user?.username}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Email</span><span className="font-mono" style={{ color: 'var(--text)' }}>{user?.email || '—'}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Role</span><span className="font-mono" style={{ color: 'var(--primary)' }}>{user?.role}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Storage</span><span className="font-mono" style={{ color: 'var(--text)' }}>{formatBytes(stats.storageUsed)} / {formatBytes(stats.storageLimit)}</span></div>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary w-full mt-6 flex items-center justify-center gap-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        )}

        {/* Share Modal */}
        {shareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="card w-full max-w-sm p-6 animate-scale-in" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Create Share Link</h3>
                <button onClick={() => setShareModal(null)} className="p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{ color: 'var(--text-dim)' }}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Password (optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
                    <input type="password" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} className="input w-full pl-9 text-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }} placeholder="Optional password" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Expires in days</label>
                    <input type="number" value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)} className="input w-full text-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }} placeholder="Never" min="1" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Download limit</label>
                    <input type="number" value={shareLimit} onChange={(e) => setShareLimit(e.target.value)} className="input w-full text-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }} placeholder="Unlimited" min="1" />
                  </div>
                </div>
                <button onClick={handleCreateShare} className="btn btn-primary w-full text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:scale-95" style={{ background: 'var(--gradient)', color: 'var(--bg)' }}>
                  Create & Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}