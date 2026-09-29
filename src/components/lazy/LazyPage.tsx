'use client';

import { Suspense, lazy, ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonPage } from '@/components/skeleton';
import { fadeIn, slideInFromBottom } from '@/lib/animations';

export default function LazyPage({ 
  loader, 
  skeletonType = 'dashboard', 
  className = '' 
}: { 
  loader: () => Promise<{ default: ComponentType<unknown> }>;
  skeletonType?: 'dashboard' | 'table' | 'stats' | 'form' | 'list';
  className?: string;
}) {
  const LazyComponent = lazy(loader);
  
  return (
    <AnimatePresence mode="wait">
      <Suspense 
        fallback={
          <motion.div 
            variants={fadeIn} 
            initial="hidden" 
            animate="enter"
          >
            <SkeletonPage type={skeletonType} />
          </motion.div>
        }
      >
        <motion.div
          variants={slideInFromBottom}
          initial="initial"
          animate="enter"
          exit="exit"
          className={className}
        >
          <LazyComponent />
        </motion.div>
      </Suspense>
    </AnimatePresence>
  );
}
