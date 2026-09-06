import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface RocketAnimationProps {
  active: boolean;
  onComplete?: () => void;
}

export default function RocketAnimation({ active, onComplete }: RocketAnimationProps) {
  const { colors } = useTheme();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!active) { setRun(false); return; }
    setRun(true);
    sounds.rocket();
    const t = setTimeout(() => {
      sounds.success();
      setRun(false);
      onComplete?.();
    }, 4200);
    return () => clearTimeout(t);
  }, [active, onComplete]);

  if (!run) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rocket-backdrop" />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden rocket-stars">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${1 + Math.random() * 2.5}px`,
              height: `${1 + Math.random() * 2.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: '#fff',
              opacity: 0.2 + Math.random() * 0.6,
              animation: `pulse-glow ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Earth */}
      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2">
        <div
          className="w-40 h-20 rounded-t-full overflow-hidden rocket-earth"
          style={{ background: `linear-gradient(180deg, ${colors.accent}, ${colors.primary})`, opacity: 0.5 }}
        >
          <div className="w-full h-full" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
        </div>
      </div>

      {/* Rocket container — pure CSS animation */}
      <div className="rocket-ship">
        {/* Flame */}
        <div className="rocket-flame">
          <div className="rocket-flame-outer" />
          <div className="rocket-flame-inner" />
        </div>

        {/* Rocket body */}
        <div className="relative w-10 h-16">
          <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-white via-gray-200 to-gray-400" />
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
          <div className="absolute bottom-0 left-0 w-3 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded-bl-full -rotate-12 origin-bottom-right" />
          <div className="absolute bottom-0 right-0 w-3 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded-br-full rotate-12 origin-bottom-left" />
        </div>

        {/* Orbiting files */}
        <div className="rocket-files">
          <span className="rocket-file rf-1">📄</span>
          <span className="rocket-file rf-2">📁</span>
          <span className="rocket-file rf-3">📎</span>
          <span className="rocket-file rf-4">💾</span>
        </div>

        {/* Trail */}
        <div className="rocket-trail" />
      </div>

      {/* Progress HUD */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-72 rocket-hud">
        <div className="flex justify-between text-xs font-mono mb-1.5" style={{ color: colors.textMuted }}>
          <span className="rocket-status">LAUNCHING...</span>
          <span className="rocket-pct">0%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card, #111)', border: '1px solid var(--border)' }}>
          <div className="h-full rounded-full rocket-progress-bar" style={{ background: colors.gradient }} />
        </div>
      </div>
    </div>
  );
}
