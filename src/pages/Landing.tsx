import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Shield, Upload, Download, Smartphone,
  Clock, Zap, ChevronDown, Globe
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';
import { GlassCard, HologramDisplay, TerminalText } from '@/components/sci-fi';

const faqs = [
  { q: 'How does file sharing work?', a: 'Upload a file, get a unique link. Anyone with the link can download. No accounts needed on the recipient side.' },
  { q: 'Is there a file size limit?', a: 'No hard limit. Files are streamed directly. Practical limits depend on your internet connection.' },
  { q: 'Are files encrypted?', a: 'Yes. All files are encrypted at rest and transferred over HTTPS. Your files stay private.' },
  { q: 'Do recipients need an account?', a: 'No. Recipients just click the link and download. No signup, no captchas, no waiting.' },
];

const features = [
  { icon: <Shield className="w-4 h-4" />, title: 'Private by design', desc: 'No public directory. Files only accessible via unique, unguessable links.' },
  { icon: <Upload className="w-4 h-4" />, title: 'Drag & drop', desc: 'Drag files onto the upload zone or click to browse. Done in one step.' },
  { icon: <Download className="w-4 h-4" />, title: 'Instant downloads', desc: 'Direct download link. No signup, no waiting, no captchas.' },
  { icon: <Smartphone className="w-4 h-4" />, title: 'Mobile friendly', desc: 'Upload and download from any device. Works in any modern browser.' },
  { icon: <Clock className="w-4 h-4" />, title: 'Auto-expire', desc: 'Files auto-delete after configurable TTL. Set it once, forget about it.' },
  { icon: <Zap className="w-4 h-4" />, title: 'Lightning fast', desc: 'Files served directly. No bottleneck, no slowdowns.' },
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
        Fast, private file sharing — no accounts, no tracking, no limits.
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
            <a href="#faq" className="text-sm font-medium" style={{ color: colors.textMuted }}>FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/login" className="btn btn-ghost text-sm" onClick={() => sounds.click()}>
              Admin
            </Link>
            <Link to="/login" className="btn btn-ghost text-sm" onClick={() => sounds.click()}>
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary text-sm" onClick={() => sounds.click()}>
              Get started
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative max-w-4xl mx-auto text-center px-5 pt-20 pb-16 sm:pt-28 sm:pb-20" aria-labelledby="hero-heading">
          <div className="hero-glow" aria-hidden="true" />
          <div className="relative">
            <div className="flex justify-center mb-6 animate-fade-up">
              <span className="status-badge status-success live" role="status">All systems online</span>
            </div>
            <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5 animate-fade-up delay-100 text-balance">
              Fast, private,
              <br />
              <span className="text-gradient">link-only file sharing</span>
            </h1>
            <p className="text-base sm:text-lg max-w-xl mx-auto mb-4 leading-relaxed animate-fade-up delay-200" style={{ color: colors.textMuted }}>
              Upload once, share with a link. Simple, secure, and instant.
            </p>
            <div className="flex justify-center mb-8 animate-fade-up delay-200">
              <TerminalText text="> secure_channel: established" speed={45} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
              <Link to="/register" className="btn btn-primary" onClick={() => sounds.click()}>
                Create account
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <a href="#features" className="btn btn-secondary">See features</a>
            </div>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="max-w-3xl mx-auto px-5 pb-16" aria-label="Stats">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={<Shield className="w-4 h-4" />} value="E2E" label="Encrypted" />
            <Stat icon={<Zap className="w-4 h-4" />} value="<1s" label="Upload" />
            <Stat icon={<Upload className="w-4 h-4" />} value="0" label="Tracking" />
            <Stat icon={<Globe className="w-4 h-4" />} value="24/7" label="Available" />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-5xl mx-auto px-5 pb-20" aria-labelledby="features-heading">
          <SectionHeader
            id="features-heading"
            eyebrow="Features"
            title="Everything you need, nothing you don't"
            desc="Simple file sharing without the bloat."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-10" role="list">
            {features.map((f, i) => (
              <Feature key={f.title} icon={f.icon} title={f.title} desc={f.desc} index={i + 1} />
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-5 pb-20" aria-labelledby="how-heading">
          <SectionHeader
            id="how-heading"
            eyebrow="How it works"
            title="Three steps to share a file"
            desc="Upload, share, done."
          />
          <div className="grid sm:grid-cols-3 gap-6 mt-10" role="list">
            <Step
              number="01"
              title="Upload a file"
              desc="Drag and drop or click to upload. Your file is encrypted and stored securely."
            />
            <Step
              number="02"
              title="Copy the link"
              desc="A unique download link is generated instantly. Copy it to your clipboard."
            />
            <Step
              number="03"
              title="Share it"
              desc="Send the link to anyone. They can download instantly — no account needed."
            />
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
          <HologramDisplay variant="scan" className="p-10 sm:p-14 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Ready to share your first file?
            </h2>
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: colors.textMuted }}>
              No accounts, no limits, no tracking.
            </p>
            <Link to="/login" className="btn btn-primary" onClick={() => sounds.click()}>
              Get Started Free
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </HologramDisplay>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center" style={{ borderTop: `1px solid ${colors.border}` }}>
        <p className="text-sm" style={{ color: colors.textDim }}>{name} — link-only file sharing</p>
        <Link to="/admin/login" className="inline-block mt-2 text-xs" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
          Admin panel
        </Link>
        <span className="mx-2 text-xs" style={{ color: colors.textDim }}>·</span>
        <a href="/lazy-cloud.html" className="inline-block mt-2 text-xs" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
          Control room
        </a>
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
    <GlassCard padding="p-4" className="text-center">
      <div className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: colors.primaryGlow, color: colors.primary }} aria-hidden="true">
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-0.5" style={{ color: colors.textDim }}>{label}</div>
    </GlassCard>
  );
}

function Feature({ icon, title, desc, index }: { icon: React.ReactNode; title: string; desc: string; index: number }) {
  const { colors } = useTheme();
  return (
    <div className="card p-5 hud-corners" role="listitem">
      <span className="absolute top-4 right-4 text-[10px] font-mono" style={{ color: colors.textDim }} aria-hidden="true">
        {String(index).padStart(2, '0')}
      </span>
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
    <div className="card overflow-hidden" role="listitem">
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
          style={{ color: colors.textMuted, transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
          aria-hidden="true"
        />
      </button>
      <div className={`faq-content ${open ? 'open' : ''}`}>
        <div>
          <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: colors.textMuted }} role="region">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}
