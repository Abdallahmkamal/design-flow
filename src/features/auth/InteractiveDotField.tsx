import { useEffect, useRef } from 'react';

import styles from './AuthenticationPage.module.css';

interface Point {
  x: number;
  y: number;
}

const GRID_GAP = 28;
const INFLUENCE_RADIUS = 132;

export function InteractiveDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    if (navigator.userAgent.includes('jsdom')) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activePoint: Point | null = null;
    let pressed = false;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);
      context.fillStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-text-error')
          .trim() || '#9e2530';

      const columns = Math.ceil(bounds.width / GRID_GAP) + 1;
      const rows = Math.ceil(bounds.height / GRID_GAP) + 1;
      const offsetX = (bounds.width % GRID_GAP) / 2;
      const offsetY = (bounds.height % GRID_GAP) / 2;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const originX = offsetX + column * GRID_GAP;
          const originY = offsetY + row * GRID_GAP;
          let x = originX;
          let y = originY;
          let radius = 1.15;
          let alpha = 0.14;

          if (activePoint && !reducedMotion.matches) {
            const deltaX = originX - activePoint.x;
            const deltaY = originY - activePoint.y;
            const distance = Math.hypot(deltaX, deltaY);

            if (distance < INFLUENCE_RADIUS) {
              const strength = 1 - distance / INFLUENCE_RADIUS;
              const displacement = strength * (pressed ? 12 : 8);
              const divisor = distance || 1;

              x += (deltaX / divisor) * displacement;
              y += (deltaY / divisor) * displacement;
              radius += strength * (pressed ? 4.4 : 3.2);
              alpha += strength * 0.46;
            }
          }

          context.globalAlpha = alpha;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
      }

      context.globalAlpha = 1;
    };

    const updatePoint = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      activePoint = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      draw();
    };

    const handlePointerDown = (event: PointerEvent) => {
      pressed = true;
      updatePoint(event);
    };

    const handlePointerUp = (event: PointerEvent) => {
      pressed = false;
      updatePoint(event);
    };

    const handlePointerLeave = () => {
      activePoint = null;
      pressed = false;
      draw();
    };

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    reducedMotion.addEventListener('change', draw);
    canvas.addEventListener('pointermove', updatePoint);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerLeave);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    draw();

    return () => {
      resizeObserver.disconnect();
      reducedMotion.removeEventListener('change', draw);
      canvas.removeEventListener('pointermove', updatePoint);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerLeave);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={styles.dotField} aria-hidden="true" />
  );
}
