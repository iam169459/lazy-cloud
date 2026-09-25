import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, X, Maximize2, Minimize2, Loader2, AlertCircle, FileText, Image, Video, Music, Archive, Code, FileType } from 'lucide-react';
import { api, formatBytes, formatDate, FileInfo } from '@/lib/api';
import { errMsg } from '@/lib/errors';

function FileIcon({ mimeType, className = 'w-12 h-12' }: { mimeType: string; className?: string }) {
  const m = (mimeType || '').toLowerCase();
  if (m.startsWith('image/')) return <Image className={className} style={{ color: 'var(--primary)' }} />;
  if (m.startsWith('video/')) return <Video className={className} style={{ color: 'var(--accent)' }} />;
  if (m.startsWith('audio/')) return <Music className={className} style={{ color: 'var(--warning)' }} />;
  if (m.includes('zip') || m.includes('tar') || m.includes('gzip') || m.includes('rar') || m.includes('7z') || m.includes('compress')) return <Archive className={className} style={{ color: 'var(--muted)' }} />;
  if (m.includes('json') || m.includes('javascript') || m.includes('typescript') || m.includes('xml') || m.includes('html') || m.includes('css') || m.includes('shell') || m.includes('python') || m.includes('sql')) return <Code className={className} style={{ color: 'var(--accent)' }} />;
  if (m.startsWith('text/') || m.includes('csv') || m.includes('markdown') || m.includes('rtf') || m.includes('pdf') || m.includes('document') || m.includes('sheet') || m.includes('presentation')) return <FileType className={className} style={{ color: 'var(--muted)' }} />;
  return <FileText className={className} style={{ color: 'var(--muted)' }} />;
}

const TEXT_TYPES = [
  'text/', 'application/json', 'application/xml', 'application/javascript', 'application/typescript',
  'application/x-yaml', 'application/yaml', 'application/toml', 'application/sql', 'application/x-sh',
  'application/csv', 'application/xhtml+xml', 'application/rtf',
];
const CODE_EXT = /\.(js|mjs|cjs|ts|tsx|jsx|py|rb|go|rs|java|c|cpp|cc|h|hpp|cs|php|swift|kt|scala|sh|bash|zsh|fish|ps1|bat|cmd|sql|html|htm|css|scss|sass|less|xml|svg|yml|yaml|toml|ini|cfg|conf|env|dockerfile|makefile|cmake|gradle|properties|gitignore|npmrc|babelrc|eslintrc|prettierrc|editorconfig|lock|log|diff|patch|md|markdown|rst|txt|text|csv|tsv|rtf|vue|svelte|astro|dart|ex|exs|erl|hrl|clj|cljs|hs|ml|mli|fs|fsx|vb|pas|d|nim|zig|r|jl|lua|pl|pm|rkt|scm|lisp|el|vim|tex|bib|org|adoc|asciidoc|brainfuck|befunge|whitespace|malbolge|)$/i;

function canPreview(mimeType: string | null | undefined): boolean {
  const m = (mimeType || '').toLowerCase();
  if (!m) return false;
  if (m.startsWith('image/') || m.startsWith('video/') || m.startsWith('audio/')) return true;
  if (m === 'application/pdf') return true;
  if (TEXT_TYPES.some(t => m === t || m.startsWith(t))) return true;
  return false;
}

function canPreviewByName(name: string, mimeType: string | null | undefined): boolean {
  if (canPreview(mimeType)) return true;
  return CODE_EXT.test(name || '');
}

function isTextLike(mimeType: string | null | undefined, name: string): boolean {
  const m = (mimeType || '').toLowerCase();
  if (m.startsWith('text/')) return true;
  if (TEXT_TYPES.some(t => m === t || m.startsWith(t))) return true;
  if (m === 'application/octet-stream' || !m) return CODE_EXT.test(name || '');
  return false;
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getFileInfo(id!)
      .then(setFile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!file) return;
    const url = `/api/preview?id=${encodeURIComponent(file.id)}`;
    setPreviewUrl(url);
    const mime = file.mime_type || '';
    if (isTextLike(mime, file.original_name)) {
      setTextLoading(true);
      fetch(url)
        .then(r => r.ok ? r.text() : Promise.reject(new Error('Failed to load')))
        .then(t => setTextContent(t.length > 500000 ? t.slice(0, 500000) + '\n\n… (truncated)' : t))
        .catch(() => setTextContent(null))
        .finally(() => setTextLoading(false));
    }
  }, [file]);

  const handleDownload = async () => {
    if (!file || downloading) return;
    setDownloading(true);
    try {
      const data = await api.getDownloadUrl(file.id);
      const a = document.createElement('a');
      a.href = data.url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      setError(errMsg(e));
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

  const mime = file.mime_type || 'application/octet-stream';
  const isPreviewable = canPreviewByName(file.original_name, mime);
  const showText = isTextLike(mime, file.original_name);

  return (
    <div className="min-h-screen" style={{ background: fullscreen ? '#000' : 'var(--bg)', color: 'var(--fg)' }}>
      {!fullscreen && (
        <header className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid var(--border)`, background: 'var(--bg)' }}>
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <X className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{file.original_name}</h1>
              <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                {formatBytes(file.file_size)} • {mime} • {formatDate(file.created_at)} • {file.download_count} downloads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} disabled={downloading} className="btn btn-primary text-xs">
              {downloading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading</> : <><Download className="w-3.5 h-3.5" /> Download</>}
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
            {mime.startsWith('image/') && (
              <img
                src={previewUrl}
                alt={file.original_name}
                className={`max-w-full max-h-full object-contain transition-all duration-300 ${fullscreen ? 'w-full h-full' : ''}`}
                style={{ imageRendering: 'auto' }}
              />
            )}
            {mime.startsWith('video/') && (
              <video
                src={previewUrl}
                controls
                className={`max-w-full max-h-full ${fullscreen ? 'w-full h-full' : ''}`}
                style={{ background: '#000' }}
                autoPlay
              />
            )}
            {mime.startsWith('audio/') && (
              <audio src={previewUrl} controls className="w-full max-w-md" autoPlay />
            )}
            {mime === 'application/pdf' && (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className={`w-full h-[80vh] ${fullscreen ? 'h-full' : ''}`}
                style={{ border: 'none', borderRadius: fullscreen ? '0' : 'var(--radius-lg)' }}
                title={file.original_name}
              />
            )}
            {showText && (
              textLoading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-dim)' }}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading text…
                </div>
              ) : textContent !== null ? (
                <pre
                  className={`w-full max-w-4xl max-h-[80vh] overflow-auto p-4 rounded-lg text-xs font-mono whitespace-pre-wrap break-words ${fullscreen ? 'h-full max-w-full' : ''}`}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                >
                  {textContent}
                </pre>
              ) : (
                <div className="glass-card p-8 text-center max-w-md w-full" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <FileIcon mimeType={mime} className="w-20 h-20 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Preview not available</h2>
                  <p className="text-sm opacity-70 mb-6">Could not load text content for this file.</p>
                  <button onClick={handleDownload} disabled={downloading} className="btn btn-primary">
                    {downloading ? 'Downloading...' : 'Download File'}
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )
            )}
          </>
        ) : (
          <div className="glass-card p-8 text-center max-w-md w-full" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <FileIcon mimeType={mime} className="w-20 h-20 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Preview not available</h2>
            <p className="text-sm opacity-70 mb-6">This file type ({mime}) cannot be previewed in the browser.</p>
            <button onClick={handleDownload} disabled={downloading} className="btn btn-primary">
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