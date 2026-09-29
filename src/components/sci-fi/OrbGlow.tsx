import { useTheme } from '@/lib/theme';

interface OrbGlowProps {
  className?: string;
  variant?: 'orb1' | 'orb2' | 'orb3';
  size?: number;
  blur?: number;
  animate?: boolean;
}

export default function OrbGlow({ 
  className = '', 
  variant = 'orb1',
  size = 400,
  blur = 120,
  animate = true
}: OrbGlowProps) {
  const { colors } = useTheme();
  const orbColor = colors[variant];

  return (
    <div
      className={`fixed pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at center, ${orbColor} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity: 0.6,
        animation: animate ? 'orb-float 20s ease-in-out infinite' : 'none',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          25% { transform: translate(30px, -20px) scale(1.1); opacity: 0.6; }
          50% { transform: translate(-20px, 30px) scale(0.9); opacity: 0.5; }
          75% { transform: translate(-30px, -30px) scale(1.05); opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
