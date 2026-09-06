import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface RocketAnimationProps {
  active: boolean;
  onComplete?: () => void;
}

// Physics-based easing: slow takeoff → fast cruise → slow landing
function rocketEase(t: number): number {
  if (t < 0.12) {
    // Slow liftoff — exponential acceleration
    const n = t / 0.12;
    return 0.12 * (n * n * n * 0.15);
  } else if (t < 0.42) {
    // Fast cruise to moon — nearly linear at high speed
    const n = (t - 0.12) / 0.30;
    return 0.12 * 0.15 + n * 0.38;
  } else if (t < 0.52) {
    // Hover at moon — barely moving
    const n = (t - 0.42) / 0.10;
    return 0.50 + n * 0.02;
  } else if (t < 0.82) {
    // Fast return — cruise speed back
    const n = (t - 0.52) / 0.30;
    return 0.52 - n * 0.38;
  } else {
    // Slow landing — deceleration
    const n = (t - 0.82) / 0.18;
    const ease = 1 - Math.pow(1 - n, 3);
    return 0.14 - ease * 0.14;
  }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

interface Keyframe {
  t: number;
  x: number;
  y: number;
  scale: number;
  rot: number;
  opacity: number;
}

const DURATION = 7800; // ms

const KEYFRAMES: Keyframe[] = [
  { t: 0.00, x: 20, y: 84, scale: 0.5, rot: -3, opacity: 0 },
  { t: 0.03, x: 20, y: 84, scale: 1.0, rot: 0, opacity: 1 },
  { t: 0.12, x: 24, y: 72, scale: 1.0, rot: 1, opacity: 1 },
  { t: 0.25, x: 40, y: 45, scale: 0.97, rot: -0.5, opacity: 1 },
  { t: 0.38, x: 62, y: 22, scale: 0.92, rot: 0.3, opacity: 1 },
  { t: 0.48, x: 74, y: 14, scale: 0.88, rot: 0, opacity: 1 },
  { t: 0.52, x: 76, y: 13, scale: 0.88, rot: 0, opacity: 1 },
  { t: 0.62, x: 62, y: 22, scale: 0.92, rot: 0.5, opacity: 1 },
  { t: 0.75, x: 40, y: 48, scale: 0.97, rot: -0.3, opacity: 1 },
  { t: 0.85, x: 24, y: 72, scale: 1.0, rot: 0.2, opacity: 1 },
  { t: 0.93, x: 20, y: 84, scale: 1.0, rot: 0, opacity: 1 },
  { t: 0.97, x: 20, y: 84, scale: 0.85, rot: 1, opacity: 0.6 },
  { t: 1.00, x: 20, y: 84, scale: 0.5, rot: -2, opacity: 0 },
];

function interpolateKeyframes(progress: number): Keyframe {
  let i = 0;
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].t <= progress) i++;
  if (i >= KEYFRAMES.length - 1) return KEYFRAMES[KEYFRAMES.length - 1];
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const localT = (progress - a.t) / (b.t - a.t);
  const e = rocketEase(localT);
  return {
    t: progress,
    x: lerp(a.x, b.x, e),
    y: lerp(a.y, b.y, e),
    scale: lerp(a.scale, b.scale, e),
    rot: lerp(a.rot, b.rot, e),
    opacity: lerp(a.opacity, b.opacity, e),
  };
}

export default function RocketAnimation({ active, onComplete }: RocketAnimationProps) {
  const { colors } = useTheme();
  const [run, setRun] = useState(false);
  const rocketRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const [statusText, setStatusText] = useState('LOADING FILES...');
  const [pctText, setPctText] = useState('0%');

  const getStatus = useCallback((p: number) => {
    if (p < 0.04) return 'LOADING FILES...';
    if (p < 0.12) return 'LAUNCHING...';
    if (p < 0.42) return 'IN TRANSIT TO MOON...';
    if (p < 0.52) return 'UNLOADING AT MOON...';
    if (p < 0.82) return 'RETURNING TO EARTH...';
    if (p < 0.93) return 'LANDING...';
    return 'COMPLETE';
  }, []);

  const getPct = useCallback((p: number) => {
    if (p < 0.04) return '0%';
    if (p < 0.12) return '8%';
    if (p < 0.25) return '25%';
    if (p < 0.38) return '42%';
    if (p < 0.52) return '55%';
    if (p < 0.62) return '65%';
    if (p < 0.75) return '78%';
    if (p < 0.85) return '90%';
    if (p < 0.93) return '96%';
    return '100%';
  }, []);

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
      if (trailRef.current) {
        const speed = progress < 0.12 ? 0.3 : progress < 0.52 ? 0.9 : progress < 0.82 ? 0.9 : 0.3;
        trailRef.current.style.opacity = String(speed * frame.opacity);
        trailRef.current.style.height = `${40 + speed * 50}px`;
      }
      if (barRef.current) {
        barRef.current.style.width = `${Math.round(progress * 100)}%`;
      }

      const newStatus = getStatus(progress);
      const newPct = getPct(progress);
      if (statusRef.current) statusRef.current.textContent = newStatus;
      if (pctRef.current) pctRef.current.textContent = newPct;
      setStatusText(newStatus);
      setPctText(newPct);

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
  }, [active, onComplete, getStatus, getPct]);

  if (!run) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rocket-backdrop" />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: `${1 + Math.random() * 2.5}px`,
            height: `${1 + Math.random() * 2.5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: '#fff',
            opacity: 0.15 + Math.random() * 0.5,
            animation: `pulse-glow ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`
          }} />
        ))}
      </div>

      {/* Earth */}
      <div className="absolute bottom-[8%] left-[18%]">
        <div className="w-32 h-16 rounded-t-full rocket-earth" style={{ background: `linear-gradient(180deg, ${colors.accent}, ${colors.primary})`, opacity: 0.5 }}>
          <div className="w-full h-full rounded-t-full" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
        </div>
        <span className="text-[9px] font-mono block text-center mt-1" style={{ color: colors.textDim }}>EARTH</span>
      </div>

      {/* Moon */}
      <div className="absolute top-[10%] right-[16%]">
        <div className="w-16 h-16 rounded-full rocket-moon" style={{ background: `radial-gradient(circle at 35% 35%, #e5e7eb, #9ca3af)`, opacity: 0.4 }}>
          <div className="absolute top-2 left-3 w-3 h-3 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
          <div className="absolute bottom-3 right-2 w-2 h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }} />
        </div>
        <span className="text-[9px] font-mono block text-center mt-1" style={{ color: colors.textDim }}>MOON</span>
      </div>

      {/* Rocket — GPU-accelerated via transform only */}
      <div
        ref={rocketRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          willChange: 'transform, opacity',
          transform: 'translate(20vw, 84vh) scale(0.5) rotate(-3deg)',
          overflow: 'visible',
        }}
      >
        {/* Flame */}
        <div className="absolute" style={{ bottom: '-22px', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{
            width: '14px', height: '28px',
            borderRadius: '0 0 50% 50%',
            background: 'linear-gradient(to bottom, #f97316, #ef4444, transparent)',
            animation: 'rocket-journey-flame-flicker 0.13s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)',
            width: '7px', height: '20px',
            borderRadius: '0 0 50% 50%',
            background: 'linear-gradient(to bottom, #fde047, #f97316)',
            animation: 'rocket-journey-flame-inner 0.1s ease-in-out infinite',
          }} />
        </div>

        {/* Rocket body */}
        <div className="relative" style={{ width: '40px', height: '64px' }}>
          <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-white via-gray-200 to-gray-400" />
          <div className="absolute rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500" style={{ top: '6px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', boxShadow: '0 0 10px rgba(34,211,238,0.5)' }} />
          <div className="absolute bg-gradient-to-t from-red-500 to-red-400" style={{ bottom: 0, left: 0, width: '12px', height: '16px', borderRadius: '0 0 0 12px', transform: 'rotate(-12deg)', transformOrigin: 'bottom right' }} />
          <div className="absolute bg-gradient-to-t from-red-500 to-red-400" style={{ bottom: 0, right: 0, width: '12px', height: '16px', borderRadius: '0 0 12px 0', transform: 'rotate(12deg)', transformOrigin: 'bottom left' }} />
        </div>

        {/* Files orbiting */}
        <div className="absolute" style={{ top: '50%', left: '50%', width: 0, height: 0 }}>
          <span className="rjf rjf-1 absolute" style={{ fontSize: '13px', opacity: 0.7 }}>📄</span>
          <span className="rjf rjf-2 absolute" style={{ fontSize: '13px', opacity: 0.7 }}>📁</span>
          <span className="rjf rjf-3 absolute" style={{ fontSize: '13px', opacity: 0.7 }}>📎</span>
          <span className="rjf rjf-4 absolute" style={{ fontSize: '13px', opacity: 0.7 }}>💾</span>
        </div>

        {/* Trail */}
        <div
          ref={trailRef}
          className="absolute"
          style={{
            bottom: '-18px', left: '50%', transform: 'translateX(-50%)',
            width: '3px', height: '60px',
            borderRadius: '2px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
          }}
        />
      </div>

      {/* HUD */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-72 rocket-hud">
        <div className="flex justify-between text-xs font-mono mb-1.5" style={{ color: colors.textMuted }}>
          <span ref={statusRef}>LOADING FILES...</span>
          <span ref={pctRef}>0%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            ref={barRef}
            className="h-full rounded-full"
            style={{ width: '0%', background: colors.gradient, transition: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
