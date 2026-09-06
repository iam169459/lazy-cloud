import { useState, useEffect, useRef } from 'react';
import { Rocket, Star } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface RocketAnimationProps {
  active: boolean;
  onComplete?: () => void;
}

export default function RocketAnimation({ active, onComplete }: RocketAnimationProps) {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<'idle' | 'launch' | 'fly' | 'arrive' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [flame, setFlame] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      setProgress(0);
      setFlame(false);
      return;
    }

    setPhase('launch');
    setFlame(true);
    sounds.rocket();

    let p = 0;
    const interval = setInterval(() => {
      p += 1;
      setProgress(p);
      if (p < 30) {
        setPhase('launch');
      } else if (p < 80) {
        setPhase('fly');
      } else if (p < 100) {
        setPhase('arrive');
      } else {
        clearInterval(interval);
        setPhase('done');
        setFlame(false);
        sounds.success();
        setTimeout(() => onComplete?.(), 800);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [active, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse-glow"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.3 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      {/* Earth */}
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2">
        <div
          className="w-32 h-16 rounded-t-full overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${colors.accent}, ${colors.primary})`,
            opacity: phase === 'idle' ? 0 : 0.6,
            transition: 'opacity 0.5s',
          }}
        >
          <div className="w-full h-full opacity-30"
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.4), transparent 60%)',
            }}
          />
        </div>
      </div>

      {/* Rocket */}
      <div
        className="absolute transition-all duration-300"
        style={{
          left: '50%',
          bottom: phase === 'launch' ? '18%' : phase === 'fly' ? '60%' : phase === 'arrive' ? '80%' : '18%',
          transform: 'translateX(-50%)',
          opacity: 1,
        }}
      >
        {/* Flame */}
        {flame && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            <div className="w-4 h-8 rounded-b-full bg-gradient-to-b from-orange-400 via-red-500 to-transparent animate-pulse" />
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-6 rounded-b-full bg-gradient-to-b from-yellow-300 to-orange-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
          </div>
        )}

        {/* Rocket body */}
        <div className="relative w-10 h-16 animate-float" style={{ animationDuration: '0.5s' }}>
          <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-white via-gray-200 to-gray-400" />
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <div className="absolute bottom-0 left-0 w-3 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded-bl-full -rotate-12 origin-bottom-right" />
          <div className="absolute bottom-0 right-0 w-3 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded-br-full rotate-12 origin-bottom-left" />
        </div>

        {/* File icons around rocket */}
        {(phase === 'fly' || phase === 'arrive') && (
          <>
            <div className="absolute -left-8 top-2 text-lg animate-float" style={{ animationDelay: '0.2s' }}>📄</div>
            <div className="absolute -right-8 top-0 text-lg animate-float" style={{ animationDelay: '0.4s' }}>📁</div>
            <div className="absolute -left-6 top-8 text-sm animate-float" style={{ animationDelay: '0.6s' }}>📎</div>
            <div className="absolute -right-6 top-6 text-sm animate-float" style={{ animationDelay: '0.8s' }}>💾</div>
          </>
        )}
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64">
        <div className="flex justify-between text-xs font-mono mb-1.5" style={{ color: colors.textMuted }}>
          <span>{phase === 'launch' ? 'LAUNCHING...' : phase === 'fly' ? 'IN TRANSIT...' : phase === 'arrive' ? 'DELIVERING...' : 'COMPLETE'}</span>
          <span>{Math.min(progress, 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}>
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: colors.gradient,
            }}
          />
        </div>
      </div>
    </div>
  );
}
