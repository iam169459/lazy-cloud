import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/theme';

export default function Scanlines({ 
  className = '', 
  speed = 1,
  opacity = 1 
}: { 
  className?: string; 
  speed?: number; 
  opacity?: number;
}) {
  const { colors } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);
  const styleRef = useRef<HTMLStyleElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (styleRef.current) {
      styleRef.current.textContent = `
        @keyframes scanline-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
      `;
    }
  }, [colors.scanline]);

  if (reducedMotion) return null;

  return (
    <>
      <style ref={styleRef} />
      <div 
        className={`fixed inset-0 pointer-events-none ${className}`}
        style={{
          zIndex: 9999,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${colors.scanline} 2px,
            ${colors.scanline} 4px
          )`,
          opacity,
          animation: `scanline-move ${20 / speed}s linear infinite`,
        }}
      />
    </>
  );
}
