'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Streak {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  alpha: number;
  hue: number;
  phase: number;
}

interface Orb {
  x: number;
  y: number;
  r: number;
  alpha: number;
  hue: number;
  speed: number;
  phase: number;
}

interface LuxuryCanvasBackgroundProps {
  className?: string;
}

export function LuxuryCanvasBackground({ className }: LuxuryCanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const streaksRef = useRef<Streak[]>([]);
  const orbsRef = useRef<Orb[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const createScene = () => {
      streaksRef.current = Array.from({ length: 7 }, () => ({
        x: Math.random(),
        y: Math.random() * 0.58 + 0.12,
        w: Math.random() * 0.42 + 0.16,
        h: Math.random() * 0.003 + 0.001,
        speed: (Math.random() * 0.00008 + 0.00004) * (Math.random() < 0.5 ? 1 : -1),
        alpha: Math.random() * 0.12 + 0.04,
        hue: Math.random() < 0.55 ? 38 : 175,
        phase: Math.random() * Math.PI * 2,
      }));

      orbsRef.current = [
        { x: 0.15, y: 0.6, r: 0.2, alpha: 0.08, hue: 38, speed: 0.00006, phase: 0 },
        { x: 0.75, y: 0.35, r: 0.24, alpha: 0.06, hue: 175, speed: 0.00005, phase: Math.PI * 0.5 },
        { x: 0.5, y: 0.8, r: 0.14, alpha: 0.05, hue: 38, speed: 0.00007, phase: Math.PI },
        { x: 0.35, y: 0.2, r: 0.16, alpha: 0.07, hue: 220, speed: 0.00004, phase: Math.PI * 1.5 },
      ];
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createScene();
    };

    const draw = (now = 0) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const pulse = Math.sin(now * 0.0004) * 0.5 + 0.5;
      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, `rgba(${8 + pulse * 4},${6 + pulse * 2},4,1)`);
      base.addColorStop(0.38, `rgba(${12 + pulse * 3},${16 + pulse * 4},${14 + pulse * 3},1)`);
      base.addColorStop(0.72, `rgba(8,10,${16 + pulse * 5},1)`);
      base.addColorStop(1, 'rgba(6,4,8,1)');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      orbsRef.current.forEach((orb) => {
        const ox = (orb.x + Math.sin(now * orb.speed + orb.phase) * 0.06) * width;
        const oy = (orb.y + Math.cos(now * orb.speed * 0.7 + orb.phase) * 0.04) * height;
        const radius = orb.r * Math.min(width, height);
        const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
        const alpha = orb.alpha * (0.7 + Math.sin(now * 0.0003 + orb.phase) * 0.3);
        glow.addColorStop(0, `hsla(${orb.hue}, 60%, 60%, ${alpha})`);
        glow.addColorStop(0.5, `hsla(${orb.hue}, 40%, 40%, ${orb.alpha * 0.4})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      });

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      streaksRef.current.forEach((streak) => {
        const sy = (streak.y + Math.sin(now * streak.speed * 3 + streak.phase) * 0.015) * height;
        const sw = streak.w * width;
        const sx = ((streak.x + now * streak.speed + 1) % 1.4 - 0.2) * width;
        const sh = streak.h * height;
        const alpha = streak.alpha * (0.5 + Math.sin(now * 0.0005 + streak.phase) * 0.5);
        const glow = ctx.createLinearGradient(sx, 0, sx + sw, 0);
        glow.addColorStop(0, 'transparent');
        glow.addColorStop(0.3, `hsla(${streak.hue}, 70%, 70%, ${alpha})`);
        glow.addColorStop(0.5, `hsla(${streak.hue}, 80%, 80%, ${alpha * 1.4})`);
        glow.addColorStop(0.7, `hsla(${streak.hue}, 70%, 70%, ${alpha})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(sx + sw / 2, sy + Math.sin(now * 0.0002 + streak.phase) * sh * 2, sw / 2, sh * 3, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      const horizonY = height * (0.58 + Math.sin(now * 0.00015) * 0.02);
      const horizon = ctx.createLinearGradient(0, horizonY - height * 0.08, 0, horizonY + height * 0.05);
      horizon.addColorStop(0, 'transparent');
      horizon.addColorStop(0.45, `rgba(180,140,60,${0.05 + Math.sin(now * 0.0003) * 0.02})`);
      horizon.addColorStop(0.62, `rgba(200,160,80,${0.08 + Math.sin(now * 0.0004) * 0.03})`);
      horizon.addColorStop(1, 'transparent');
      ctx.fillStyle = horizon;
      ctx.fillRect(0, horizonY - height * 0.08, width, height * 0.13);

      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#81D8D0';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i += 1) {
        const y = height * (0.72 + i * 0.035);
        ctx.beginPath();
        for (let x = 0; x <= width; x += 18) {
          const waveY = y + Math.sin(x * 0.012 + now * 0.001 + i) * (2 + i * 0.25);
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
      ctx.restore();

      const vignette = ctx.createLinearGradient(0, height * 0.48, 0, height);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(0,0,0,.72)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, height * 0.48, width, height * 0.52);

      if (!prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className={cn('absolute inset-0 h-full w-full', className)} />;
}
