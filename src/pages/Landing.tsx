import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Cloud, ArrowRight, Lock, Orbit, Database, Network, Smartphone, Upload, Download, Loader2, Link2, Check, Globe, Cpu, FileCode, Layers, Rocket, Clock, Eye } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';
import LandingRocket from '@/components/LandingRocket';
import { useTilt3D } from '@/lib/useTilt3D';

export default function Landing() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (settings?.siteName) document.title = `${settings.siteName} — Fast, private file sharing`;
  }, [settings]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const siteName = settings?.siteName || 'LazyDrop';
  const heroParallax = Math.min(scrollY * 0.15, 60);

  return (
    <div className="min-h-screen overflow-hidden relative grid-bg perspective-scene" style={{ color: colors.text }}>
      {/* Background orbs with 3D depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none preserve-3d">
        <div className="absolute top-[-20%] left-[10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full blur-[120px] sm:blur-[150px] animate-float-slow" style={{ background: colors.orb1, transform: `translateZ(-80px) translateY(${-heroParallax * 0.5}px)` }} />
        <div className="absolute bottom-[-20%] right-[5%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[120px] sm:blur-[150px] animate-float-slow" style={{ background: colors.orb2, animationDelay: '2s', transform: `translateZ(-60px) translateY(${-heroParallax * 0.3}px)` }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full blur-[100px] sm:blur-[120px] animate-float" style={{ background: colors.orb3, animationDelay: '4s', transform: `translateZ(-40px)` }} />
        {/* Rising data particles */}
        <div className="absolute inset-0 hidden sm:block">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="absolute rounded-full landing-particle" style={{ background: colors.primary, width: 2 + (i % 3), height: 2 + (i % 3), left: `${5 + ((i * 7) % 90)}%`, bottom: `-${(i * 13) % 30}%`, opacity: 0, animationDuration: `${12 + (i % 5) * 4}s`, animationDelay: `${(i % 6) * 2.2}s` }} />
          ))}
        </div>
      </div>

      {/* 3D Perspective grid floor */}
      <div className="perspective-grid" style={{ opacity: 0.25 }} />

      {/* 3D Orbiting rings */}
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none preserve-3d" style={{ width: 700, height: 700 }}>
        <div className="ring-3d ring-3d-1 absolute inset-0" style={{ borderColor: `${colors.primary}15` }} />
        <div className="ring-3d ring-3d-2 absolute inset-[40px]" style={{ borderColor: `${colors.secondary}12` }} />
        <div className="ring-3d ring-3d-3 absolute inset-[80px]" style={{ borderColor: `${colors.accent}10` }} />
        {/* Dots on rings */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-3d ring-3d-1" style={{ background: colors.primary, boxShadow: `0 0 8px ${colors.primaryGlow}` }} />
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ring-3d ring-3d-2" style={{ background: colors.secondary, boxShadow: `0 0 6px ${colors.secondary}60` }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-6" style={{ transform: `translateZ(${40 + heroParallax * 0.2}px)` }}>
        <div className="flex items-center gap-2 sm:gap-3 animate-fade-in-left">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center animate-glow-pulse float-3d" style={{ background: colors.gradient }}>
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.bg }} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-gradient-sci">{siteName}</span>
            <div className="h-px mt-0.5" style={{ background: `linear-gradient(to right, ${colors.primary}80, transparent)` }} />
          </div>
        </div>
        <Link to="/admin" className="group flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all border ripple-effect animate-fade-in-up" style={{ color: colors.textMuted, borderColor: colors.border }} onMouseEnter={() => sounds.hover()} onClick={() => sounds.click()}>
          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Admin
        </Link>
      </nav>

      {/* Hero with 3D depth layers */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-12 sm:pt-20 md:pt-32 pb-16 sm:pb-20 preserve-3d" style={{ transform: `translateZ(0px)` }}>
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm mb-6 sm:mb-8 animate-fade-in-up corner-accent float-3d" style={{ background: colors.primaryGlow, border: `1px solid ${colors.primary}30`, color: colors.primary, transform: `translateZ(50px) translateY(${-heroParallax * 0.4}px)` }}>
          <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: colors.primary }} />
          Multi-account storage routing
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1] sm:leading-[1.05] mb-4 sm:mb-6 animate-fade-in-up delay-200" style={{ color: colors.text, transform: `translateZ(70px) translateY(${-heroParallax * 0.5}px)` }}>
          Fast, private,
          <br />
          <span className="text-gradient-sci">link-only file sharing</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl max-w-xl mb-8 sm:mb-10 leading-relaxed animate-fade-in-up delay-300 px-2" style={{ color: colors.textMuted, transform: `translateZ(40px) translateY(${-heroParallax * 0.3}px)` }}>
          Upload once, share with a link. No browsing, no searching, no noise.
          Files are stored across multiple buckets for unlimited capacity.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in-up delay-400 w-full sm:w-auto" style={{ transform: `translateZ(30px) translateY(${-heroParallax * 0.2}px)` }}>
          <Link to="/admin" className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-sm btn-sci" style={{ background: colors.gradient, color: colors.bg }} onMouseEnter={() => sounds.hover()} onClick={() => sounds.click()}>
            Go to Admin Panel
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border font-medium text-sm transition-all ripple-effect" style={{ borderColor: colors.border, color: colors.text }} onMouseEnter={() => sounds.hover()}>
            Learn more
          </a>
        </div>
      </section>

      {/* Public quick upload */}
      {settings?.enablePublicUpload && (
        <section className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24" style={{ transform: `translateZ(20px)` }}>
          <QuickUpload colors={colors} />
        </section>
      )}

      {/* Rocket Transfer Animation — Earth → Moon → Return */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24" style={{ transform: `translateZ(15px)` }}>
        <div className="relative h-80 sm:h-[26rem] rounded-2xl overflow-hidden card-sci corner-accent tilt-card" id="rocket-card">
          <div className="tilt-shine" />
          {/* Stars */}
          <div className="absolute inset-0">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="absolute rounded-full" style={{ background: colors.text, width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: 0.1 + Math.random() * 0.25, animation: `pulse-glow ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 3}s infinite` }} />
            ))}
          </div>

          {/* Earth */}
          <div className="absolute bottom-[6%] left-[12%]">
            <div className="w-28 h-14 rounded-t-full" style={{ background: `linear-gradient(180deg, ${colors.accent}, ${colors.primary})`, opacity: 0.4 }}>
              <div className="w-full h-full rounded-t-full" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
            </div>
            <span className="text-[9px] font-mono block text-center mt-1" style={{ color: colors.textDim }}>EARTH</span>
          </div>

          {/* Moon */}
          <div className="absolute top-[8%] right-[14%]">
            <div className="w-14 h-14 rounded-full landing-moon" style={{ background: `radial-gradient(circle at 35% 35%, #d1d5db, #6b7280)`, opacity: 0.35 }}>
              <div className="absolute top-2 left-2.5 w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
              <div className="absolute bottom-2.5 right-2 w-2 h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }} />
            </div>
            <span className="text-[9px] font-mono block text-center mt-1" style={{ color: colors.textDim }}>MOON</span>
          </div>

          {/* HUD chips */}
          <div className="absolute top-6 left-[6%] flex flex-col gap-2 pointer-events-none">
            <span className="text-[9px] font-mono px-2 py-1 rounded border landing-chip" style={{ borderColor: `${colors.primary}25`, background: `${colors.bg}55`, color: colors.primary, animationDelay: '0.5s' }}>LINK READY</span>
            <span className="text-[9px] font-mono px-2 py-1 rounded border landing-chip" style={{ borderColor: `${colors.secondary}25`, background: `${colors.bg}55`, color: colors.secondary, animationDelay: '1.8s' }}>EGRESS 0</span>
          </div>

          {/* Rocket — JS-driven 60fps */}
          <LandingRocket />
        </div>

        <div className="mt-6 text-center">
          <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: colors.text }}>Rocket-fast delivery cycle</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: colors.textMuted }}>Files launch from Earth, transfer to the Moon, and return — a continuous cycle of secure delivery</p>
        </div>
      </section>

      {/* Stats with 3D floating */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 preserve-3d" style={{ perspective: 1000 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBadge3D icon={<Globe className="w-5 h-5" />} value="6+" label="Cloud Providers" delay="0" rotateY={-5} />
          <StatBadge3D icon={<Shield className="w-5 h-5" />} value="E2E" label="Encrypted Links" delay="100" rotateY={-2} />
          <StatBadge3D icon={<Rocket className="w-5 h-5" />} value="<1s" label="Upload Speed" delay="200" rotateY={2} />
          <StatBadge3D icon={<Eye className="w-5 h-5" />} value="0" label="Data Collection" delay="300" rotateY={5} />
        </div>
      </section>

      {/* Features with 3D tilt */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          <TiltFeatureCard icon={<Orbit className="w-5 h-5" />} title="Lightning fast" desc="Files are served directly from the edge via presigned links. No server bottleneck." delay="100" />
          <TiltFeatureCard icon={<Shield className="w-5 h-5" />} title="Private by design" desc="No public directory. Files are only accessible through their unique, unguessable link." delay="200" />
          <TiltFeatureCard icon={<Database className="w-5 h-5" />} title="Unlimited storage" desc="Multiple S3-compatible buckets are pooled into one virtual drive. Scale without limits." delay="300" />
          <TiltFeatureCard icon={<Smartphone className="w-5 h-5" />} title="Mobile friendly" desc="Upload and download files from any device. Fully responsive design for phones and tablets." delay="400" />
          <TiltFeatureCard icon={<Upload className="w-5 h-5" />} title="Drag & drop" desc="Simply drag files onto the upload zone. No complicated interfaces, just drop and share." delay="500" />
          <TiltFeatureCard icon={<Download className="w-5 h-5" />} title="Instant downloads" desc="Recipients get a direct download link. No signup required, no waiting, no ads." delay="600" />
          <TiltFeatureCard icon={<Clock className="w-5 h-5" />} title="Auto-expire files" desc="Set files to auto-delete after a configurable number of days. No manual cleanup needed." delay="700" />
          <TiltFeatureCard icon={<FileCode className="w-5 h-5" />} title="Type restrictions" desc="Whitelist allowed MIME types per bucket. Block unwanted file types automatically." delay="800" />
          <TiltFeatureCard icon={<Layers className="w-5 h-5" />} title="Multi-bucket routing" desc="Files are automatically routed to the bucket with the most free space. Load balanced." delay="900" />
        </div>
      </section>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${colors.primary}30, transparent)` }} />

      {/* Footer */}
      <footer className="relative z-10 border-t px-4 sm:px-6 py-6 sm:py-8 text-center" style={{ borderColor: colors.border }}>
        <p className="text-xs sm:text-sm flex items-center justify-center gap-2" style={{ color: colors.textDim }}>
          <Network className="w-3 h-3" style={{ color: `${colors.primary}80` }} />
          {siteName} — link-only file sharing
          <Network className="w-3 h-3" style={{ color: `${colors.primary}80` }} />
        </p>
      </footer>
    </div>
  );
}

function StatBadge3D({ icon, value, label, delay, rotateY }: { icon: React.ReactNode; value: string; label: string; delay: string; rotateY: number }) {
  const { colors } = useTheme();
  const tilt = useTilt3D<HTMLDivElement>({ maxTilt: 12, scale: 1.06 });
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className="text-center p-4 rounded-2xl card-sci corner-accent animate-fade-in-up tilt-card"
      style={{ ...tilt.style, animationDelay: `${delay}ms`, transform: `perspective(800px) rotateY(${rotateY}deg)` }}
    >
      <div className="tilt-shine" />
      <div className="w-10 h-10 rounded-xl border flex items-center justify-center mx-auto mb-2" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}20`, color: colors.primary }}>
        {icon}
      </div>
      <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.text }}>{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>{label}</div>
    </div>
  );
}

function TiltFeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: string }) {
  const { colors } = useTheme();
  const tilt = useTilt3D<HTMLDivElement>({ maxTilt: 10, scale: 1.03 });
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className="group p-4 sm:p-6 rounded-2xl card-sci corner-accent animate-fade-in-up ripple-effect tilt-card"
      style={{ ...tilt.style, animationDelay: `${delay}ms` }}
      onMouseEnter={() => sounds.hover()}
    >
      <div className="tilt-shine" />
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-all duration-300" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}20`, color: colors.primary }}>
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2" style={{ color: colors.text }}>{title}</h3>
      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: colors.textMuted }}>{desc}</p>
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
  const tilt = useTilt3D<HTMLDivElement>({ maxTilt: 8, scale: 1.02 });

  const handleFiles = useCallback(async (list: FileList) => {
    if (!list.length || uploading) return;
    const file = list[0];
    setUploading(true);
    setProgress(0);
    setError(null);
    setFileId(null);
    sounds.upload();
    try {
      const res = await api.uploadPublic(file, (p) => { setProgress(p); if (p % 20 === 0) sounds.uploadProgress(p); });
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
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => !uploading && inputRef.current?.click()}
      className="rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all duration-500 corner-accent animate-fade-in-up tilt-card"
      style={{ ...tilt.style, borderColor: dragOver ? colors.primary : colors.border, background: dragOver ? `${colors.primary}08` : colors.cardBg }}
    >
      <div className="tilt-shine" />
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3 animate-scale-in">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs mb-1.5 font-mono" style={{ color: colors.textMuted }}>
              <span style={{ color: colors.primary }}>UPLOADING</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: colors.gradient }} />
            </div>
          </div>
        </div>
      ) : fileId ? (
        <div className="flex flex-col items-center gap-3 animate-scale-in">
          <div className="w-12 h-12 rounded-2xl border flex items-center justify-center" style={{ background: `${colors.success}10`, borderColor: `${colors.success}25`, color: colors.success }}>
            <Check className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text }}>File uploaded — share this link:</p>
          <div className="flex items-center gap-2 w-full max-w-sm">
            <input readOnly value={link} className="form-input text-xs font-mono" onFocus={(e) => e.target.select()} />
            <button onClick={(e) => { e.stopPropagation(); copyLink(); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold btn-sci flex-shrink-0" style={{ background: colors.gradient, color: colors.bg }}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => { setFileId(null); sounds.click(); }} className="text-xs underline" style={{ color: colors.textDim }}>Upload another file</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <div className="relative w-12 h-12 rounded-2xl border flex items-center justify-center" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}15` }}>
            <Upload className="w-6 h-6" style={{ color: colors.primary }} />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse-glow" style={{ background: colors.primary }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: colors.text }}>Drop a file here or click to upload</p>
            <p className="text-xs mt-1 font-mono" style={{ color: colors.textDim }}>PUBLIC_UPLOAD — no account needed</p>
          </div>
          {error && <p className="text-xs font-mono" style={{ color: colors.danger }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
