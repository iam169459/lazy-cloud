'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTheme } from '@/lib/theme';

export default function LoadingBar() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const progress = useMotionValue(0);
  const springProgress = useSpring(progress, { stiffness: 500, damping: 30 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const trickleRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      progress.set(0.1);
      startTrickle();
    };
    const handleDone = () => {
      progress.set(1);
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        progress.set(0);
      }, 300);
    };
    const handleError = () => {
      progress.set(0);
      setIsLoading(false);
    };

    window.addEventListener('lazy-load-start', handleStart);
    window.addEventListener('lazy-load-done', handleDone);
    window.addEventListener('lazy-load-error', handleError);

    return () => {
      window.removeEventListener('lazy-load-start', handleStart);
      window.removeEventListener('lazy-load-done', handleDone);
      window.removeEventListener('lazy-load-error', handleError);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (trickleRef.current) clearInterval(trickleRef.current);
    };
  }, []);

  function startTrickle() {
    if (trickleRef.current) clearInterval(trickleRef.current);
    let current = 0.1;
    trickleRef.current = setInterval(() => {
      if (current >= 0.9) {
        clearInterval(trickleRef.current!);
        return;
      }
      current += Math.random() * 0.05;
      progress.set(Math.min(current, 0.9));
    }, 200);
  }

  if (!isLoading) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      animate={{ opacity: [0, 1] }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={{
          height: '100%',
          borderRadius: '0 2px 2px 0',
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
          backgroundSize: '200% 100%',
          animation: 'loading-bar-flow 1.5s linear infinite',
          transform: `scaleX(${springProgress.get()})`,
        }}
      />
      <style>{`
        @keyframes loading-bar-flow {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </motion.div>
  );
}
