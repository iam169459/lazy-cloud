import { Link } from 'react-router-dom';
import { Zap, Shield, Cloud, ArrowRight, Lock } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#0a0a0f]" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight">LazyDrop</span>
        </div>
        <Link
          to="/admin"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all border border-white/10 hover:border-white/20"
        >
          <Lock className="w-4 h-4" />
          Admin
        </Link>
      </nav>

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 md:pt-32">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8 animate-[fadeIn_0.6s_ease]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Multi-account storage routing
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.05] mb-6">
          Fast, private,
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
            link-only file sharing
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed">
          Upload once, share with a link. No browsing, no searching, no noise.
          Files are stored across multiple buckets for unlimited capacity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/admin"
            className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0a0a0f] font-semibold text-sm hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] transition-all"
          >
            Go to Admin Panel
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-white font-medium text-sm hover:bg-white/5 transition-all"
          >
            Learn more
          </a>
        </div>
      </section>

      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="Lightning fast"
            desc="Files are served directly from the edge via presigned links. No server bottleneck."
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Private by design"
            desc="No public directory. Files are only accessible through their unique, unguessable link."
          />
          <FeatureCard
            icon={<Cloud className="w-5 h-5" />}
            title="Unlimited storage"
            desc="Multiple S3-compatible buckets are pooled into one virtual drive. Scale without limits."
          />
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center text-sm text-gray-500">
        LazyDrop — link-only file sharing
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

import { memo } from 'react';

const FeatureCard = memo(function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
});

export { FeatureCard };
