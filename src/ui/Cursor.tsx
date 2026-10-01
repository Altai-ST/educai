import React, {useEffect, useRef, useState} from 'react';

/**
 * Two-part cursor: an exact dot and a lagging ring. Elements with data-cursor="label" grow the ring
 * and show the label; data-cursor="drag" switches to a grab hint.
 */
export const Cursor: React.FC = () => {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<'idle' | 'link' | 'label' | 'drag' | 'down' | 'text'>('idle');
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setOn(true);
    document.body.classList.add('has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0, visible = false;
    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        dot.current?.style.setProperty('opacity', '1');
        ring.current?.style.setProperty('opacity', '1');
      }
      const t = (e.target as HTMLElement | null)?.closest?.('[data-cursor], a, button, input, [role="button"], label, select') as HTMLElement | null;
      if (!t) {
        setMode((m) => (m === 'down' ? m : 'idle'));
        setLabel('');
        return;
      }
      const c = t.getAttribute('data-cursor');
      if (c === 'drag') setMode('drag');
      else if (c === 'none') setMode('idle');
      else if (c) {
        setMode('label');
        setLabel(c);
      } else if (t.tagName === 'INPUT') setMode('text');
      else setMode('link');
      if (!c) setLabel('');
    };
    const leave = () => {
      visible = false;
      dot.current?.style.setProperty('opacity', '0');
      ring.current?.style.setProperty('opacity', '0');
    };
    const down = () => ring.current?.classList.add('is-down');
    const up = () => ring.current?.classList.remove('is-down');
    addEventListener('pointermove', move, {passive: true});
    document.addEventListener('pointerleave', leave);
    addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      removeEventListener('pointerdown', down);
      removeEventListener('pointerup', up);
      document.body.classList.remove('has-cursor');
    };
  }, []);

  if (!on) return null;
  return (
    <>
      <div ref={ring} className={`cursor-ring is-${mode}`} aria-hidden>
        <span>{mode === 'drag' ? '↔' : label}</span>
      </div>
      <div ref={dot} className={`cursor-dot is-${mode}`} aria-hidden />
    </>
  );
};
