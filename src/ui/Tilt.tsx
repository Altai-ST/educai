import React, {useRef} from 'react';

/** Card that tilts towards the pointer in 3D with a soft glare. */
export const Tilt: React.FC<React.HTMLAttributes<HTMLDivElement> & {max?: number}> = ({max = 8, className, children, style, ...rest}) => {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const fine = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  return (
    <div
      ref={ref}
      className={`tilt ${className ?? ''}`}
      style={style}
      onPointerMove={(e) => {
        if (!fine) return;
        const el = ref.current!;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
          el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
          el.style.setProperty('--gx', `${x * 100}%`);
          el.style.setProperty('--gy', `${y * 100}%`);
          el.classList.add('is-tilting');
        });
      }}
      onPointerLeave={() => {
        const el = ref.current!;
        cancelAnimationFrame(raf.current);
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        el.classList.remove('is-tilting');
      }}
      {...rest}
    >
      {children}
      <span className="tilt__glare" aria-hidden />
    </div>
  );
};
