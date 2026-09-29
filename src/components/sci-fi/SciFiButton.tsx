import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { useTheme } from '@/lib/theme';

interface SciFiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'hologram' | 'terminal' | 'energy' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  pulse?: boolean;
  children: ReactNode;
}

export const SciFiButton = forwardRef<HTMLButtonElement, SciFiButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    glow = true, 
    pulse = false,
    className = '',
    disabled,
    style,
    ...props 
  }, ref) => {
    const { colors } = useTheme();
    const showHover = !disabled;
    
    const variants = {
      primary: { 
        bg: colors.primary, 
        text: colors.bg, 
        border: colors.primary, 
        glow: colors.primaryGlow,
        hoverBg: colors.primary,
      },
      secondary: { 
        bg: colors.secondary, 
        text: colors.bg, 
        border: colors.secondary, 
        glow: colors.accentGlow,
        hoverBg: colors.secondary,
      },
      hologram: { 
        bg: 'transparent', 
        text: colors.hologram, 
        border: colors.hologram, 
        glow: colors.hologramGlow,
        hoverBg: `${colors.hologram}15`,
      },
      terminal: { 
        bg: 'transparent', 
        text: colors.terminal, 
        border: colors.terminal, 
        glow: colors.terminalGlow,
        hoverBg: `${colors.terminal}15`,
      },
      energy: { 
        bg: colors.energy, 
        text: colors.bg, 
        border: colors.energy, 
        glow: colors.energyGlow,
        hoverBg: colors.energy,
      },
      danger: { 
        bg: colors.danger, 
        text: '#fff', 
        border: colors.danger, 
        glow: `${colors.danger}40`,
        hoverBg: colors.danger,
      },
      ghost: { 
        bg: 'transparent', 
        text: colors.textMuted, 
        border: colors.border, 
        glow: 'transparent',
        hoverBg: colors.bgHover,
      },
    };
    
    const v = variants[variant];
    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
      xl: 'px-10 py-5 text-lg gap-3',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          relative inline-flex items-center justify-center font-mono font-semibold
          rounded-xl transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg)]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none
          ${showHover ? 'hover:scale-105 active:scale-95' : ''}
          ${pulse && !disabled ? 'animate-pulse-glow' : ''}
          ${sizes[size]} ${className}
        `}
        style={{
          backgroundColor: v.bg,
          color: v.text,
          border: `1px solid ${v.border}`,
          boxShadow: glow && !disabled 
            ? `0 0 20px ${v.glow}, 0 0 40px ${v.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`
            : '0 2px 8px rgba(0,0,0,0.2)',
          ...style,
        }}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        {glow && !disabled && (
          <span 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${v.glow} 0%, transparent 50%)`,
              opacity: 0.3,
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          />
        )}
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow), inset 0 1px 0 rgba(255,255,255,0.1); }
            50% { box-shadow: 0 0 30px var(--glow), 0 0 60px var(--glow), inset 0 1px 0 rgba(255,255,255,0.2); }
          }
          .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        `}</style>
      </button>
    );
  }
);

SciFiButton.displayName = 'SciFiButton';
