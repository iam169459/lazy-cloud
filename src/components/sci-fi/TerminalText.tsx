import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '@/lib/theme';

interface TerminalTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  loop?: boolean;
  cursor?: boolean;
}

export default function TerminalText({ 
  text, 
  speed = 30,
  className = '',
  onComplete,
  loop = false,
  cursor = true
}: TerminalTextProps) {
  const { colors } = useTheme();
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayText(text);
      setIndex(text.length);
      return;
    }
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, index + 1));
        setIndex(i => i + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (loop) {
      const timeout = setTimeout(() => {
        setDisplayText('');
        setIndex(0);
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      handleComplete();
    }
  }, [index, text, speed, loop, reducedMotion, handleComplete]);

  useEffect(() => {
    if (cursor && index < text.length && !reducedMotion) {
      const interval = setInterval(() => setShowCursor(c => !c), 530);
      return () => clearInterval(interval);
    }
  }, [cursor, index, text.length, reducedMotion]);

  return (
    <span className={`font-mono ${className}`} style={{ color: colors.terminal }}>
      {displayText}
      {cursor && index < text.length && showCursor && !reducedMotion && (
        <span className="animate-blink ml-1" style={{ color: colors.terminal }}>█</span>
      )}
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 1.06s step-end infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-blink { animation: none; }
        }
      `}</style>
    </span>
  );
}
