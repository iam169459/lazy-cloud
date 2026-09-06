import { useState, useEffect } from 'react';
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
    }, 8400);
    return () => clearTimeout(t);
  }, [active, onComplete]);

  if (!run) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rocket-backdrop" />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{ width: `${1 + Math.random() * 2.5}px`, height: `${1 + Math.random() * 2.5}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: '#fff', opacity: 0.15 + Math.random() * 0.5, animation: `pulse-glow ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite` }} />
        ))}
      </div>

      {/* Earth */}
      <div className="absolute bottom-[10%] left-[20%]">
        <div className="w-32 h-16 rounded-t-full rocket-earth" style={{ background: `linear-gradient(180deg, ${colors.accent}, ${colors.primary})`, opacity: 0.5 }}>
          <div className="w-full h-full rounded-t-full" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
        </div>
        <span className="text-[9px] font-mono block text-center mt-1" style={{ color: colors.textDim }}>EARTH</span>
      </div>

      {/* Moon */}
      <div className="absolute top-[12%] right-[18%]">
        <div className="w-16 h-16 rounded-full rocket-moon" style={{ background: `radial-gradient(circle at 35% 35%, #e5e7eb, #9ca3af)`, opacity: 0.4 }}>
          <div className="absolute top-2 left-3 w-3 h-3 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
          <div className="absolute bottom-3 right-2 w-2 h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }} />
        </div>
        <span className="text-[9px] font-mono block text-center mt-1" style={{ color: colors.textDim }}>MOON</span>
      </div>

      {/* Rocket — full journey: Earth → Moon → unload → return */}
      <div className="rocket-journey">
        <div className="rocket-journey-flame">
          <div className="rocket-journey-flame-outer" />
          <div className="rocket-journey-flame-inner" />
        </div>
        <div className="relative w-10 h-16">
          <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-white via-gray-200 to-gray-400" />
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <div className="absolute bottom-0 left-0 w-3 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded-bl-full -rotate-12 origin-bottom-right" />
          <div className="absolute bottom-0 right-0 w-3 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded-br-full rotate-12 origin-bottom-left" />
        </div>
        {/* Files orbiting */}
        <div className="rocket-journey-files">
          <span className="rjf rjf-1">📄</span>
          <span className="rjf rjf-2">📁</span>
          <span className="rjf rjf-3">📎</span>
          <span className="rjf rjf-4">💾</span>
        </div>
        <div className="rocket-journey-trail" />
      </div>

      {/* HUD */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-72 rocket-hud">
        <div className="flex justify-between text-xs font-mono mb-1.5" style={{ color: colors.textMuted }}>
          <span className="rocket-journey-status">LOADING FILES...</span>
          <span className="rocket-journey-pct">0%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full rocket-journey-bar" style={{ background: colors.gradient }} />
        </div>
      </div>
    </div>
  );
}
