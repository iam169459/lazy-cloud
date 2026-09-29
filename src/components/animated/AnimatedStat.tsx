'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedStatProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
  animateCount?: boolean;
  format?: (val: number) => string;
}

export default function AnimatedStat({ 
  label, 
  value, 
  icon,
  trend,
  className = '',
  animateCount = true,
  format = (v) => String(v),
}: AnimatedStatProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  const count = useMotionValue(0);
  const displayCount = useSpring(count, { stiffness: 100, damping: 20 });

  return (
    <div className={`flex flex-col gap-2 ${className}`} style={{ 
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '1rem',
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
    }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
            {label}
          </p>
          {animateCount && typeof numValue === 'number' ? (
            <motion.p 
              style={{ color: 'var(--text)', fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace' }}
            >
              {displayCount}
            </motion.p>
          ) : (
            <p className="text-3xl font-bold font-mono" style={{ color: 'var(--text)' }}>
              {format(numValue)}
            </p>
          )}
        </div>
        {icon && (
          <div className="shrink-0 p-3 rounded-xl" style={{ 
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
          }}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <motion.div 
          className="flex items-center gap-1 text-xs"
          style={{ color: trend.value >= 0 ? 'var(--success)' : 'var(--danger)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span>{trend.value >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{trend.label}</span>
        </motion.div>
      )}
    </div>
  );
}
