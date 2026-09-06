import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/lib/theme';

export default function MouseGlow() {
  const { colors } = useTheme();
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: -200, y: -200 });
  const currentRef = useRef({ x: -200, y: -200 });

  const animate = useCallback(() => {
    const dx = targetRef.current.x - currentRef.current.x;
    const dy = targetRef.current.y - currentRef.current.y;
    currentRef.current.x += dx * 0.15;
    currentRef.current.y += dy * 0.15;
    setPos({ x: currentRef.current.x, y: currentRef.current.y });
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  useEffect(() => {
    function handleMouse(e: MouseEvent) {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    }

    function handleTouch(e: TouchEvent) {
      if (e.touches.length > 0) {
        targetRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (!visible) setVisible(true);
      }
    }

    function handleLeave() {
      targetRef.current = { x: -200, y: -200 };
    }

    window.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchstart', handleTouch, { passive: true });
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [visible]);

  return (
    <div
      className="fixed pointer-events-none z-[1] transition-opacity duration-500"
      style={{
        left: pos.x - 200,
        top: pos.y - 200,
        width: 400,
        height: 400,
        background: `radial-gradient(circle, ${colors.primaryGlow} 0%, transparent 70%)`,
        opacity: visible ? 1 : 0,
        filter: 'blur(40px)',
      }}
    />
  );
}
