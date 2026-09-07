import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme';

const DURATION = 8000;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

interface KF { t: number; x: number; y: number; scale: number; rot: number; opacity: number; thrust: number; }

const KEYFRAMES: KF[] = [
  { t: 0.00, x: 12, y: 90, scale: 0.3, rot: -5, opacity: 0,    thrust: 0 },
  { t: 0.05, x: 12, y: 90, scale: 1.0, rot: 0,  opacity: 1,    thrust: 1.0 },
  { t: 0.18, x: 20, y: 72, scale: 1.0, rot: 0.5, opacity: 1,   thrust: 1.0 },
  { t: 0.32, x: 38, y: 48, scale: 0.97, rot: -0.3, opacity: 1,  thrust: 1.0 },
  { t: 0.44, x: 58, y: 25, scale: 0.93, rot: 0.3, opacity: 1,   thrust: 1.0 },
  { t: 0.52, x: 70, y: 14, scale: 0.90, rot: 0,   opacity: 1,   thrust: 0.8 },
  { t: 0.56, x: 74, y: 10, scale: 0.88, rot: 0,   opacity: 1,   thrust: 0.3 },
  { t: 0.60, x: 74, y: 10, scale: 0.88, rot: 0,   opacity: 1,   thrust: 0.1 },
  { t: 0.64, x: 70, y: 14, scale: 0.90, rot: -0.1, opacity: 1,  thrust: 0.3 },
  { t: 0.74, x: 52, y: 26, scale: 0.93, rot: 0.2, opacity: 1,   thrust: 1.0 },
  { t: 0.84, x: 32, y: 50, scale: 0.97, rot: -0.2, opacity: 1,  thrust: 1.0 },
  { t: 0.92, x: 16, y: 74, scale: 1.0, rot: 0.2, opacity: 1,   thrust: 1.0 },
  { t: 0.96, x: 12, y: 90, scale: 0.9, rot: 0,   opacity: 1,   thrust: 0.5 },
  { t: 1.00, x: 12, y: 90, scale: 0.3, rot: -5,  opacity: 0,   thrust: 0 },
];

function interpolate(progress: number): KF {
  let i = 0;
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].t <= progress) i++;
  if (i >= KEYFRAMES.length - 1) return KEYFRAMES[KEYFRAMES.length - 1];
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  const localT = (progress - a.t) / (b.t - a.t);
  let e: number;
  if (progress < 0.18) e = easeInOutCubic(localT);
  else if (progress < 0.56) e = easeBack(localT);
  else e = easeInOutCubic(localT);
  return {
    t: progress,
    x: lerp(a.x, b.x, e),
    y: lerp(a.y, b.y, e),
    scale: lerp(a.scale, b.scale, e),
    rot: lerp(a.rot, b.rot, e),
    opacity: lerp(a.opacity, b.opacity, e),
    thrust: lerp(a.thrust, b.thrust, e),
  };
}

export default function LandingRocket() {
  const { colors } = useTheme();
  const rocketRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLDivElement>(null);
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
      if (flameRef.current) {
        flameRef.current.style.transform = `translateX(-50%) scaleY(${0.7 + frame.thrust * 0.6})`;
        flameRef.current.style.opacity = String(0.5 + frame.thrust * 0.5);
      }
      if (trailRef.current) {
        trailRef.current.style.opacity = String(frame.thrust * 0.5);
        trailRef.current.style.height = `${15 + frame.thrust * 50}px`;
      }
      if (barRef.current) barRef.current.style.width = `${Math.round(progress * 100)}%`;
      if (statusRef.current) {
        if (progress < 0.05) statusRef.current.textContent = 'INITIALIZING...';
        else if (progress < 0.18) statusRef.current.textContent = '🚀 LIFTOFF';
        else if (progress < 0.44) statusRef.current.textContent = 'ASCENDING';
        else if (progress < 0.52) statusRef.current.textContent = 'CRUISE VELOCITY';
        else if (progress < 0.56) statusRef.current.textContent = '✔ ORBIT';
        else if (progress < 0.64) statusRef.current.textContent = 'DROGUE';
        else if (progress < 0.74) statusRef.current.textContent = 'DESCENDING';
        else if (progress < 0.84) statusRef.current.textContent = 'RE-ENTRY';
        else if (progress < 0.92) statusRef.current.textContent = 'TERMINAL V';
        else if (progress < 0.98) statusRef.current.textContent = 'LANDING';
        else statusRef.current.textContent = '✔ COMPLETE';
      }
      if (pctRef.current) {
        if (progress < 0.05) pctRef.current.textContent = '0%';
        else if (progress < 0.18) pctRef.current.textContent = '12%';
        else if (progress < 0.32) pctRef.current.textContent = '30%';
        else if (progress < 0.44) pctRef.current.textContent = '48%';
        else if (progress < 0.52) pctRef.current.textContent = '58%';
        else if (progress < 0.60) pctRef.current.textContent = '65%';
        else if (progress < 0.74) pctRef.current.textContent = '78%';
        else if (progress < 0.84) pctRef.current.textContent = '88%';
        else if (progress < 0.92) pctRef.current.textContent = '94%';
        else if (progress < 0.98) pctRef.current.textContent = '98%';
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
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          willChange: 'transform, opacity',
          transform: 'translate(12%, 90%) scale(0.3) rotate(-5deg)',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {/* Flame */}
        <div
          ref={flameRef}
          className="absolute"
          style={{
            bottom: '-22px',
            left: '50%',
            transform: 'translateX(-50%) scaleY(1)',
            width: '12px',
            height: '26px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '26px',
              borderRadius: '50% 50% 20% 20%',
              background: `linear-gradient(to bottom, #fff 0%, ${colors.primary} 25%, #ef4444 65%, transparent 100%)`,
              filter: 'blur(1px)',
              animation: 'rocket-journey-flame-flicker 0.1s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '18px',
              borderRadius: '50% 50% 20% 20%',
              background: `linear-gradient(to bottom, #fde047 0%, ${colors.primary} 55%, transparent 100%)`,
              filter: 'blur(0.5px)',
              animation: 'rocket-journey-flame-inner 0.07s ease-in-out infinite',
            }}
          />
        </div>

        {/* Rocket body */}
        <div className="relative" style={{ width: '36px', height: '64px' }}>
          {/* Nose cone */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '18px solid transparent',
              borderRight: '18px solid transparent',
              borderBottom: '24px solid linear-gradient(to bottom, #e5e7eb, #9ca3af)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />
          {/* Fuselage */}
          <div
            className="absolute inset-0 rounded-t-[18px] rounded-b-none"
            style={{
              background: `linear-gradient(135deg, #fafafa 0%, #d1d5db 40%, #9ca3af 100%)`,
              boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.15), inset 0 4px 8px rgba(255,255,255,0.5)',
            }}
          />
          {/* Cockpit */}
          <div
            className="absolute rounded-full"
            style={{
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '11px',
              height: '11px',
              background: `radial-gradient(circle at 40% 35%, ${colors.accent}, ${colors.primary} 60%, #06b6d4)`,
              boxShadow: `0 0 10px ${colors.primaryGlow}, inset 0 0 3px rgba(255,255,255,0.8)`,
            }}
          />
          {/* Fins */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '3px solid transparent',
              borderBottom: '18px solid linear-gradient(to bottom, #ef4444, #dc2626)',
              transform: 'rotate(-14deg)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 0,
              height: 0,
              borderRight: '12px solid transparent',
              borderLeft: '3px solid transparent',
              borderBottom: '18px solid linear-gradient(to bottom, #ef4444, #dc2626)',
              transform: 'rotate(14deg)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
            }}
          />
          {/* Stripe */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '2px',
              right: '2px',
              height: '2px',
              background: colors.primary,
              borderRadius: '2px',
              boxShadow: `0 0 5px ${colors.primaryGlow}`,
            }}
          />
        </div>

        {/* Orbiting files */}
        <div className="absolute" style={{ top: '55%', left: '50%', width: 0, height: 0 }}>
          <span className="rjf rjf-1 absolute" style={{ fontSize: '12px', opacity: 0.7 }}>📄</span>
          <span className="rjf rjf-2 absolute" style={{ fontSize: '12px', opacity: 0.7 }}>📁</span>
          <span className="rjf rjf-3 absolute" style={{ fontSize: '12px', opacity: 0.7 }}>📎</span>
          <span className="rjf rjf-4 absolute" style={{ fontSize: '12px', opacity: 0.7 }}>💾</span>
        </div>

        {/* Trail */}
        <div
          ref={trailRef}
          className="absolute"
          style={{
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '3px',
            height: '30px',
            borderRadius: '2px',
            background: `linear-gradient(to bottom, rgba(255,255,255,0.3), ${colors.primary}60, transparent)`,
            filter: 'blur(1px)',
          }}
        />
      </div>

      {/* HUD */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-56">
        <div
          className="rounded p-2"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: `0 0 12px ${colors.primaryGlow}, inset 0 0 12px rgba(0,0,0,0.4)`,
          }}
        >
          <div className="flex justify-between text-[9px] font-mono mb-1.5 relative">
            <span
              ref={statusRef}
              className="tracking-wider"
              style={{ color: colors.primary, textShadow: `0 0 6px ${colors.primaryGlow}` }}
            >
              INITIALIZING...
            </span>
            <span ref={pctRef} className="tracking-wider" style={{ color: colors.textDim }}>
              0%
            </span>
          </div>
          <div
            className="relative h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div
              ref={barRef}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: '0%',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
                boxShadow: `0 0 8px ${colors.primaryGlow}`,
                transition: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
