import { useEffect, useRef } from 'react';

/**
 * AmbientOrbs - Atmospheric background orbs for Glassmorphism depth
 * Creates 3 softly blurred, animated gradient orbs that float in the background
 */
export function AmbientOrbs() {
  const orbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orbs = orbsRef.current;
    if (!orbs) return;

    // Subtle parallax on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / innerWidth;
      const y = (e.clientY - innerHeight / 2) / innerHeight;

      const orbsElements = orbs.querySelectorAll('.ambient-orb');
      orbsElements.forEach((orb, index) => {
        const speed = (index + 1) * 0.3;
        const xOffset = x * 30 * speed;
        const yOffset = y * 30 * speed;
        (orb as HTMLElement).style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={orbsRef} className="ambient-orbs" aria-hidden="true">
      {/* Cyan Orb - Top Left */}
      <div className="ambient-orb orb-cyan" style={{
        width: '500px',
        height: '500px',
        top: '-150px',
        left: '-150px',
        background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
        animation: 'orb-float-1 25s ease-in-out infinite',
      }} />

      {/* Emerald Orb - Bottom Right */}
      <div className="ambient-orb orb-emerald" style={{
        width: '600px',
        height: '600px',
        bottom: '-200px',
        right: '-200px',
        background: 'radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
        animation: 'orb-float-2 30s ease-in-out infinite reverse',
      }} />

      {/* Blue Orb - Center */}
      <div className="ambient-orb orb-blue" style={{
        width: '400px',
        height: '400px',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        animation: 'orb-float-3 35s ease-in-out infinite',
      }} />
    </div>
  );
}

export default AmbientOrbs;