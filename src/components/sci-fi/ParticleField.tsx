import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme';

interface ParticleFieldProps {
  className?: string;
  count?: number;
  color?: string;
  speed?: number;
  size?: number;
}

export default function ParticleField({ 
  className = '', 
  count = 50,
  color,
  speed = 1,
  size = 2
}: ParticleFieldProps) {
  const { colors } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number; opacity: number }>>([]);
  const animationIdRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const c = canvas;
    const x = ctx;

    const particleColor = color || colors.primary;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * c.offsetWidth,
      y: Math.random() * c.offsetHeight,
      vx: (Math.random() - 0.5) * 0.5 * speed,
      vy: (Math.random() - 0.5) * 0.5 * speed,
      radius: Math.random() * size + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    particlesRef.current = particles;

    function resize() {
      const rect = c.getBoundingClientRect();
      c.width = rect.width * window.devicePixelRatio;
      c.height = rect.height * window.devicePixelRatio;
      x.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
      const width = c.offsetWidth;
      const height = c.offsetHeight;
      
      x.clearRect(0, 0, width, height);
      
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        
        x.beginPath();
        x.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        x.fillStyle = particleColor;
        x.globalAlpha = p.opacity;
        x.fill();
      });
      
      x.globalAlpha = 1;
      animationIdRef.current = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [colors.primary, count, speed, size, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
