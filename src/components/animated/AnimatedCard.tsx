'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';
import { cardHover } from '@/lib/animations';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  hover?: boolean;
  variant?: 'default' | 'glass' | 'hologram';
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, hover = true, variant = 'default', className = '', ...props }, ref) => {
    const variants = hover ? cardHover : undefined;
    
    const baseStyle = {
      background: variant === 'glass' 
        ? 'rgba(255,255,255,0.02)'
        : variant === 'hologram'
        ? 'linear-gradient(135deg, var(--hologram)05 0%, var(--bg-card) 100%)'
        : 'var(--card-bg)',
      border: `1px solid ${variant === 'hologram' ? 'var(--hologram)40' : 'var(--card-border)'}`,
      borderRadius: '1rem',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    };

    return (
      <motion.div
        ref={ref}
        variants={variants}
        whileHover={hover ? 'hover' : undefined}
        whileTap="tap"
        initial="rest"
        animate="rest"
        className={className}
        style={{ ...baseStyle, ...props.style }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
