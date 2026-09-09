import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, Lock, AlertCircle, Clock, Copy, Check, FileText, Image, Video, Music, Archive } from 'lucide-react';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/api';

function FileIcon({ mimeType, className = 'w-12 h-12' }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <Image className={className} style={{ color: 'var(--primary)' }} />;
  if (mimeType.startsWith('video/')) return <Video className={className} style={{ color: 'var(--accent)' }} />;
  if (mimeType.startsWith('audio/')) return <Music className={className} style={{ color: 'var(--warning)' }} />;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip') || mimeType.includes('rar') || mimeType.includes('7z')) return <Archive className={className} style={{ color: 'var(--muted)' }} />;
  return <FileText className={className} style={{ color: 'var(--muted)' }} />;
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [share, setShare] = useState<{
    shareId: string;
    file: { id: string; name: string; size: number; mimeType: string; createdAt: string };
    requiresPassword: boolean;
    expiresAt: string | null;
    downloadLimit: number | null;
    downloadsRemaining: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getShareInfo(id!)
      .then(setShare)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    try {
      const data = await api.downloadSharedFile(id!, password || undefined);
      const a = document.createElement('a');
      a.href = data.url;
      a.download = share?.file.name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = async () => {
    if (!share) return;
    const url = `${window.location.origin}/s/${share.shareId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto" style={{ color: '#ef4444' }} />
          <h1 className="text-2xl font-bold">Share Not Found</h1>
          <p className="text-sm opacity-70">{error || 'This share link is invalid or has expired.'}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();
  const isLimitReached = share.downloadLimit && share.downloadsRemaining !== null && share.downloadsRemaining <= 0;
  const canDownload = !isExpired && !isLimitReached && !share.requiresPassword;
  const canDownloadWithPassword = !isExpired && !isLimitReached && share.requiresPassword && password;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border p-8 space-y-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 rounded-xl p-4" style={{ background: 'rgba(var(--primary-rgb), 0.1)', border: '1px solid rgba(var(--primary-rgb), 0.2)' }}>
              <FileIcon mimeType={share.file.mimeType} className="w-14 h-14" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold truncate">{share.file.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm opacity-70">
                <span>{formatBytes(share.file.size)}</span>
                <span>•</span>
                <span>{formatDate(share.file.createdAt)}</span>
                {share.expiresAt && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1" style={{ color: isExpired ? '#ef4444' : 'var(--warning)' }}>
                      <Clock className="w-4 h-4" />
                      Expires {isExpired ? 'expired' : formatDate(share.expiresAt)}
                    </span>
                  </>
                )}
                {share.downloadLimit && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1" style={{ color: isLimitReached ? '#ef4444' : 'var(--muted)' }}>
                      <Download className="w-4 h-4" />
                      {isLimitReached ? 'Limit reached' : `${share.downloadsRemaining} downloads left`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {share.requiresPassword && (
            <div className="rounded-lg p-4 border" style={{ background: 'rgba(var(--warning-rgb), 0.1)', borderColor: 'rgba(var(--warning-rgb), 0.3)' }}>
              <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--warning)' }}>
                <Lock className="w-4 h-4" />
                <span>This share is password protected</span>
              </div>
              <form onSubmit={handleDownload} className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="flex-1 px-3 py-2 rounded-lg text-sm border" style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                  disabled={downloading}
                />
                <button
                  type="submit"
                  disabled={downloading || !password}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
                >
                  {downloading ? 'Downloading...' : 'Download'}
                  <Download className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {!share.requiresPassword && canDownload && (
            <form onSubmit={handleDownload}>
              <button
                type="submit"
                disabled={downloading}
                className="w-full py-3 rounded-lg text-base font-medium flex items-center justify-center gap-2" style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
              >
                {downloading ? 'Preparing download...' : 'Download File'}
                <Download className="w-5 h-5" />
              </button>
            </form>
          )}

          {(isExpired || isLimitReached) && (
            <div className="rounded-lg p-4 border text-center" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <AlertCircle className="w-5 h-5 mx-auto mb-2" />
              <p className="text-sm font-medium">{isExpired ? 'This share has expired' : 'Download limit reached'}</p>
              <p className="text-xs opacity-70 mt-1">Contact the sender for a new link</p>
            </div>
          )}

          <div className="pt-4 border-t flex items-center justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
            <button onClick={copyLink} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
              {copied ? <Check className="w-4 h-4" style={{ color: '#22c55e' }} /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>
              Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}