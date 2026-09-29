'use client';

import { motion } from 'framer-motion';
import { shimmerVariants } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({ 
  className = '', 
  variant = 'text', 
  width = '100%', 
  height = '1rem',
  count = 1,
}: SkeletonProps) {
  const { colors } = useTheme();

  const baseStyle = {
    background: `linear-gradient(90deg, ${colors.cardBorder} 25%, ${colors.bgHover} 50%, ${colors.cardBorder} 75%)`,
    backgroundSize: '200% 100%',
    borderRadius: variant === 'circular' ? '50%' : variant === 'card' ? '1rem' : '0.5rem',
    animation: 'none',
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      variants={shimmerVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: i * 0.1 }}
      className={className}
      style={{
        ...baseStyle,
        width,
        height,
        borderRadius: variant === 'circular' ? '50%' : variant === 'card' ? '1rem' : '0.5rem',
      }}
    />
  ));

  return count > 1 ? <div className="space-y-3">{skeletons}</div> : skeletons[0];
}
