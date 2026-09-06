import { Link } from 'react-router-dom';
import { Zap, Shield, Cloud, ArrowRight, Lock, Orbit, Database, Network, Smartphone, Upload, Download } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

export default function Landing() {
  const { colors } = useTheme();

  return (
    <div className="min-h-screen overflow-hidden relative grid-bg" style={{ color: colors.text }}>
      <div className="scanline-overlay" />

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full blur-[120px] sm:blur-[150px] animate-float-slow" style={{ background: colors.orb1 }} />
        <div className="absolute bottom-[-20%] right-[5%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[120px] sm:blur-[150px] animate-float-slow" style={{ background: colors.orb2, animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full blur-[100px] sm:blur-[120px] animate-float" style={{ background: colors.orb3, animationDelay: '4s' }} />
      </div>

      {/* Rotating rings - hidden on mobile for performance */}
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.03]">
        <div className="w-full h-full rounded-full border animate-rotate-slow" style={{ borderColor: colors.primary }} />
        <div className="absolute inset-8 rounded-full border animate-rotate-slow" style={{ borderColor: colors.secondary, animationDirection: 'reverse', animationDuration: '30s' }} />
        <div className="absolute inset-16 rounded-full border animate-rotate-slow" style={{ borderColor: colors.accent, animationDuration: '25s' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-6">
        <div className="flex items-center gap-2 sm:gap-3 animate-fade-in-left">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center animate-glow-pulse" style={{ background: colors.gradient }}>
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.bg }} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-gradient-sci">LazyDrop</span>
            <div className="h-px mt-0.5" style={{ background: `linear-gradient(to right, ${colors.primary}80, transparent)` }} />
          </div>
        </div>
        <Link
          to="/admin"
          className="group flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all border ripple-effect animate-fade-in-up"
          style={{ color: colors.textMuted, borderColor: colors.border }}
          onMouseEnter={() => sounds.hover()}
          onClick={() => sounds.click()}
        >
          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Admin
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-12 sm:pt-20 md:pt-32 pb-16 sm:pb-20">
        <div
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm mb-6 sm:mb-8 animate-fade-in-up corner-accent"
          style={{ background: colors.primaryGlow, border: `1px solid ${colors.primary}30`, color: colors.primary }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: colors.primary }} />
          Multi-account storage routing
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1] sm:leading-[1.05] mb-4 sm:mb-6 animate-fade-in-up delay-200" style={{ color: colors.text }}>
          Fast, private,
          <br />
          <span className="text-gradient-sci">link-only file sharing</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl max-w-xl mb-8 sm:mb-10 leading-relaxed animate-fade-in-up delay-300 px-2" style={{ color: colors.textMuted }}>
          Upload once, share with a link. No browsing, no searching, no noise.
          Files are stored across multiple buckets for unlimited capacity.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in-up delay-400 w-full sm:w-auto">
          <Link
            to="/admin"
            className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-sm btn-sci"
            style={{ background: colors.gradient, color: colors.bg }}
            onMouseEnter={() => sounds.hover()}
            onClick={() => sounds.click()}
          >
            Go to Admin Panel
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border font-medium text-sm transition-all ripple-effect"
            style={{ borderColor: colors.border, color: colors.text }}
            onMouseEnter={() => sounds.hover()}
          >
            Learn more
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
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
          <FeatureCard
            icon={<Smartphone className="w-5 h-5" />}
            title="Mobile friendly"
            desc="Upload and download files from any device. Fully responsive design for phones and tablets."
            delay="400"
          />
          <FeatureCard
            icon={<Upload className="w-5 h-5" />}
            title="Drag & drop"
            desc="Simply drag files onto the upload zone. No complicated interfaces, just drop and share."
            delay="500"
          />
          <FeatureCard
            icon={<Download className="w-5 h-5" />}
            title="Instant downloads"
            desc="Recipients get a direct download link. No signup required, no waiting, no ads."
            delay="600"
          />
        </div>
      </section>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${colors.primary}30, transparent)` }} />

      {/* Footer */}
      <footer className="relative z-10 border-t px-4 sm:px-6 py-6 sm:py-8 text-center" style={{ borderColor: colors.border }}>
        <p className="text-xs sm:text-sm flex items-center justify-center gap-2" style={{ color: colors.textDim }}>
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
      className="group p-4 sm:p-6 rounded-2xl card-sci corner-accent animate-fade-in-up ripple-effect"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => sounds.hover()}
    >
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-all duration-300"
        style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}20`, color: colors.primary }}
      >
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2" style={{ color: colors.text }}>{title}</h3>
      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: colors.textMuted }}>{desc}</p>
    </div>
  );
}
