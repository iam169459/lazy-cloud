import { Link } from 'react-router-dom';
import { Zap, Shield, Cloud, ArrowRight, Lock, Orbit, Database, Network } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#06060c] text-white overflow-hidden relative grid-bg">
      <div className="scanline-overlay" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-emerald-500/8 blur-[150px] animate-float-slow" />
        <div className="absolute bottom-[-20%] right-[5%] w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[150px] animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Rotating ring decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.03]">
        <div className="w-full h-full rounded-full border border-emerald-400 animate-rotate-slow" />
        <div className="absolute inset-8 rounded-full border border-cyan-400 animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
        <div className="absolute inset-16 rounded-full border border-purple-400 animate-rotate-slow" style={{ animationDuration: '25s' }} />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3 animate-fade-in-left">
          <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center glow-emerald">
            <Zap className="w-5 h-5 text-[#06060c]" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-gradient-sci">LazyDrop</span>
            <div className="h-px bg-gradient-to-r from-emerald-400/50 to-transparent mt-0.5" />
          </div>
        </div>
        <Link
          to="/admin"
          className="group flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-emerald-300 hover:bg-emerald-500/5 transition-all border border-white/10 hover:border-emerald-400/30 animate-fade-in-up"
        >
          <Lock className="w-4 h-4" />
          Admin
        </Link>
      </nav>

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-20 md:pt-32">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-sm text-emerald-300 mb-8 animate-fade-in-up glow-emerald corner-accent">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
          Multi-account storage routing
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.05] mb-6 animate-fade-in-up delay-200">
          Fast, private,
          <br />
          <span className="text-gradient-sci">
            link-only file sharing
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed animate-fade-in-up delay-300">
          Upload once, share with a link. No browsing, no searching, no noise.
          Files are stored across multiple buckets for unlimited capacity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-400">
          <Link
            to="/admin"
            className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-[#06060c] font-bold text-sm btn-sci"
          >
            Go to Admin Panel
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white font-medium text-sm hover:bg-white/5 hover:border-emerald-400/20 transition-all"
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

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
          <Network className="w-3 h-3 text-emerald-400/50" />
          LazyDrop — link-only file sharing
          <Network className="w-3 h-3 text-emerald-400/50" />
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: string }) {
  return (
    <div className={`group p-6 rounded-2xl card-sci corner-accent animate-fade-in-up`} style={{ animationDelay: `${delay}ms` }}>
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400/10 to-cyan-500/10 border border-emerald-400/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 group-hover:glow-emerald transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2 group-hover:text-emerald-300 transition-colors">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
