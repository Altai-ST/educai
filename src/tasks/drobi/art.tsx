/** Drawings and small helpers used only by the «Дроби» tasks. Same flat look as the video. */
import React, {useEffect, useState} from 'react';
import {useMotionValueEvent, useSpring} from 'motion/react';
import {C, pol} from '../../art/kit';

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));

/** n/d reduced, or null when it does not simplify */
export const simplify = (n: number, d: number): [number, number] | null => {
  const g = gcd(n, d);
  return n > 0 && g > 1 ? [n / g, d / g] : null;
};

/** A number that springs to `target` and re-renders on every frame (for art that takes plain numbers). */
export function useSpringNumber(target: number, opts: {stiffness?: number; damping?: number} = {}) {
  const mv = useSpring(target, {stiffness: opts.stiffness ?? 170, damping: opts.damping ?? 18});
  const [v, setV] = useState(target);
  useEffect(() => mv.set(target), [mv, target]);
  useMotionValueEvent(mv, 'change', setV);
  return v;
}

/** true while the viewport is narrower than `px` */
export function useNarrow(px = 600) {
  const q = `(max-width: ${px}px)`;
  const [m, setM] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

/* ---------------- Crown (the winner burger, like in the video) ---------------- */

export const Crown: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -46 18 L -54 -30 L -24 -6 L 0 -40 L 24 -6 L 54 -30 L 46 18 Z" fill={C.mustard} strokeLinejoin="round" stroke={C.mustard} strokeWidth={6} />
    <rect x={-48} y={14} width={96} height={14} rx={5} fill="#D99A2B" />
    {[-54, 0, 54].map((cx, i) => (
      <circle key={i} cx={cx} cy={i === 1 ? -42 : -32} r={7} fill={C.mustard} />
    ))}
  </g>
);

/* ---------------- Chocolate piece (same style as art Chocolate) ---------------- */

export const ChocoPiece: React.FC<{w: number; h: number; taken?: boolean}> = ({w, h, taken}) => (
  <g>
    <rect x={0} y={0} width={w} height={h} rx={14} fill={taken ? '#7B4A2E' : '#6A3E26'} />
    <rect x={w * 0.14} y={h * 0.13} width={w * 0.72} height={h * 0.74} rx={10} fill="#83502F" />
    <rect x={w * 0.2} y={h * 0.2} width={w * 0.6} height={h * 0.13} rx={6} fill="#9C6640" opacity={0.8} />
  </g>
);

/* ---------------- Clock face (white face, ink rim, ticks) ---------------- */

/** `children` are drawn on the face, under the ticks (e.g. a filled sector) */
export const ClockFace: React.FC<{cx: number; cy: number; r: number; children?: React.ReactNode}> = ({cx, cy, r, children}) => (
  <g>
    <circle cx={cx + 8} cy={cy + 14} r={r + 6} fill={C.ink} opacity={0.13} />
    <circle cx={cx} cy={cy} r={r} fill={C.white} />
    {children}
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.ink} strokeWidth={16} />
    {Array.from({length: 60}, (_, i) => {
      const hour = i % 5 === 0;
      const [x0, y0] = pol(cx, cy, r - (hour ? 52 : 30), i * 6);
      const [x1, y1] = pol(cx, cy, r - 22, i * 6);
      return (
        <line
          key={i}
          x1={x0}
          y1={y0}
          x2={x1}
          y2={y1}
          stroke={C.ink}
          strokeWidth={hour ? 9 : 3.5}
          strokeLinecap="round"
          opacity={hour ? 1 : 0.45}
        />
      );
    })}
  </g>
);
