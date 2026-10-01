import React, {useEffect, useRef} from 'react';

export type Formula = {text: string; color: string; label: string};

type P = {x: number; y: number; vx: number; vy: number; tx: number; ty: number; c: string; s: number; free: boolean};

/**
 * Thousands of particles that flow from one formula to the next (one per subject)
 * and scatter away from the pointer. Canvas 2D, pauses off-screen.
 */
export const FormulaField: React.FC<{formulas: Formula[]; onChange?: (i: number) => void; interval?: number; className?: string}> = ({formulas, onChange, interval = 3600, className}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0, idx = 0, visible = true, timer = 0;
    const mouse = {x: -9999, y: -9999};
    const N = innerWidth < 700 ? 900 : 1700;
    const parts: P[] = [];

    const sample = (f: Formula) => {
      const off = document.createElement('canvas');
      const area = {x: w * (w < 900 ? 0.04 : 0.48), y: h * (w < 900 ? 0.04 : 0.16), w: w * (w < 900 ? 0.92 : 0.5), h: h * (w < 900 ? 0.3 : 0.62)};
      off.width = Math.ceil(area.w);
      off.height = Math.ceil(area.h);
      const o = off.getContext('2d')!;
      let size = area.h * 0.62;
      o.font = `700 ${size}px "Unbounded Variable", sans-serif`;
      const mw = o.measureText(f.text).width;
      if (mw > area.w * 0.94) size *= (area.w * 0.94) / mw;
      o.font = `700 ${size}px "Unbounded Variable", sans-serif`;
      o.fillStyle = '#fff';
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      o.fillText(f.text, area.w / 2, area.h / 2);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const step = Math.max(3, Math.round(Math.sqrt((area.w * area.h * 0.18) / N)));
      const pts: [number, number][] = [];
      for (let y = 0; y < off.height; y += step)
        for (let x = 0; x < off.width; x += step) if (data[(y * off.width + x) * 4 + 3] > 140) pts.push([area.x + x, area.y + y]);
      // shuffle so particles travel in a lively way
      for (let i = pts.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
      return pts;
    };

    const assign = (i: number) => {
      const f = formulas[i];
      const pts = sample(f);
      parts.forEach((p, k) => {
        if (k < pts.length) {
          p.tx = pts[k][0] + (Math.random() - 0.5) * 1.5;
          p.ty = pts[k][1] + (Math.random() - 0.5) * 1.5;
          p.free = false;
          p.c = Math.random() < 0.82 ? f.color : '#ffffff';
        } else {
          // leftovers drift as dust
          p.free = true;
          p.tx = Math.random() * w;
          p.ty = Math.random() * h;
          p.c = 'rgba(255,255,255,0.35)';
        }
      });
      cb.current?.(i);
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!parts.length)
        for (let i = 0; i < N; i++) parts.push({x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, tx: 0, ty: 0, c: '#fff', s: 1.2 + Math.random() * 1.6, free: true});
      assign(idx);
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const k = p.free ? 0.0016 : 0.045;
        p.vx += dx * k;
        p.vy += dy * k;
        const mx = p.x - mouse.x, my = p.y - mouse.y;
        const d2 = mx * mx + my * my;
        if (d2 < 120 * 120) {
          const f = (1 - Math.sqrt(d2) / 120) * 2.4;
          const d = Math.sqrt(d2) || 1;
          p.vx += (mx / d) * f;
          p.vy += (my / d) * f;
        }
        if (p.free) {
          p.vx += (Math.random() - 0.5) * 0.05;
          p.vy += (Math.random() - 0.5) * 0.05;
        }
        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });

    let cancelled = false;
    document.fonts.load('700 80px "Unbounded Variable"').finally(() => {
      if (cancelled) return;
      resize();
      if (reduce) {
        parts.forEach((p) => {
          p.x = p.tx;
          p.y = p.ty;
        });
        tick();
        cancelAnimationFrame(raf);
        return;
      }
      raf = requestAnimationFrame(tick);
      io.observe(canvas);
      timer = window.setInterval(() => {
        if (!visible) return;
        idx = (idx + 1) % formulas.length;
        assign(idx);
      }, interval);
    });
    addEventListener('resize', resize);
    canvas.parentElement?.addEventListener('pointermove', onMove);
    canvas.parentElement?.addEventListener('pointerleave', onLeave);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearInterval(timer);
      io.disconnect();
      removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('pointermove', onMove);
      canvas.parentElement?.removeEventListener('pointerleave', onLeave);
    };
  }, [formulas, interval]);

  return <canvas ref={ref} className={className} aria-hidden />;
};
