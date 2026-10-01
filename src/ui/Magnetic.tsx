import React, {useRef} from 'react';

/** Wraps a single element and lets it lean towards the pointer. */
export const Magnetic: React.FC<{children: React.ReactElement; strength?: number}> = ({children, strength = 0.28}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  if (!fine) return children;
  return (
    <span
      ref={ref}
      style={{display: 'inline-flex', transition: 'transform .5s cubic-bezier(.22,1,.36,1)'}}
      onPointerMove={(e) => {
        const el = ref.current!;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transition = 'transform .15s ease-out';
        el.style.transform = `translate(${x}px, ${y}px)`;
      }}
      onPointerLeave={() => {
        const el = ref.current!;
        el.style.transition = 'transform .7s cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = '';
      }}
    >
      {children}
    </span>
  );
};
