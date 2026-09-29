'use client';

import { motion } from 'framer-motion';
import * as React from 'react';
import { ReactNode, ReactElement } from 'react';
import { staggerContainer, fadeInUp } from '@/lib/animations';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: 'vertical' | 'horizontal';
}

export default function AnimatedList({ 
  children, 
  className = '',
  staggerDelay = 0.06,
}: AnimatedListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      custom={{ delayChildren: 0.1, staggerChildren: staggerDelay }}
      className={`${className} flex flex-col gap-3`}
    >
      {React.Children.map(children, (child, index) => 
        React.isValidElement(child) 
          ? React.cloneElement(child as ReactElement, { 
              custom: index,
              variants: fadeInUp,
            })
          : child
      )}
    </motion.div>
  );
}
