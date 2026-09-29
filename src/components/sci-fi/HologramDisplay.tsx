import { ReactNode } from 'react';
import { useTheme } from '@/lib/theme';

interface HologramDisplayProps {
  children: ReactNode;
  className?: string;
  variant?: 'scan' | 'flicker' | 'stable';
  intensity?: number;
}

export default function HologramDisplay({ 
  children, 
  className = '', 
  variant = 'scan',
  intensity = 1
}: HologramDisplayProps) {
  const { colors } = useTheme();

  const animations = {
    scan: `hologram-scan ${2 / intensity}s linear infinite`,
    flicker: `hologram-flicker ${0.1 / intensity}s ease-in-out infinite`,
    stable: 'none',
  };

  return (
    <div
      className={`
        relative backdrop-blur-sm rounded-2xl p-6 ${className}
        border border-[var(--hologram)]/30
        bg-[var(--bg-card)]
      `}
      style={{
        background: `linear-gradient(135deg, ${colors.hologram}05 0%, ${colors.bgCard} 100%)`,
        border: `1px solid ${colors.hologram}40`,
        boxShadow: `0 0 40px ${colors.hologramGlow}, inset 0 1px 0 ${colors.hologram}20`,
        animation: animations[variant] || 'none',
      }}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div 
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              ${colors.hologram}10 3px,
              ${colors.hologram}10 6px
            )`,
            animation: 'hologram-scanlines 3s linear infinite',
            pointerEvents: 'none',
          }}
        />
      </div>
      
      {/* Corner brackets */}
      <div className="absolute inset-0 pointer-events-none">
        {['tl', 'tr', 'bl', 'br'].map((corner) => (
          <div 
            key={corner}
            className="absolute w-6 h-6"
            style={{
              [corner.includes('t') ? 'top' : 'bottom']: 0,
              [corner.includes('l') ? 'left' : 'right']: 0,
              borderColor: colors.hologram,
              borderWidth: '2px',
              borderStyle: 'solid',
              [corner === 'tl' ? 'borderRight' : corner === 'tr' ? 'borderLeft' : corner === 'bl' ? 'borderRight' : 'borderLeft']: 'none',
              [corner === 'tl' ? 'borderBottom' : corner === 'tr' ? 'borderBottom' : corner === 'bl' ? 'borderTop' : 'borderTop']: 'none',
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10">{children}</div>
      
      <style>{`
        @keyframes hologram-scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes hologram-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.92; }
        }
        @keyframes hologram-scanlines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
