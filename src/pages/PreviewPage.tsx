import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, X, Maximize2, Minimize2, Loader2, AlertCircle, FileText, Image, Video, Music, Archive } from 'lucide-react';
import { api, formatBytes, formatDate } from '@/lib/api';

function FileIcon({ mimeType, className = 'w-12 h-12' }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <Image className={className} style={{ color: 'var(--primary)' }} />;
  if (mimeType.startsWith('video/')) return <Video className={className} style={{ color: 'var(--accent)' }} />;
  if (mimeType.startsWith('audio/')) return <Music className={className} style={{ color: 'var(--warning)' }} />;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip') || mimeType.includes('rar') || mimeType.includes('7z')) return <Archive className={className} style={{ color: 'var(--muted)' }} />;
  return <FileText className={className} style={{ color: 'var(--muted)' }} />;
}

function canPreview(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/') || mimeType === 'application/pdf';
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
    downloadCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getFileInfo(id!)
      .then(setFile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (file) {
      const url = `/api/preview?id=${encodeURIComponent(file.id)}`;
      setPreviewUrl(url);
    }
  }, [file]);

  const handleDownload = async () => {
    if (!file || downloading) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const data = await api.getDownloadUrl(file.id);
      const a = document.createElement('a');
      a.href = data.url;
      a.download = file.name;
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

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto" style={{ color: '#ef4444' }} />
          <h1 className="text-2xl font-bold">File Not Found</h1>
          <p className="text-sm opacity-70">{error || 'This file does not exist or has been removed.'}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isPreviewable = canPreview(file.mimeType);

  return (
    <div className="min-h-screen" style={{ background: fullscreen ? '#000' : 'var(--bg)', color: 'var(--fg)' }}>
      {!fullscreen && (
        <header className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid var(--border)`, background: 'var(--bg)' }}>
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <X className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{file.name}</h1>
              <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                {formatBytes(file.size)} • {file.mimeType} • {formatDate(file.createdAt)} • {file.downloadCount} downloads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-primary text-xs"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {downloadProgress}% Downloading
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download
                </>
              )}
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="p-2 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--card)', border: '1px solid var(--border)' }}
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 flex items-center justify-center p-4 transition-all duration-300 ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {isPreviewable && previewUrl ? (
          <>
            {file.mimeType.startsWith('image/') && (
              <img
                src={previewUrl}
                alt={file.name}
                className={`max-w-full max-h-full object-contain transition-all duration-300 ${fullscreen ? 'w-full h-full' : ''}`}
                style={{ imageRendering: 'auto' }}
              />
            )}
            {file.mimeType.startsWith('video/') && (
              <video
                src={previewUrl}
                controls
                className={`max-w-full max-h-full ${fullscreen ? 'w-full h-full' : ''}`}
                style={{ background: '#000' }}
                autoPlay
              />
            )}
            {file.mimeType.startsWith('audio/') && (
              <audio
                src={previewUrl}
                controls
                className="w-full max-w-md"
                autoPlay
              />
            )}
            {file.mimeType === 'application/pdf' && (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className={`w-full h-[80vh] ${fullscreen ? 'h-full' : ''}`}
                style={{ border: 'none', borderRadius: fullscreen ? '0' : 'var(--radius-lg)' }}
                title={file.name}
              />
            )}
          </>
        ) : (
          <div className="glass-card p-8 text-center max-w-md w-full" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <FileIcon mimeType={file.mimeType} className="w-20 h-20 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Preview not available</h2>
            <p className="text-sm opacity-70 mb-6">This file type ({file.mimeType}) cannot be previewed in the browser.</p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-primary"
            >
              {downloading ? 'Downloading...' : 'Download File'}
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg"
          style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--fg)', backdropFilter: 'blur(20px)' }}
          aria-label="Exit fullscreen"
        >
          <Minimize2 className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}