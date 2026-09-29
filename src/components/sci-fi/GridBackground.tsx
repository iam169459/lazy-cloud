import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme';

export default function GridBackground({ 
  className = '', 
  animate = true,
  intensity = 1 
}: { 
  className?: string; 
  animate?: boolean; 
  intensity?: number;
}) {
  const { colors } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Read ref once and narrow type
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // These are now properly narrowed as non-null
    const c = canvas;
    const x = ctx;

    let animationId: number;
    let time = 0;
    const speed = animate ? 0.00015 * intensity : 0;

    function resize() {
      const rect = c.getBoundingClientRect();
      c.width = rect.width * window.devicePixelRatio;
      c.height = rect.height * window.devicePixelRatio;
      x.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
      const width = c.offsetWidth;
      const height = c.offsetHeight;
      const gridSize = 60 * intensity;
      
      x.clearRect(0, 0, width, height);
      x.strokeStyle = colors.gridLine;
      x.lineWidth = 0.5;
      
      for (let i = -time % gridSize; i < width; i += gridSize) {
        const opacity = 0.3 + 0.4 * Math.sin((i + time * 0.5) * 0.02);
        x.globalAlpha = opacity;
        x.beginPath();
        x.moveTo(i, 0);
        x.lineTo(i, height);
        x.stroke();
      }
      
      for (let i = -time % gridSize; i < height; i += gridSize) {
        const opacity = 0.3 + 0.4 * Math.sin((i + time * 0.3) * 0.02);
        x.globalAlpha = opacity;
        x.beginPath();
        x.moveTo(0, i);
        x.lineTo(width, i);
        x.stroke();
      }
      
      x.globalAlpha = 0.15;
      x.beginPath();
      x.moveTo(width / 2, 0);
      x.lineTo(width / 2, height);
      x.stroke();
      x.beginPath();
      x.moveTo(0, height / 2);
      x.lineTo(width, height / 2);
      x.stroke();
      
      x.globalAlpha = 1;
      time += speed * 1000;
      animationId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [colors.gridLine, animate, intensity]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
