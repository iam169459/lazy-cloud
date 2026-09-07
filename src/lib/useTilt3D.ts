import { useRef, useCallback, RefObject } from 'react';

interface TiltOptions {
  maxTilt?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
}

interface TiltResult<T extends HTMLElement> {
  ref: RefObject<T>;
  onMouseMove: (e: React.MouseEvent<T>) => void;
  onMouseLeave: () => void;
  style: React.CSSProperties;
}

export function useTilt3D<T extends HTMLElement = HTMLDivElement>(
  options: TiltOptions = {}
): TiltResult<T> {
  const { maxTilt = 15, scale = 1.04, speed = 400 } = options;
  const ref = useRef<T>(null);
  const frameRef = useRef<number>(0);
  const currentRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const animate = useCallback(() => {
    const c = currentRef.current;
    c.x += (c.targetX - c.x) / (speed / 16);
    c.y += (c.targetY - c.y) / (speed / 16);

    if (ref.current) {
      const tiltX = c.y;
      const tiltY = -c.x;
      ref.current.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale},${scale},1)`;

      const rect = ref.current.getBoundingClientRect();
      const shineX = ((c.targetX + maxTilt) / (maxTilt * 2)) * 100;
      const shineY = ((-c.targetY + maxTilt) / (maxTilt * 2)) * 100;
      ref.current.style.setProperty('--shine-x', `${shineX}%`);
      ref.current.style.setProperty('--shine-y', `${shineY}%`);
    }

    if (Math.abs(c.targetX - c.x) > 0.01 || Math.abs(c.targetY - c.y) > 0.01) {
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [maxTilt, scale, speed]);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    currentRef.current.targetX = ((y - centerY) / centerY) * maxTilt;
    currentRef.current.targetY = ((x - centerX) / centerX) * maxTilt;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);
  }, [maxTilt, animate]);

  const onMouseLeave = useCallback(() => {
    currentRef.current.targetX = 0;
    currentRef.current.targetY = 0;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  return {
    ref,
    onMouseMove,
    onMouseLeave,
    style: { transformStyle: 'preserve-3d' as const },
  };
}
