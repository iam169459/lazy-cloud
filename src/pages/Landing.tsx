import { Link } from 'react-router-dom';
import { Zap, Shield, Cloud, ArrowRight, Lock, Orbit, Database, Network, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

export default function Landing() {
  const { colors } = useTheme();

  return (
    <div className="min-h-screen text-white overflow-hidden relative grid-bg">
      <div className="scanline-overlay" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full blur-[150px] animate-float-slow" style={{ background: colors.orb1 }} />
        <div className="absolute bottom-[-20%] right-[5%] w-[500px] h-[500px] rounded-full blur-[150px] animate-float-slow" style={{ background: colors.orb2, animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full blur-[120px] animate-float" style={{ background: colors.orb3, animationDelay: '4s' }} />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.03]">
        <div className="w-full h-full rounded-full border animate-rotate-slow" style={{ borderColor: colors.primary }} />
        <div className="absolute inset-8 rounded-full border animate-rotate-slow" style={{ borderColor: colors.secondary, animationDirection: 'reverse', animationDuration: '30s' }} />
        <div className="absolute inset-16 rounded-full border animate-rotate-slow" style={{ borderColor: colors.accent, animationDuration: '25s' }} />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3 animate-fade-in-left">
          <div className="relative w-10 h-10 rounded-lg flex items-center justify-center animate-glow-pulse" style={{ background: colors.gradient }}>
            <Zap className="w-5 h-5" style={{ color: colors.bg }} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-gradient-sci">LazyDrop</span>
            <div className="h-px mt-0.5" style={{ background: `linear-gradient(to right, ${colors.primary}80, transparent)` }} />
          </div>
        </div>
        <Link
          to="/admin"
          className="group flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all border ripple-effect animate-fade-in-up"
          style={{ color: colors.textMuted, borderColor: colors.border }}
          onMouseEnter={() => sounds.hover()}
          onClick={() => sounds.click()}
        >
          <Lock className="w-4 h-4" />
          Admin
        </Link>
      </nav>

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-20 md:pt-32">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8 animate-fade-in-up corner-accent" style={{ background: colors.primaryGlow, border: `1px solid ${colors.primary}30`, color: colors.primary }}>
          <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: colors.primary }} />
          Multi-account storage routing
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.05] mb-6 animate-fade-in-up delay-200">
          Fast, private,
          <br />
          <span className="text-gradient-sci">link-only file sharing</span>
        </h1>

        <p className="text-lg md:text-xl max-w-xl mb-10 leading-relaxed animate-fade-in-up delay-300" style={{ color: colors.textMuted }}>
          Upload once, share with a link. No browsing, no searching, no noise.
          Files are stored across multiple buckets for unlimited capacity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-400">
          <Link
            to="/admin"
            className="group flex items-center gap-2 px-8 py-4 rounded-xl text-[#06060c] font-bold text-sm btn-sci"
            style={{ background: colors.gradient }}
            onMouseEnter={() => sounds.hover()}
            onClick={() => sounds.click()}
          >
            Go to Admin Panel
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-8 py-4 rounded-xl border font-medium text-sm transition-all ripple-effect"
            style={{ borderColor: colors.border, color: colors.text }}
            onMouseEnter={() => sounds.hover()}
          >
            Learn more
          </a>
        </div>
      </section>

      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Orbit className="w-5 h-5" />}
            title="Lightning fast"
            desc="Files are served directly from the edge via presigned links. No server bottleneck."
            delay="100"
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Private by design"
            desc="No public directory. Files are only accessible through their unique, unguessable link."
            delay="200"
          />
          <FeatureCard
            icon={<Database className="w-5 h-5" />}
            title="Unlimited storage"
            desc="Multiple S3-compatible buckets are pooled into one virtual drive. Scale without limits."
            delay="300"
          />
        </div>
      </section>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${colors.primary}30, transparent)` }} />

      <footer className="relative z-10 border-t px-6 py-8 text-center" style={{ borderColor: colors.border }}>
        <p className="text-sm flex items-center justify-center gap-2" style={{ color: colors.textDim }}>
          <Network className="w-3 h-3" style={{ color: `${colors.primary}80` }} />
          LazyDrop — link-only file sharing
          <Network className="w-3 h-3" style={{ color: `${colors.primary}80` }} />
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: string }) {
  const { colors } = useTheme();
  return (
    <div
      className="group p-6 rounded-2xl card-sci corner-accent animate-fade-in-up ripple-effect"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => sounds.hover()}
    >
      <div
        className="w-11 h-11 rounded-xl border flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300"
        style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}20`, color: colors.primary }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: colors.text }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{desc}</p>
    </div>
  );
}
