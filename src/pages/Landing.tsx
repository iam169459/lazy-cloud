import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Database, Shield, Upload, Download, Smartphone, Layers, Clock, Globe, Zap } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';
import LandingRocket from '@/components/LandingRocket';

export default function Landing() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => { api.getSettings().then(setSettings).catch(() => {}); }, []);
  useEffect(() => { if (settings?.siteName) document.title = `${settings.siteName} — Fast, private file sharing`; }, [settings]);

  const name = settings?.siteName || 'LazyDrop';

  return (
    <div className="min-h-screen grid-bg" style={{ color: colors.text }}>
      {/* Nav */}
      <nav className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: `${colors.bg}cc`, borderColor: colors.border }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => sounds.click()}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gradient">{name}</span>
          </Link>
          <Link to="/admin" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all" style={{ color: colors.textMuted, border: `1px solid ${colors.border}` }} onClick={() => sounds.click()}>
            <Lock className="w-3.5 h-3.5" />
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center px-5 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="badge mx-auto mb-6 animate-fade-up">Multi-provider storage</div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-5 animate-fade-up delay-100">
          Fast, private,
          <br />
          <span className="text-gradient">link-only file sharing</span>
        </h1>
        <p className="text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed animate-fade-up delay-200" style={{ color: colors.textMuted }}>
          Upload once, share with a link. Files stored across multiple cloud providers for unlimited capacity.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
          <Link to="/admin" className="btn btn-primary" onClick={() => sounds.click()}>
            Go to Admin Panel
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#features" className="btn btn-secondary">Learn more</a>
        </div>
      </section>

      {/* Quick Upload */}
      {settings?.enablePublicUpload && (
        <section className="max-w-xl mx-auto px-5 pb-14">
          <QuickUpload />
        </section>
      )}

      {/* Rocket */}
      <section className="max-w-3xl mx-auto px-5 pb-14">
        <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden card">
          <LandingRocket />
        </div>
        <p className="text-center text-xs mt-3" style={{ color: colors.textDim }}>Secure delivery cycle — files launch, transfer, and return</p>
      </section>

      {/* Stats */}
      <section className="max-w-3xl mx-auto px-5 pb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<Globe className="w-4 h-4" />} value="6+" label="Providers" />
          <Stat icon={<Shield className="w-4 h-4" />} value="E2E" label="Encrypted" />
          <Stat icon={<Zap className="w-4 h-4" />} value="<1s" label="Upload" />
          <Stat icon={<Upload className="w-4 h-4" />} value="0" label="Tracking" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-4xl mx-auto px-5 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Feature icon={<Database className="w-4 h-4" />} title="Unlimited storage" desc="Multiple S3 buckets pooled into one virtual drive." />
          <Feature icon={<Shield className="w-4 h-4" />} title="Private by design" desc="No public directory. Only accessible via unique link." />
          <Feature icon={<Upload className="w-4 h-4" />} title="Drag & drop" desc="Simply drag files onto the upload zone. Done." />
          <Feature icon={<Download className="w-4 h-4" />} title="Instant downloads" desc="Direct download link. No signup, no waiting." />
          <Feature icon={<Smartphone className="w-4 h-4" />} title="Mobile friendly" desc="Upload and download from any device." />
          <Feature icon={<Layers className="w-4 h-4" />} title="Multi-bucket routing" desc="Auto-route to the bucket with most free space." />
          <Feature icon={<Clock className="w-4 h-4" />} title="Auto-expire" desc="Files auto-delete after configurable days." />
          <Feature icon={<Globe className="w-4 h-4" />} title="6 cloud providers" desc="Backblaze, R2, AWS, GCP, IDrive, MinIO." />
          <Feature icon={<Zap className="w-4 h-4" />} title="Lightning fast" desc="Files served via presigned links. No bottleneck." />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center" style={{ borderColor: colors.border }}>
        <p className="text-sm" style={{ color: colors.textDim }}>{name} — link-only file sharing</p>
      </footer>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card p-5">
      <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</p>
    </div>
  );
}

function QuickUpload() {
  const { colors } = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileId, setFileId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (list: FileList) => {
    if (!list.length || uploading) return;
    setUploading(true); setProgress(0); setError(null); setFileId(null);
    sounds.upload();
    try {
      const res = await api.uploadPublic(list[0], (p) => setProgress(p));
      sounds.store(); setFileId(res.id);
    } catch (e: unknown) {
      sounds.error(); setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false); if (inputRef.current) inputRef.current.value = '';
    }
  }, [uploading]);

  function copyLink() {
    if (!fileId) return;
    navigator.clipboard.writeText(`${window.location.origin}/file/${fileId}`);
    sounds.copy(); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const link = fileId ? `${window.location.origin}/file/${fileId}` : '';

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => !uploading && inputRef.current?.click()}
      className="card p-6 text-center cursor-pointer transition-all"
      style={{ borderColor: dragOver ? '#6366f1' : undefined }}
    >
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs mb-1 font-mono" style={{ color: colors.textMuted }}>
              <span style={{ color: '#818cf8' }}>UPLOADING</span><span>{progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
            </div>
          </div>
        </div>
      ) : fileId ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-sm font-medium">File uploaded</p>
          <div className="flex items-center gap-2 w-full max-w-sm">
            <input readOnly value={link} className="input text-xs font-mono" onFocus={(e) => e.target.select()} />
            <button onClick={(e) => { e.stopPropagation(); copyLink(); }} className="btn btn-primary text-xs px-4 flex-shrink-0" style={{ minHeight: 40 }}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => { setFileId(null); sounds.click(); }} className="text-xs underline" style={{ color: colors.textDim }}>Upload another</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-6 h-6" style={{ color: '#818cf8' }} />
          <div>
            <p className="text-sm font-medium">Drop a file or click to upload</p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: colors.textDim }}>PUBLIC — no account needed</p>
          </div>
          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
