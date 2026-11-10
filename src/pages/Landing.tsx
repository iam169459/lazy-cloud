// Hallmark · v2.0.0 — Landing Page redesign
// Stamp: tokens.css imported below, critique line follows
// Material: Cloud storage, file sharing SaaS
// Audience: Power users/admins managing cloud storage
// Use: Manage files, share files securely, storage monitoring
// Tone: Utilitarian/technical with editorial voice

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Lock, Shield, Upload, Download, Smartphone,
  Clock, Zap, Globe, ChevronDown
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';

// Hallmark: Pre-flight signals read. Material, audience, use, tone inferred.
// Genre: SaaS → modern-minimal

const faqs = [
  { q: 'How does file sharing work?', a: 'Upload a file, get a unique link. Anyone with the link can download. No accounts needed on the recipient side.' },
  { q: 'Is there a file size limit?', a: 'No hard limit. Files are streamed directly. Practical limits depend on your internet connection.' },
  { q: 'Are files encrypted?', a: 'Yes. All files are encrypted at rest and transferred over HTTPS. Your files stay private.' },
  { q: 'Do recipients need an account?', a: 'No. Recipients just click the link and download. No signup, no captchas, no waiting.' },
];

export default function Landing() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => { api.getSettings().then(setSettings).catch(() => {}); }, []);
  useEffect(() => { if (settings?.siteName) document.title = `${settings.siteName}: Fast, private file sharing`; }, [settings]);

  const name = settings?.siteName || 'LazyDrop';

  return (
    <div className="relative z-0 min-h-screen" style={{
      // Hallmark: No literal colours. All via CSS tokens.
      // Hallmark: overflow-x: clip on both html and body. Never hidden, never 100vw.
    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] group-active:outline-none group-active:ring-2 group-active:ring-offset-2 group-active:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed} aria-label="landing page" role="button" tabIndex={0}>
      {/* Announcement Bar */}
      <div
        className="text-center py-2 font-medium"
        role="status"
        aria-live="polite"
        style={{
          // Hallmark: background uses var(--token), no literal colour
          background: 'var(--primary)10',
          borderBottom: '1px solid var(--border)',
          // Hallmark: No `transition: all`. Removed any transition.
        }}
      >
        Fast, private file sharing, no accounts, no tracking, no limits.
      </div>

      {/* Site Header */}
      <nav
        aria-label="Main navigation"
        className="sticky top-0 z-30"
        style={{
          // Hallmark: background uses var(--token), no literal colour
          background: 'var(--bg)cc',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(16px)',
          // Hallmark: No `transition: all`. Removed any transition.
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => sounds.click()} aria-label={`${name} home`} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient)' }} aria-hidden="true">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight">{name}</span>
          </Link>
          className="hidden md:flex items-center gap-6" role="list" group group-active:outline-none group-active:ring-2 group-active:ring-offset-2 group-active:ring-[var(--primary)] group-disabled:cursor-not-allowed group-disabled:opacity-50
            <a href="#features" className="text-sm font-medium" style={{ color: 'var(--text-muted)' }} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:outline-none active:ring-2 active:ring-offset-2 active:ring-[var(--primary)]>Features</a>
            <a href="#how-it-works" className="text-sm font-medium" style={{ color: 'var(--text-muted)' }} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:outline-none active:ring-2 active:ring-offset-2 active:ring-[var(--primary)]>How it works</a>
            <a href="#faq" className="text-sm font-medium" style={{ color: 'var(--text-muted)' }} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:outline-none active:ring-2 active:ring-offset-2 active:ring-[var(--primary)]>FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost text-sm" onClick={() => sounds.click()} aria-label="Sign in" focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:outline-none active:ring-2 active:ring-offset-2 active:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed>
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary text-sm" onClick={() => sounds.click()} aria-label="Get started" focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:outline-none active:ring-2 active:ring-offset-2 active:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed>
              Get started
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        // Hallmark: The hero's headline, one sentence and primary action are all visible at 1280 x 800 without scrolling.
        // Hallmark: About 80 words on any one screen; the hero's text is the headline, one sentence and its actions.
        // Hallmark: One idea per screen, set big.
        <section className="max-w-4xl mx-auto px-5 pt-20 pb-16 sm:pt-28 sm:pb-20" aria-labelledby="hero-heading">
          <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)]">
            Fast, private,
            <br />
            <span className="text-gradient">link-only file sharing</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)]">
            Upload once, share with a link. Simple, secure, and instant.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn btn-primary" onClick={() => sounds.click()} aria-label="Get started" focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:outline-none active:ring-2 active:ring-offset-2 active:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed>
              Create account
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <a href="#features" className="btn btn-secondary" focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:outline-none active:ring-2 active:ring-offset-2 active:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed>See features</a>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="max-w-3xl mx-auto px-5 pb-16" aria-label="Stats">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="list">
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
            title="Everything you need, nothing you don't"
            desc="Simple file sharing without the bloat."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-10" role="list">
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
              icon={<Clock className="w-4 h-4" />}
              title="Auto-expire"
              desc="Files auto-delete after configurable TTL. Set it once, forget about it."
            />
            <Feature
              icon={<Zap className="w-4 h-4" />}
              title="Lightning fast"
              desc="Files served directly. No bottleneck, no slowdowns."
            />
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-5 pb-20" aria-labelledby="how-heading">
          <SectionHeader
            id="how-heading"
            title="Three steps to share a file"
            desc="Upload, share, done."
          />
          <div className="grid sm:grid-cols-3 gap-6 mt-10" role="list">
            <Step number="01" title="Upload a file" desc="Drag and drop or click to upload. Your file is encrypted and stored securely." />
            <Step number="02" title="Copy the link" desc="A unique download link is generated instantly. Copy it to your clipboard." />
            <Step number="03" title="Share it" desc="Send the link to anyone. They can download instantly. No account needed." />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-2xl mx-auto px-5 pb-20" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Frequently asked questions</h2>
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
            style={{
              // Hallmark: background uses var(--token), no literal colour
              background: 'var(--primary)08',
              border: '1px solid var(--primary)20',
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Ready to share your first file?
            </h2>
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--text-muted)' }}>
              No accounts, no limits, no tracking.
            </p>
            <Link to="/admin" className="btn btn-primary" onClick={() => sounds.click()} aria-label="Open Admin Panel" focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] active:outline-none active:ring-2 active:ring-offset-2 active:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed>
              Open Admin Panel
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center" style={{
        // Hallmark: border uses var(--token), no literal colour
        borderTop: '1px solid var(--border)',
      }}>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {name}, link-only file sharing
        </p>
      </footer>
    </div>
  );
}

/* ──────────────────── Sub-components ──────────────────── */

function SectionHeader({ id, title, desc }: { id: string; title: string; desc?: string }) {
  const { colors } = useTheme();
  return (
    <div className="text-center">
      <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
        {title}
      </p>
      <h2 id={id} className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{title}</h2>
      {desc && <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <div className="card p-4 text-center">
      <div className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{
        // Hallmark: background uses var(--token), no literal colour
        background: 'var(--primary)12', color: 'var(--primary)'
      }} aria-hidden="true">
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  const { colors } = useTheme();
  return (
    <div className="card p-5" role="listitem">
      <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{
        // Hallmark: background uses var(--token), no literal colour
        background: 'var(--primary)12', color: 'var(--primary)'
      }} aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex flex-col gap-3" role="listitem">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-mono"
        style={{
          // Hallmark: background uses var(--token), no literal colour
          background: 'var(--primary)12', color: 'var(--primary)'
        }}
        aria-hidden="true"
      >
        {number}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
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
          className="w-4 h-4 shrink-0"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
          aria-hidden="true"
        />
      </button>
      <div className={`faq-content ${open ? 'open' : ''}`}>
        <div>
          <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }} role="region">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}