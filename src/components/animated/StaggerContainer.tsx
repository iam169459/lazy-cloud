'use client';

import { motion } from 'framer-motion';
import * as React from 'react';
import { ReactNode, ReactElement } from 'react';
import { staggerContainer } from '@/lib/animations';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}

export default function StaggerContainer({ 
  children, 
  className = '',
  delayChildren = 0.1,
  staggerChildren = 0.06
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      custom={{ delayChildren, staggerChildren }}
      className={className}
    >
      {React.Children.map(children, (child, index) => 
        React.isValidElement(child) 
          ? React.cloneElement(child as ReactElement, { 
              custom: index,
            })
          : child
      )}
    </motion.div>
  );
}
