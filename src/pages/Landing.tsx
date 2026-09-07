import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, ArrowRight, Lock, Database, Smartphone, Upload, Download, Loader2, Link2, Check, Globe, Layers, Rocket, Clock, Eye } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';
import LandingRocket from '@/components/LandingRocket';

export default function Landing() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (settings?.siteName) document.title = `${settings.siteName} — Fast, private file sharing`;
  }, [settings]);

  const siteName = settings?.siteName || 'LazyDrop';

  return (
    <div className="min-h-screen relative grid-bg" style={{ color: colors.text }}>
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-6">
        <div className="flex items-center gap-2 sm:gap-3 animate-fade-in-up">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center animate-glow-pulse" style={{ background: colors.gradient }}>
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.bg }} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-gradient-sci">{siteName}</span>
            <div className="h-px mt-0.5" style={{ background: `linear-gradient(to right, ${colors.primary}60, transparent)` }} />
          </div>
        </div>
        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all animate-fade-in-up delay-100" style={{ color: colors.textMuted, borderColor: colors.border }} onClick={() => sounds.click()}>
          <Lock className="w-3.5 h-3.5" />
          Admin
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-10 sm:pt-16 md:pt-24 pb-12 sm:pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm mb-5 sm:mb-6 animate-fade-in-up" style={{ background: `${colors.primary}10`, border: `1px solid ${colors.primary}25`, color: colors.primary }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colors.primary }} />
          Multi-provider storage
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight mb-4 sm:mb-5 animate-fade-in-up delay-100" style={{ color: colors.text }}>
          Fast, private,
          <br />
          <span className="text-gradient-sci">link-only file sharing</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg max-w-lg mb-6 sm:mb-8 leading-relaxed animate-fade-in-up delay-200" style={{ color: colors.textMuted }}>
          Upload once, share with a link. Files stored across multiple buckets for unlimited capacity.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-300 w-full sm:w-auto">
          <Link to="/admin" className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm btn-sci" style={{ background: colors.gradient, color: colors.bg }} onClick={() => sounds.click()}>
            Go to Admin Panel
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border font-medium text-sm transition-all" style={{ borderColor: colors.border, color: colors.text }}>
            Learn more
          </a>
        </div>
      </section>

      {/* Public quick upload */}
      {settings?.enablePublicUpload && (
        <section className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
          <QuickUpload colors={colors} />
        </section>
      )}

      {/* Rocket animation */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden card-sci">
          <LandingRocket />
        </div>
        <p className="text-center text-xs mt-3" style={{ color: colors.textDim }}>Files launch, transfer, and return — secure delivery cycle</p>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBadge icon={<Globe className="w-4 h-4" />} value="6+" label="Providers" />
          <StatBadge icon={<Shield className="w-4 h-4" />} value="E2E" label="Encrypted" />
          <StatBadge icon={<Rocket className="w-4 h-4" />} value="<1s" label="Upload" />
          <StatBadge icon={<Eye className="w-4 h-4" />} value="0" label="Tracking" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <FeatureCard icon={<Database className="w-4 h-4" />} title="Unlimited storage" desc="Multiple S3 buckets pooled into one virtual drive." />
          <FeatureCard icon={<Shield className="w-4 h-4" />} title="Private by design" desc="No public directory. Only accessible via unique link." />
          <FeatureCard icon={<Upload className="w-4 h-4" />} title="Drag & drop" desc="Simply drag files onto the upload zone. Done." />
          <FeatureCard icon={<Download className="w-4 h-4" />} title="Instant downloads" desc="Direct download link. No signup, no waiting." />
          <FeatureCard icon={<Smartphone className="w-4 h-4" />} title="Mobile friendly" desc="Upload and download from any device." />
          <FeatureCard icon={<Layers className="w-4 h-4" />} title="Multi-bucket routing" desc="Auto-route to the bucket with most free space." />
          <FeatureCard icon={<Clock className="w-4 h-4" />} title="Auto-expire" desc="Files auto-delete after configurable days." />
          <FeatureCard icon={<Globe className="w-4 h-4" />} title="6 cloud providers" desc="Backblaze, R2, AWS, GCP, IDrive, MinIO." />
          <FeatureCard icon={<Zap className="w-4 h-4" />} title="Lightning fast" desc="Files served via presigned links. No bottleneck." />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t px-4 sm:px-6 py-6 text-center" style={{ borderColor: colors.border }}>
        <p className="text-xs" style={{ color: colors.textDim }}>{siteName} — link-only file sharing</p>
      </footer>
    </div>
  );
}

function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <div className="text-center p-3 rounded-xl card-sci animate-fade-in-up">
      <div className="w-8 h-8 rounded-lg border flex items-center justify-center mx-auto mb-1.5" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}15`, color: colors.primary }}>
        {icon}
      </div>
      <div className="text-lg font-bold" style={{ color: colors.text }}>{value}</div>
      <div className="text-[10px] font-mono uppercase" style={{ color: colors.textDim }}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  const { colors } = useTheme();
  return (
    <div className="p-4 rounded-xl card-sci animate-fade-in-up">
      <div className="w-8 h-8 rounded-lg border flex items-center justify-center mb-2" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}15`, color: colors.primary }}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: colors.text }}>{title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{desc}</p>
    </div>
  );
}

function QuickUpload({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileId, setFileId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (list: FileList) => {
    if (!list.length || uploading) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    setFileId(null);
    sounds.upload();
    try {
      const res = await api.uploadPublic(list[0], (p) => { setProgress(p); });
      sounds.store();
      setFileId(res.id);
    } catch (e: unknown) {
      sounds.error();
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [uploading]);

  function copyLink() {
    if (!fileId) return;
    navigator.clipboard.writeText(`${window.location.origin}/file/${fileId}`);
    sounds.copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const link = fileId ? `${window.location.origin}/file/${fileId}` : '';

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => !uploading && inputRef.current?.click()}
      className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all"
      style={{ borderColor: dragOver ? colors.primary : colors.border, background: dragOver ? `${colors.primary}06` : colors.cardBg }}
    >
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs mb-1 font-mono" style={{ color: colors.textMuted }}>
              <span style={{ color: colors.primary }}>UPLOADING</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: colors.gradient }} />
            </div>
          </div>
        </div>
      ) : fileId ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl border flex items-center justify-center" style={{ background: `${colors.success}10`, borderColor: `${colors.success}20`, color: colors.success }}>
            <Check className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text }}>File uploaded</p>
          <div className="flex items-center gap-2 w-full max-w-sm">
            <input readOnly value={link} className="form-input text-xs font-mono" onFocus={(e) => e.target.select()} />
            <button onClick={(e) => { e.stopPropagation(); copyLink(); }} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold btn-sci flex-shrink-0" style={{ background: colors.gradient, color: colors.bg }}>
              {copied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => { setFileId(null); sounds.click(); }} className="text-xs underline" style={{ color: colors.textDim }}>Upload another</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-6 h-6" style={{ color: colors.primary }} />
          <div>
            <p className="text-sm font-medium" style={{ color: colors.text }}>Drop a file or click to upload</p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: colors.textDim }}>PUBLIC — no account needed</p>
          </div>
          {error && <p className="text-xs font-mono" style={{ color: colors.danger }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
