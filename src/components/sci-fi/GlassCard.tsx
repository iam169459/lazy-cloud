import { ReactNode } from 'react';
import { useTheme } from '@/lib/theme';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'hologram' | 'terminal' | 'energy' | 'void';
  padding?: string;
  hover?: boolean;
  border?: boolean;
}

export default function GlassCard({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'p-6',
  hover = true,
  border = true
}: GlassCardProps) {
  const { colors } = useTheme();
  
  const variantStyles: Record<string, { borderColor: string; bgColor: string; glowColor: string }> = {
    default: { borderColor: colors.cardBorder, bgColor: colors.cardBg, glowColor: colors.primaryGlow },
    hologram: { borderColor: colors.hologram, bgColor: colors.bgCard, glowColor: colors.hologramGlow },
    terminal: { borderColor: colors.terminal, bgColor: colors.bgCard, glowColor: colors.terminalGlow },
    energy: { borderColor: colors.energy, bgColor: colors.bgCard, glowColor: colors.energyGlow },
    void: { borderColor: colors.border, bgColor: colors.void, glowColor: colors.voidGlow },
  };
  
  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`
        relative backdrop-blur-xl rounded-2xl ${padding} ${className}
        ${hover ? 'transition-all duration-300 hover:scale-[1.01]' : ''}
      `}
      style={{
        background: border ? `linear-gradient(135deg, ${style.bgColor} 0%, ${colors.bgCard} 100%)` : style.bgColor,
        border: border ? `1px solid ${style.borderColor}` : 'none',
        boxShadow: hover 
          ? `0 0 30px ${style.glowColor}, 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 ${style.borderColor}33`
          : `0 0 20px ${style.glowColor}, 0 4px 24px rgba(0,0,0,0.2)`,
      }}
    >
      {border && (
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${style.glowColor} 0%, transparent 50%)`,
            opacity: 0.1,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
