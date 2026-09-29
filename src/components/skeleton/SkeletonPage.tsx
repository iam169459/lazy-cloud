'use client';

import { motion } from 'framer-motion';
import Skeleton from './Skeleton';
import { CardSkeleton, TableSkeleton, StatSkeleton } from './SpecializedSkeletons';
import { fadeInUp, staggerContainer, fadeIn } from '@/lib/animations';

type SkeletonType = 'dashboard' | 'table' | 'stats' | 'form' | 'list' | string;

export default function SkeletonPage({ 
  type = 'dashboard',
  className = '',
}: { 
  type?: SkeletonType;
  className?: string;
}) {
  const variants = {
    dashboard: (
      <>
        <motion.div variants={fadeIn} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
        </motion.div>
        <motion.div variants={fadeInUp} custom={0} className="space-y-3">
          <Skeleton variant="text" width="25%" height="1.5rem" />
          <CardSkeleton />
          <CardSkeleton />
        </motion.div>
      </>
    ),
    table: (
      <motion.div variants={fadeInUp} custom={0} className="space-y-3">
        <Skeleton variant="text" width="30%" height="2rem" />
        <TableSkeleton rows={5} cols={6} />
      </motion.div>
    ),
    stats: (
      <motion.div variants={staggerContainer} custom={{ staggerChildren: 0.1 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
      </motion.div>
    ),
    form: (
      <motion.div variants={fadeInUp} custom={0} className="space-y-4 max-w-md">
        {[1,2,3,4,5].map(i => <Skeleton key={i} variant="text" width="100%" height="2.5rem" />)}
        <Skeleton variant="rectangular" width="100%" height="3rem" />
      </motion.div>
    ),
    list: (
      <motion.div variants={staggerContainer} custom={{ staggerChildren: 0.05 }} className="space-y-3">
        {[1,2,3,4,5].map(i => <CardSkeleton key={i} />)}
      </motion.div>
    ),
  };

  return (
    <motion.div 
      variants={fadeIn} 
      className={className}
      style={{ color: 'var(--text)' }}
    >
      {variants[type as keyof typeof variants] || variants.dashboard}
    </motion.div>
  );
}
