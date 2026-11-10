// Glassmorphism · v3.0.0 — Landing Page redesign
// Stamp: tokens.css imported via index.css
// Material: Cloud storage, file sharing SaaS
// Audience: Power users/admins managing cloud storage
// Use: Manage files, share files securely, storage monitoring
// Tone: Utilitarian/technical with editorial voice
// Genre: SaaS → modern-minimal

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Lock, Shield, Upload, Download, Smartphone,
  Clock, Zap, Globe, ChevronDown
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';

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
    <div className="relative z-0 min-h-screen" style={{ color: 'var(--text)' }}>
      {/* === Atmospheric Glowing Background Orbs === */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none motion-safe:animate-float" aria-hidden="true" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none motion-safe:animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none motion-safe:animate-float" style={{ animationDelay: '4s' }} />

      {/* Announcement Bar */}
      <div
        className="text-center py-2 font-medium"
        role="status"
        aria-live="polite"
        style={{
          background: 'rgba(6, 182, 212, 0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        Fast, private file sharing, no accounts, no tracking, no limits.
      </div>

      {/* Floating Glass Navbar Pill */}
      <nav
        aria-label="Main navigation"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl mx-auto px-4 lg:static lg:translate-x-0 lg:max-w-none lg:mx-0"
      >
        <div className="rounded-2xl mx-6 mt-4 lg:mt-0 lg:mx-0 backdrop-blur-2xl bg-slate-900/60 border border-white/15 shadow-glass">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5">
            <Link to="/" className="flex items-center gap-2.5" onClick={() => sounds.click()} aria-label={`${name} — home`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-cyan-500 to-emerald-500" aria-hidden="true">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold tracking-tight">{name}</span>
            </Link>
            <div className="hidden md:flex items-center gap-6" role="list">
              <a href="#features" className="text-sm font-medium transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>Features</a>
              <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>How it works</a>
              <a href="#faq" className="text-sm font-medium transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>FAQ</a>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-glass-ghost text-sm" onClick={() => sounds.click()}>
                Sign in
              </Link>
              <Link to="/register" className="btn-glass-primary text-sm" onClick={() => sounds.click()}>
                Get started
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-5 pt-28 pb-16 sm:pt-36 sm:pb-24" aria-labelledby="hero-heading">
          <h1 id="hero-heading" className="heading-1 text-center mb-5">
            Fast, private,
            <br />
            <span className="text-gradient-brand">link-only file sharing</span>
          </h1>
          <p className="body-lg max-w-xl mx-auto mb-8 leading-relaxed text-center">
            Upload once, share with a link. Simple, secure, and instant.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-glass-primary" onClick={() => sounds.click()}>
              Create account
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <a href="#features" className="btn-glass-secondary">See features</a>
          </div>
        </section>

        {/* Stats Banner — Glass Cards with Cyan/Emerald Hover Glow */}
        <section className="max-w-3xl mx-auto px-5 pb-16" aria-label="Stats">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={<Shield className="w-4 h-4" />} value="E2E" label="Encrypted" />
            <Stat icon={<Zap className="w-4 h-4" />} value="<1s" label="Upload" />
            <Stat icon={<Upload className="w-4 h-4" />} value="0" label="Tracking" />
            <Stat icon={<Globe className="w-4 h-4" />} value="24/7" label="Available" />
          </div>
        </section>

        {/* Features — Glass Cards with Hover Glow */}
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

        {/* FAQ — Glass Accordion */}
        <section id="faq" className="max-w-2xl mx-auto px-5 pb-20" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="heading-2 text-center mb-3">Frequently asked questions</h2>
          <div className="mt-10 flex flex-col gap-2" role="list">
            {faqs.map((f, i) => (
              <FAQItem key={i} question={f.q} answer={f.a} />
            ))}
          </div>
        </section>

        {/* Final CTA — Glass Panel with Inner Highlight */}
        <section className="max-w-3xl mx-auto px-5 pb-20" aria-label="Call to action">
          <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-glass rounded-2xl p-10 sm:p-14 text-center overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:border-t before:border-white/20">
            <h2 className="heading-2 mb-3">
              Ready to share your first file?
            </h2>
            <p className="body-lg max-w-md mx-auto mb-6" style={{ color: 'var(--text-muted)' }}>
              No accounts, no limits, no tracking.
            </p>
            <Link to="/admin" className="btn-glass-primary" onClick={() => sounds.click()}>
              Open Admin Panel
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center" style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
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
  return (
    <div className="text-center">
      <h2 id={id} className="heading-2 mb-3">{title}</h2>
      {desc && <p className="body-base max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center transition-transform duration-300 hover:border-cyan-400/50 hover:shadow-glow-cyan hover:-translate-y-1 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:border-t before:border-white/20">
      <div className="w-9 h-9 rounded-lg mx-auto mb-2 flex items-center justify-center bg-cyan-500/20" style={{ color: 'var(--primary)' }} aria-hidden="true">
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-transform duration-300 hover:border-cyan-400/50 hover:shadow-glow-cyan hover:-translate-y-1 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:border-t before:border-white/20" role="listitem">
      <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center bg-cyan-500/20" style={{ color: 'var(--primary)' }} aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-3" role="listitem">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-mono"
        style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--primary)' }}
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
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((prev) => !prev);
      sounds.click();
    }
  }, []);

  return (
    <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:border-t before:border-white/20" role="listitem">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500"
        aria-expanded={open}
        onClick={() => { setOpen(!open); sounds.click(); }}
        onKeyDown={handleKeyDown}
      >
        <span className="text-sm font-medium pr-4">{question}</span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-200"
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