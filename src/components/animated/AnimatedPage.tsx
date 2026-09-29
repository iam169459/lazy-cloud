'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { pageVariants, fadeIn } from '@/lib/animations';

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  variant?: 'page' | 'fade';
}

export default function AnimatedPage({ 
  children, 
  className = '', 
  variant = 'page'
}: AnimatedPageProps) {
  const variants = variant === 'fade' ? fadeIn : pageVariants;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
