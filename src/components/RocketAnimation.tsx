import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface RocketAnimationProps {
  active: boolean;
  onComplete?: () => void;
}

const DURATION = 6000;

// Smooth bezier-like easing using cubic interpolation
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

interface Keyframe {
  t: number;
  x: number;
  y: number;
  scale: number;
  rot: number;
  opacity: number;
  thrust: number;
  particles: number;
}

const KEYFRAMES: Keyframe[] = [
  { t: 0.00, x: 18, y: 86, scale: 0.4, rot: -4, opacity: 0,    thrust: 0,    particles: 0 },
  { t: 0.04, x: 18, y: 86, scale: 1.0, rot: 0,  opacity: 1,    thrust: 1,    particles: 1 },
  { t: 0.14, x: 22, y: 70, scale: 1.0, rot: 0.5, opacity: 1,   thrust: 1,    particles: 1 },
  { t: 0.28, x: 38, y: 48, scale: 0.98, rot: -0.3, opacity: 1,  thrust: 1,    particles: 1 },
  { t: 0.40, x: 58, y: 28, scale: 0.94, rot: 0.4, opacity: 1,   thrust: 1,    particles: 1 },
  { t: 0.48, x: 72, y: 16, scale: 0.90, rot: 0.1, opacity: 1,   thrust: 0.7,  particles: 0.8 },
  { t: 0.52, x: 76, y: 12, scale: 0.88, rot: 0,   opacity: 1,   thrust: 0.3,  particles: 0.5 },
  { t: 0.56, x: 76, y: 12, scale: 0.88, rot: 0,   opacity: 1,   thrust: 0.1,  particles: 0.2 },
  { t: 0.60, x: 72, y: 16, scale: 0.90, rot: -0.1, opacity: 1,  thrust: 0.3,  particles: 0.5 },
  { t: 0.72, x: 55, y: 28, scale: 0.94, rot: 0.3, opacity: 1,   thrust: 1,    particles: 1 },
  { t: 0.84, x: 35, y: 50, scale: 0.98, rot: -0.2, opacity: 1,  thrust: 1,    particles: 1 },
  { t: 0.92, x: 20, y: 72, scale: 1.0, rot: 0.2, opacity: 1,   thrust: 1,    particles: 1 },
  { t: 0.96, x: 18, y: 86, scale: 0.95, rot: 0,   opacity: 1,   thrust: 0.5,  particles: 0.5 },
  { t: 1.00, x: 18, y: 86, scale: 0.4, rot: -4,  opacity: 0,   thrust: 0,    particles: 0 },
];

function interpolateKeyframes(progress: number): Keyframe {
  let i = 0;
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].t <= progress) i++;
  if (i >= KEYFRAMES.length - 1) return KEYFRAMES[KEYFRAMES.length - 1];
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const localT = Math.min(1, Math.max(0, (progress - a.t) / (b.t - a.t)));
  // Use different easing per phase
  let e: number;
  if (progress < 0.14) {
    e = easeInOutCubic(localT); // liftoff
  } else if (progress < 0.52) {
    e = easeOutBack(localT); // cruise up
  } else if (progress < 0.56) {
    e = localT; // hover
  } else {
    e = easeInOutCubic(localT); // return
  }
  return {
    t: progress,
    x: lerp(a.x, b.x, e),
    y: lerp(a.y, b.y, e),
    scale: lerp(a.scale, b.scale, e),
    rot: lerp(a.rot, b.rot, e),
    opacity: lerp(a.opacity, b.opacity, e),
    thrust: lerp(a.thrust, b.thrust, e),
    particles: lerp(a.particles, b.particles, e),
  };
}

function getStatus(p: number): string {
  if (p < 0.04) return 'INITIALIZING...';
  if (p < 0.14) return '🚀 LIFTOFF';
  if (p < 0.28) return 'ASCENDING';
  if (p < 0.40) return 'CRUISE VELOCITY';
  if (p < 0.48) return 'APPROACHING ORBIT';
  if (p < 0.56) return '✔ ORBIT INSERTION';
  if (p < 0.60) return 'DROGUE LOCKED';
  if (p < 0.72) return 'DESCENDING';
  if (p < 0.84) return 'RE-ENTRY';
  if (p < 0.92) return 'TERMINAL VELOCITY';
  if (p < 0.98) return 'LANDING';
  return '✔ MISSION COMPLETE';
}

function getPct(p: number): string {
  if (p < 0.04) return '0%';
  if (p < 0.14) return '12%';
  if (p < 0.28) return '28%';
  if (p < 0.40) return '42%';
  if (p < 0.48) return '55%';
  if (p < 0.56) return '62%';
  if (p < 0.60) return '68%';
  if (p < 0.72) return '78%';
  if (p < 0.84) return '88%';
  if (p < 0.92) return '94%';
  if (p < 0.98) return '98%';
  return '100%';
}

export default function RocketAnimation({ active, onComplete }: RocketAnimationProps) {
  const { colors } = useTheme();
  const [run, setRun] = useState(false);
  const rocketRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLDivElement>(null);
  const flameInnerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const [statusText, setStatusText] = useState('INITIALIZING...');
  const [pctText, setPctText] = useState('0%');

  useEffect(() => {
    if (!active) { setRun(false); return; }
    setRun(true);
    startRef.current = performance.now();
    sounds.rocket();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const frame = interpolateKeyframes(progress);

      if (rocketRef.current) {
        rocketRef.current.style.transform = `translate(${frame.x}vw, ${frame.y}vh) scale(${frame.scale}) rotate(${frame.rot}deg)`;
        rocketRef.current.style.opacity = String(frame.opacity);
      }
      if (flameRef.current) {
        flameRef.current.style.transform = `translateX(-50%) scaleY(${0.8 + frame.thrust * 0.5})`;
        flameRef.current.style.opacity = String(0.7 + frame.thrust * 0.3);
      }
      if (flameInnerRef.current) {
        flameInnerRef.current.style.transform = `translateX(-50%) scaleY(${0.9 + frame.thrust * 0.6})`;
        flameInnerRef.current.style.opacity = String(0.8 + frame.thrust * 0.2);
      }
      if (trailRef.current) {
        trailRef.current.style.opacity = String(frame.particles * 0.5);
        trailRef.current.style.height = `${20 + frame.thrust * 60}px`;
      }

      if (barRef.current) barRef.current.style.width = `${Math.round(progress * 100)}%`;
      if (statusRef.current) statusRef.current.textContent = getStatus(progress);
      if (pctRef.current) pctRef.current.textContent = getPct(progress);
      setStatusText(getStatus(progress));
      setPctText(getPct(progress));

      if (progress >= 1) {
        sounds.success();
        setRun(false);
        onComplete?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, onComplete]);

  if (!run) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Dark space backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md rocket-backdrop" />

      {/* Star field */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: '#fff',
              opacity: 0.1 + Math.random() * 0.6,
              animation: `pulse-glow ${1.5 + Math.random() * 3}s ease-in-out ${Math.random() * 4}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Nebula glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: '600px',
          height: '600px',
          top: '20%',
          left: '20%',
          background: `radial-gradient(circle, ${colors.orb1} 0%, transparent 70%)`,
          opacity: 0.4,
          filter: 'blur(40px)',
          animation: 'aurora-breathe 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '500px',
          height: '500px',
          bottom: '10%',
          right: '15%',
          background: `radial-gradient(circle, ${colors.orb2} 0%, transparent 70%)`,
          opacity: 0.3,
          filter: 'blur(40px)',
          animation: 'aurora-breathe 8s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />

      {/* Earth */}
      <div className="absolute bottom-[10%] left-[16%]">
        <div
          className="rocket-earth"
          style={{
            width: '80px',
            height: '40px',
            borderRadius: '50% 50% 0 0',
            background: `linear-gradient(180deg, ${colors.accent}, ${colors.primary}, ${colors.secondary})`,
            opacity: 0.55,
            boxShadow: `0 0 30px ${colors.primaryGlow}`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50% 50% 0 0',
              background: 'radial-gradient(circle at 35% 40%, rgba(255,255,255,0.35), transparent 60%)',
            }}
          />
          {/* Continent hints */}
          <div style={{ position: 'absolute', top: '20%', left: '15%', width: '30%', height: '40%', borderRadius: '50%', background: 'rgba(34,197,94,0.15)' }} />
          <div style={{ position: 'absolute', top: '30%', left: '50%', width: '20%', height: '30%', borderRadius: '40%', background: 'rgba(34,197,94,0.12)' }} />
        </div>
        <span className="text-[9px] font-mono block text-center mt-1 tracking-widest uppercase" style={{ color: colors.textDim, opacity: 0.7 }}>PPL anchored</span>
      </div>

      {/* Moon */}
      <div className="absolute top-[12%] right-[18%]">
        <div
          className="rocket-moon"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #f0f0f0, #8a8a8a 60%, #4a4a4a)`,
            opacity: 0.45,
            boxShadow: `0 0 25px rgba(255,255,255,0.1), inset -8px -4px 12px rgba(0,0,0,0.3)`,
          }}
        >
          <div className="absolute" style={{ top: '8%', left: '12%', width: '12%', height: '12%', borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
          <div className="absolute" style={{ bottom: '12%', right: '15%', width: '8%', height: '8%', borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }} />
          <div className="absolute" style={{ top: '45%', left: '60%', width: '10%', height: '10%', borderRadius: '50%', background: 'rgba(0,0,0,0.08)' }} />
        </div>
        <span className="text-[9px] font-mono block text-center mt-1 tracking-widest uppercase" style={{ color: colors.textDim, opacity: 0.7 }}>LUNA relay</span>
      </div>

      {/* Rocket ship — GPU-accelerated */}
      <div
        ref={rocketRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          willChange: 'transform, opacity',
          transform: 'translate(18%, 86%) scale(0.4) rotate(-4deg)',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {/* Main flame */}
        <div
          ref={flameRef}
          className="absolute"
          style={{
            bottom: '-26px',
            left: '50%',
            transform: 'translateX(-50%) scaleY(1)',
            width: '16px',
            height: '32px',
          }}
        >
          <div
            style={{
              width: '16px',
              height: '32px',
              borderRadius: '50% 50% 20% 20%',
              background: `linear-gradient(to bottom, #fff 0%, ${colors.primary} 20%, #ef4444 60%, transparent 100%)`,
              filter: 'blur(1px)',
              animation: 'rocket-journey-flame-flicker 0.12s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '22px',
              borderRadius: '50% 50% 20% 20%',
              background: `linear-gradient(to bottom, #fde047 0%, ${colors.primary} 50%, transparent 100%)`,
              filter: 'blur(0.5px)',
              animation: 'rocket-journey-flame-inner 0.08s ease-in-out infinite',
            }}
          />
        </div>

        {/* Rocket body */}
        <div className="relative" style={{ width: '44px', height: '72px' }}>
          {/* Nose cone */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '22px solid transparent',
              borderRight: '22px solid transparent',
              borderBottom: '28px solid linear-gradient(to bottom, #e5e7eb, #9ca3af)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />
          {/* Fuselage */}
          <div
            className="absolute inset-0 rounded-t-[22px] rounded-b-none"
            style={{
              background: `linear-gradient(135deg, #fafafa 0%, #d1d5db 40%, #9ca3af 100%)`,
              boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.15), inset 0 4px 8px rgba(255,255,255,0.5)',
            }}
          />
          {/* Cockpit window */}
          <div
            className="absolute rounded-full"
            style={{
              top: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '14px',
              height: '14px',
              background: `radial-gradient(circle at 40% 35%, ${colors.accent}, ${colors.primary} 60%, #06b6d4)`,
              boxShadow: `0 0 12px ${colors.primaryGlow}, inset 0 0 4px rgba(255,255,255,0.8)`,
            }}
          />
          {/* Fin left */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '0',
              height: '0',
              borderLeft: '14px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '22px solid linear-gradient(to bottom, #ef4444, #dc2626)',
              transform: 'rotate(-15deg)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
            }}
          />
          {/* Fin right */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '0',
              height: '0',
              borderRight: '14px solid transparent',
              borderLeft: '4px solid transparent',
              borderBottom: '22px solid linear-gradient(to bottom, #ef4444, #dc2626)',
              transform: 'rotate(15deg)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
            }}
          />
          {/* Stripe */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '2px',
              right: '2px',
              height: '3px',
              background: colors.primary,
              borderRadius: '2px',
              boxShadow: `0 0 6px ${colors.primaryGlow}`,
            }}
          />
        </div>

        {/* Orbiting file icons */}
        <div
          className="absolute"
          style={{
            top: '55%',
            left: '50%',
            width: 0,
            height: 0,
          }}
        >
          <span className="rjf rjf-1 absolute" style={{ fontSize: '14px', opacity: 0.75 }}>📄</span>
          <span className="rjf rjf-2 absolute" style={{ fontSize: '14px', opacity: 0.75 }}>📁</span>
          <span className="rjf rjf-3 absolute" style={{ fontSize: '14px', opacity: 0.75 }}>📎</span>
          <span className="rjf rjf-4 absolute" style={{ fontSize: '14px', opacity: 0.75 }}>💾</span>
        </div>

        {/* Particle trail */}
        <div
          ref={trailRef}
          className="absolute"
          style={{
            bottom: '-16px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '4px',
            height: '40px',
            borderRadius: '3px',
            background: `linear-gradient(to bottom, rgba(255,255,255,0.4), ${colors.primary}80, transparent)`,
            filter: 'blur(2px)',
          }}
        />
      </div>

      {/* HUD Display */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 rocket-hud">
        {/* HUD border frame */}
        <div
          className="rounded-lg p-3"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 0 20px ${colors.primaryGlow}, inset 0 0 20px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Scan line effect */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${colors.primary}60, transparent)`,
              animation: 'hud-scanline 2s linear infinite',
            }}
          />

          <div className="flex justify-between text-xs font-mono mb-2 relative">
            <span
              ref={statusRef}
              className="tracking-wider"
              style={{ color: colors.primary, textShadow: `0 0 8px ${colors.primaryGlow}` }}
            >
              INITIALIZING...
            </span>
            <span
              ref={pctRef}
              className="tracking-wider"
              style={{ color: colors.textMuted }}
            >
              0%
            </span>
          </div>

          {/* Progress bar — sleek */}
          <div
            className="relative h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Track glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `linear-gradient(to right, ${colors.primary}30, ${colors.secondary}30)`, opacity: 0.5 }}
            />
            <div
              ref={barRef}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: '0%',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
                boxShadow: `0 0 12px ${colors.primaryGlow}`,
                transition: 'none',
              }}
            />
            {/* Shimmer */}
            <div
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Mini stats row */}
          <div className="flex justify-between text-[9px] font-mono mt-2 relative" style={{ color: colors.textDim }}>
            <span>ALT: {Math.round(Math.abs((1 - parseFloat(pctText) / 100) * 400 - 40))}km</span>
            <span>SPD: {Math.round((() => {
              const p = parseFloat(pctText) / 100;
              if (p < 0.15) return p * 2000;
              if (p < 0.5) return 300 + p * 2000;
              return 1200 - (p - 0.5) * 1500;
            })())} m/s</span>
            <span>SIG: {Math.round(90 + Math.random() * 8)}%</span>
          </div>
        </div>
      </div>

      {/* Corner data readouts */}
      <div className="absolute top-4 left-4 text-[9px] font-mono" style={{ color: colors.textDim, opacity: 0.5 }}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
          SYS ONLINE
        </div>
        <div className="mt-1">MISSION: FILE TRANSFER</div>
      </div>
      <div className="absolute top-4 right-4 text-[9px] font-mono text-right" style={{ color: colors.textDim, opacity: 0.5 }}>
        <div>T+{Math.floor(DURATION / 1000)}s</div>
        <div>RELAY: ACTIVE</div>
      </div>
    </div>
  );
}
