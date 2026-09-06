import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme';

const DURATION = 6500;

function rocketEase(t: number): number {
  if (t < 0.15) {
    const n = t / 0.15;
    return 0.15 * (n * n * n * 0.15);
  } else if (t < 0.40) {
    const n = (t - 0.15) / 0.25;
    return 0.15 * 0.15 + n * 0.40;
  } else if (t < 0.50) {
    const n = (t - 0.40) / 0.10;
    return 0.55 + n * 0.02;
  } else if (t < 0.75) {
    const n = (t - 0.50) / 0.25;
    return 0.57 - n * 0.40;
  } else {
    const n = (t - 0.75) / 0.25;
    const ease = 1 - Math.pow(1 - n, 3);
    return 0.17 - ease * 0.17;
  }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

interface KF { t: number; x: number; y: number; scale: number; rot: number; opacity: number; }

const KEYFRAMES: KF[] = [
  { t: 0.00, x: 15, y: 88, scale: 0.5, rot: -3, opacity: 0 },
  { t: 0.03, x: 15, y: 88, scale: 1.0, rot: 0, opacity: 1 },
  { t: 0.15, x: 22, y: 65, scale: 1.0, rot: 1, opacity: 1 },
  { t: 0.28, x: 42, y: 38, scale: 0.96, rot: -0.5, opacity: 1 },
  { t: 0.40, x: 68, y: 18, scale: 0.91, rot: 0.3, opacity: 1 },
  { t: 0.48, x: 76, y: 12, scale: 0.88, rot: 0, opacity: 1 },
  { t: 0.52, x: 78, y: 11, scale: 0.88, rot: 0, opacity: 1 },
  { t: 0.62, x: 65, y: 22, scale: 0.91, rot: 0.5, opacity: 1 },
  { t: 0.72, x: 42, y: 45, scale: 0.96, rot: -0.3, opacity: 1 },
  { t: 0.82, x: 22, y: 68, scale: 1.0, rot: 0.2, opacity: 1 },
  { t: 0.92, x: 15, y: 88, scale: 1.0, rot: 0, opacity: 1 },
  { t: 0.97, x: 15, y: 88, scale: 0.8, rot: 1, opacity: 0.5 },
  { t: 1.00, x: 15, y: 88, scale: 0.5, rot: -2, opacity: 0 },
];

function interpolate(progress: number): KF {
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

export default function LandingRocket() {
  const { colors } = useTheme();
  const rocketRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => {
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = (now - startRef.current) % DURATION;
      const progress = elapsed / DURATION;
      const frame = interpolate(progress);

      if (rocketRef.current) {
        rocketRef.current.style.transform = `translate(${frame.x}vw, ${frame.y}vh) scale(${frame.scale}) rotate(${frame.rot}deg)`;
        rocketRef.current.style.opacity = String(frame.opacity);
      }
      if (trailRef.current) {
        const speed = progress < 0.15 ? 0.3 : progress < 0.52 ? 0.9 : progress < 0.75 ? 0.9 : 0.3;
        trailRef.current.style.opacity = String(speed * frame.opacity);
        trailRef.current.style.height = `${30 + speed * 35}px`;
      }
      if (barRef.current) barRef.current.style.width = `${Math.round(progress * 100)}%`;
      if (statusRef.current) {
        if (progress < 0.04) statusRef.current.textContent = 'LOADING';
        else if (progress < 0.15) statusRef.current.textContent = 'LAUNCHING';
        else if (progress < 0.40) statusRef.current.textContent = 'IN TRANSIT';
        else if (progress < 0.50) statusRef.current.textContent = 'UNLOADING';
        else if (progress < 0.75) statusRef.current.textContent = 'RETURNING';
        else if (progress < 0.92) statusRef.current.textContent = 'LANDING';
        else statusRef.current.textContent = 'DONE';
      }
      if (pctRef.current) {
        if (progress < 0.04) pctRef.current.textContent = '0%';
        else if (progress < 0.15) pctRef.current.textContent = '8%';
        else if (progress < 0.28) pctRef.current.textContent = '28%';
        else if (progress < 0.40) pctRef.current.textContent = '42%';
        else if (progress < 0.52) pctRef.current.textContent = '55%';
        else if (progress < 0.62) pctRef.current.textContent = '65%';
        else if (progress < 0.72) pctRef.current.textContent = '75%';
        else if (progress < 0.82) pctRef.current.textContent = '88%';
        else if (progress < 0.92) pctRef.current.textContent = '96%';
        else pctRef.current.textContent = '100%';
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      {/* Rocket */}
      <div
        ref={rocketRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          willChange: 'transform, opacity',
          transform: 'translate(15vw, 88vh) scale(0.5) rotate(-3deg)',
          overflow: 'visible',
        }}
      >
        {/* Flame */}
        <div className="absolute" style={{ bottom: '-16px', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{
            width: '10px', height: '20px',
            borderRadius: '0 0 50% 50%',
            background: 'linear-gradient(to bottom, #f97316, #ef4444, transparent)',
            animation: 'rocket-journey-flame-flicker 0.12s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '3px', left: '50%', transform: 'translateX(-50%)',
            width: '5px', height: '14px',
            borderRadius: '0 0 50% 50%',
            background: 'linear-gradient(to bottom, #fde047, #f97316)',
            animation: 'rocket-journey-flame-inner 0.09s ease-in-out infinite',
          }} />
        </div>
        {/* Body */}
        <div className="relative" style={{ width: '32px', height: '56px' }}>
          <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-white via-gray-200 to-gray-400" />
          <div className="absolute rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500" style={{ top: '5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px' }} />
          <div className="absolute bg-gradient-to-t from-red-500 to-red-400" style={{ bottom: 0, left: 0, width: '10px', height: '13px', borderRadius: '0 0 0 10px', transform: 'rotate(-12deg)', transformOrigin: 'bottom right' }} />
          <div className="absolute bg-gradient-to-t from-red-500 to-red-400" style={{ bottom: 0, right: 0, width: '10px', height: '13px', borderRadius: '0 0 10px 0', transform: 'rotate(12deg)', transformOrigin: 'bottom left' }} />
        </div>
        {/* Files */}
        <div className="absolute" style={{ top: '50%', left: '50%', width: 0, height: 0 }}>
          <span className="rjf rjf-1 absolute" style={{ fontSize: '11px', opacity: 0.6 }}>📄</span>
          <span className="rjf rjf-2 absolute" style={{ fontSize: '11px', opacity: 0.6 }}>📁</span>
          <span className="rjf rjf-3 absolute" style={{ fontSize: '11px', opacity: 0.6 }}>📎</span>
          <span className="rjf rjf-4 absolute" style={{ fontSize: '11px', opacity: 0.6 }}>💾</span>
        </div>
        {/* Trail */}
        <div
          ref={trailRef}
          className="absolute"
          style={{
            bottom: '-12px', left: '50%', transform: 'translateX(-50%)',
            width: '2px', height: '40px',
            borderRadius: '2px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
          }}
        />
      </div>

      {/* HUD */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-52">
        <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: colors.textDim }}>
          <span ref={statusRef}>LOADING</span>
          <span ref={pctRef}>0%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
          <div ref={barRef} className="h-full rounded-full" style={{ width: '0%', background: colors.gradient }} />
        </div>
      </div>
    </>
  );
}
