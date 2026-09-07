import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Lock, Database, Shield, Upload, Download, Smartphone, Layers,
  Clock, Globe, Zap, ChevronDown, HardDrive, Cloud
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';
import LandingRocket from '@/components/LandingRocket';

const faqs = [
  { q: 'How does file sharing work?', a: 'Upload a file, get a unique link. Anyone with the link can download. No accounts needed on the recipient side.' },
  { q: 'What storage providers are supported?', a: 'Backblaze B2, Cloudflare R2, AWS S3, Google Cloud Storage, IDrive e2, and MinIO — all S3-compatible.' },
  { q: 'Is there a file size limit?', a: 'No hard limit. Files are streamed directly to your cloud buckets. Practical limits depend on your internet connection.' },
  { q: 'How does multi-bucket routing work?', a: 'LazyDrop automatically routes files to the bucket with the most free space. Add multiple providers for unlimited pooled storage.' },
  { q: 'Are files encrypted?', a: 'Yes. All files are encrypted at rest in your cloud buckets, and transferred over HTTPS. LazyDrop never sees your files in plain text.' },
];

export default function Landing() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => { api.getSettings().then(setSettings).catch(() => {}); }, []);
  useEffect(() => { if (settings?.siteName) document.title = `${settings.siteName} — Fast, private file sharing`; }, [settings]);

  const name = settings?.siteName || 'LazyDrop';

  return (
    <div className="min-h-screen" style={{ color: colors.text }}>
      {/* Announcement Bar */}
      <div
        className="text-xs text-center py-2 font-medium"
        role="status"
        aria-live="polite"
        style={{ background: `${colors.primary}10`, borderBottom: `1px solid ${colors.border}` }}
      >
        Open source and free forever — no accounts, no tracking, no limits.
      </div>

      {/* Site Header */}
      <nav aria-label="Main navigation" className="sticky top-0 z-30" style={{ background: `${colors.bg}cc`, borderBottom: `1px solid ${colors.border}`, backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => sounds.click()} aria-label={`${name} — home`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.gradient }} aria-hidden="true">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight">{name}</span>
          </Link>
          <div className="hidden md:flex items-center gap-6" role="list">
            <a href="#features" className="text-sm font-medium" style={{ color: colors.textMuted }}>Features</a>
            <a href="#how-it-works" className="text-sm font-medium" style={{ color: colors.textMuted }}>How it works</a>
            <a href="#providers" className="text-sm font-medium" style={{ color: colors.textMuted }}>Providers</a>
            <a href="#faq" className="text-sm font-medium" style={{ color: colors.textMuted }}>FAQ</a>
          </div>
          <Link to="/admin" className="btn btn-ghost text-sm" onClick={() => sounds.click()} aria-label="Admin login">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Admin
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto text-center px-5 pt-20 pb-16 sm:pt-28 sm:pb-20" aria-labelledby="hero-heading">
          <div className="badge mx-auto mb-6 animate-fade-up">Multi-provider storage</div>
          <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5 animate-fade-up delay-100">
            Fast, private,
            <br />
            <span className="text-gradient">link-only file sharing</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed animate-fade-up delay-200" style={{ color: colors.textMuted }}>
            Upload once, share with a link. Files stored across multiple cloud providers for unlimited capacity.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
            <Link to="/admin" className="btn btn-primary" onClick={() => sounds.click()}>
              Get started
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <a href="#features" className="btn btn-secondary">See features</a>
          </div>
          <p className="text-xs mt-4 font-mono animate-fade-up delay-400" style={{ color: colors.textDim }}>
            No signup required — works with any S3-compatible bucket
          </p>
        </section>

        {/* Product Tour — Rocket Animation */}
        <section className="max-w-3xl mx-auto px-5 pb-16" aria-label="Product tour">
          <div className="relative h-72 sm:h-80 rounded-xl overflow-hidden card">
            <LandingRocket />
          </div>
          <p className="text-center text-xs mt-3" style={{ color: colors.textDim }}>
            Secure delivery cycle — files launch, transfer, and return
          </p>
        </section>

        {/* Social Proof / Stats */}
        <section className="max-w-4xl mx-auto px-5 pb-16" aria-label="Key metrics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={<Globe className="w-4 h-4" />} value="6+" label="Providers" />
            <Stat icon={<Shield className="w-4 h-4" />} value="E2E" label="Encrypted" />
            <Stat icon={<Zap className="w-4 h-4" />} value="<1s" label="Upload" />
            <Stat icon={<Upload className="w-4 h-4" />} value="0" label="Tracking" />
          </div>
        </section>

        {/* Features — Primary Feature Section */}
        <section id="features" className="max-w-5xl mx-auto px-5 pb-20" aria-labelledby="features-heading">
          <SectionHeader
            id="features-heading"
            eyebrow="Features"
            title="Everything you need, nothing you don't"
            desc="Simple file sharing without the bloat. Connect your own cloud, share files via link, done."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-10" role="list">
            <Feature
              icon={<Database className="w-4 h-4" />}
              title="Unlimited storage"
              desc="Multiple S3 buckets pooled into one virtual drive. Add as many as you need."
            />
            <Feature
              icon={<Shield className="w-4 h-4" />}
              title="Private by design"
              desc="No public directory. Files only accessible via unique, unguessable links."
            />
            <Feature
              icon={<Upload className="w-4 h-4" />}
              title="Drag & drop"
              desc="Drag files onto the upload zone or click to browse. Done in one step."
            />
            <Feature
              icon={<Download className="w-4 h-4" />}
              title="Instant downloads"
              desc="Direct download link. No signup, no waiting, no captchas."
            />
            <Feature
              icon={<Smartphone className="w-4 h-4" />}
              title="Mobile friendly"
              desc="Upload and download from any device. Works in any modern browser."
            />
            <Feature
              icon={<Layers className="w-4 h-4" />}
              title="Multi-bucket routing"
              desc="Auto-route files to the bucket with the most free space. No manual management."
            />
            <Feature
              icon={<Clock className="w-4 h-4" />}
              title="Auto-expire"
              desc="Files auto-delete after configurable TTL. Set it once, forget about it."
            />
            <Feature
              icon={<HardDrive className="w-4 h-4" />}
              title="Provider-aware sizing"
              desc="Automatic capacity detection. Know exactly how much space you have left."
            />
            <Feature
              icon={<Zap className="w-4 h-4" />}
              title="Lightning fast"
              desc="Files served via presigned links. No bottleneck on the LazyDrop server."
            />
          </div>
        </section>

        {/* How It Works — Product Tour Section */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-5 pb-20" aria-labelledby="how-heading">
          <SectionHeader
            id="how-heading"
            eyebrow="How it works"
            title="Three steps to share a file"
            desc="Connect a bucket, upload a file, share the link. That's it."
          />
          <div className="grid sm:grid-cols-3 gap-6 mt-10" role="list">
            <Step
              number="01"
              title="Connect a bucket"
              desc="Add your S3-compatible storage provider with just a bucket name, access key, and secret key."
            />
            <Step
              number="02"
              title="Upload a file"
              desc="Drag and drop or click to upload. Files are encrypted and stored directly in your bucket."
            />
            <Step
              number="03"
              title="Share the link"
              desc="Copy the generated download link and send it to anyone. They can download instantly."
            />
          </div>
        </section>

        {/* Supported Providers — Ecosystem Section */}
        <section id="providers" className="max-w-4xl mx-auto px-5 pb-20" aria-labelledby="providers-heading">
          <SectionHeader
            id="providers-heading"
            eyebrow="Providers"
            title="Works with your cloud"
            desc="Any S3-compatible provider works. Built-in support for 6 major cloud storage providers."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-10" role="list">
            <ProviderCard name="Backblaze B2" region="us-west-004" />
            <ProviderCard name="Cloudflare R2" region="auto" />
            <ProviderCard name="AWS S3" region="us-east-1" />
            <ProviderCard name="Google Cloud" region="us-central1" />
            <ProviderCard name="IDrive e2" region="us-east-1" />
            <ProviderCard name="MinIO" region="self-hosted" />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-2xl mx-auto px-5 pb-20" aria-labelledby="faq-heading">
          <SectionHeader
            id="faq-heading"
            eyebrow="FAQ"
            title="Frequently asked questions"
          />
          <div className="mt-10 flex flex-col gap-2" role="list">
            {faqs.map((f, i) => (
              <FAQItem key={i} question={f.q} answer={f.a} />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-5 pb-20" aria-label="Call to action">
          <div
            className="card p-10 sm:p-14 text-center rounded-xl"
            style={{ background: `${colors.primary}08`, border: `1px solid ${colors.primary}20` }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Ready to share your first file?
            </h2>
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: colors.textMuted }}>
              Connect a bucket in under a minute. No accounts, no limits, no tracking.
            </p>
            <Link to="/admin" className="btn btn-primary" onClick={() => sounds.click()}>
              Open Admin Panel
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center" style={{ borderTop: `1px solid ${colors.border}` }}>
        <p className="text-sm" style={{ color: colors.textDim }}>{name} — link-only file sharing</p>
      </footer>
    </div>
  );
}

/* ──────────────────── Sub-components ──────────────────── */

function SectionHeader({ id, eyebrow, title, desc }: { id: string; eyebrow: string; title: string; desc?: string }) {
  const { colors } = useTheme();
  return (
    <div className="text-center">
      <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
        {eyebrow}
      </p>
      <h2 id={id} className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{title}</h2>
      {desc && <p className="text-sm max-w-md mx-auto" style={{ color: colors.textMuted }}>{desc}</p>}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <div className="card p-4 text-center">
      <div className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: colors.primaryGlow, color: colors.primary }} aria-hidden="true">
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-0.5" style={{ color: colors.textDim }}>{label}</div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  const { colors } = useTheme();
  return (
    <div className="card p-5" role="listitem">
      <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: colors.primaryGlow, color: colors.primary }} aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex flex-col gap-3" role="listitem">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-mono"
        style={{ background: `${colors.primary}12`, color: colors.primary }}
        aria-hidden="true"
      >
        {number}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{desc}</p>
    </div>
  );
}

function ProviderCard({ name, region }: { name: string; region: string }) {
  const { colors } = useTheme();
  return (
    <div className="card p-4 flex items-center gap-3" role="listitem">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
        aria-hidden="true"
      >
        <Cloud className="w-4 h-4" style={{ color: colors.textMuted }} />
      </div>
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-[11px] font-mono" style={{ color: colors.textDim }}>{region}</div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((prev) => !prev);
      sounds.click();
    }
  }, []);

  return (
    <div
      className="card overflow-hidden"
      role="listitem"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
        aria-expanded={open}
        onClick={() => { setOpen(!open); sounds.click(); }}
        onKeyDown={handleKeyDown}
      >
        <span className="text-sm font-medium pr-4">{question}</span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{
            color: colors.textMuted,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: colors.textMuted }} role="region">
          {answer}
        </div>
      )}
    </div>
  );
}
