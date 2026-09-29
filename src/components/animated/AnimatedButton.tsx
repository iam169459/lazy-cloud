'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode, useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme';
import { buttonVariants } from '@/lib/animations';

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'hologram' | 'terminal' | 'energy' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  pulse?: boolean;
  children: ReactNode;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
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
    const [reducedMotion, setReducedMotion] = useState(false);
    
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    
    const variants = {
      primary: { bg: colors.primary, text: colors.bg, border: colors.primary, glow: colors.primaryGlow },
      secondary: { bg: colors.secondary, text: colors.bg, border: colors.secondary, glow: colors.accentGlow },
      hologram: { bg: 'transparent', text: colors.hologram, border: colors.hologram, glow: colors.hologramGlow },
      terminal: { bg: 'transparent', text: colors.terminal, border: colors.terminal, glow: colors.terminalGlow },
      energy: { bg: colors.energy, text: colors.bg, border: colors.energy, glow: colors.energyGlow },
      danger: { bg: colors.danger, text: '#fff', border: colors.danger, glow: `${colors.danger}40` },
      ghost: { bg: 'transparent', text: colors.textMuted, border: colors.border, glow: 'transparent' },
    };
    
    const v = variants[variant];
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
      xl: 'px-10 py-5 text-lg gap-3',
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        variants={buttonVariants}
        whileHover={!disabled ? 'hover' : undefined}
        whileTap="tap"
        animate={pulse && !disabled && !reducedMotion ? 'pulse' : 'rest'}
        initial="rest"
        className={`relative inline-flex items-center justify-center font-mono font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed ${sizeStyles[size]} ${className}`}
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
        {glow && !disabled && !reducedMotion && (
          <motion.div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${v.glow} 0%, transparent 50%)`,
              opacity: 0.3,
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
            animate={pulse && !reducedMotion ? { opacity: [0.2, 0.5, 0.2] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow), inset 0 1px 0 rgba(255,255,255,0.1); }
            50% { box-shadow: 0 0 30px var(--glow), 0 0 60px var(--glow), inset 0 1px 0 rgba(255,255,255,0.2); }
          }
          .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .animate-pulse-glow { animation: none; }
          }
        `}</style>
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
