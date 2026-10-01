/** Shared pieces for the «Десятичные дроби» tasks: coloured decimals, the standing figure, helpers. */
import React, {useEffect, useState} from 'react';
import {motion, useMotionValueEvent, useSpring} from 'motion/react';
import {C} from '../../art/kit';
import './desyatichnye.css';

const flip = {type: 'spring', stiffness: 520, damping: 30} as const;

/** One digit that flips in from below whenever it changes. */
const Digit: React.FC<{ch: string; slot: string}> = ({ch, slot}) => (
  <motion.span key={slot + ch} className="des-dec__d" initial={{y: '0.32em', opacity: 0}} animate={{y: 0, opacity: 1}} transition={flip}>
    {ch}
  </motion.span>
);

/**
 * A decimal in the colours of the video: whole ink, comma red, tenths teal, hundredths red.
 * `extra` — appended digits (the «допиши ноль» trick), drawn in mustard.
 * `labels` — «целые / десятые / сотые» under the places, like in the video.
 */
export const DecNum: React.FC<{
  v: string;
  extra?: string;
  labels?: boolean;
  tone?: 'ink' | 'right' | 'wrong';
  size?: number | string;
  className?: string;
}> = ({v, extra = '', labels, tone = 'ink', size, className = ''}) => {
  const [whole, frac = ''] = v.split(',');
  return (
    <span className={`des-dec num tone-${tone} ${labels ? 'has-labels' : ''} ${className}`} style={size ? {fontSize: size} : undefined} aria-label={v + extra}>
      <span className="des-dec__g is-whole">
        {whole.split('').map((ch, i) => (
          <Digit key={i} ch={ch} slot={`w${whole.length - i}`} />
        ))}
        {labels && <span className="des-dec__lab">целые</span>}
      </span>
      <span className="des-dec__comma">,</span>
      {frac.split('').map((ch, i) => (
        <span key={i} className={`des-dec__g is-p${Math.min(i, 2)}`}>
          <Digit ch={ch} slot={`f${i}`} />
          {labels && i < 2 && <span className="des-dec__lab">{i === 0 ? 'десятые' : 'сотые'}</span>}
        </span>
      ))}
      {extra.split('').map((ch, i) => (
        <motion.span
          key={'x' + i}
          className="des-dec__g is-extra"
          initial={{opacity: 0, y: '-0.5em', scale: 0.4}}
          animate={{opacity: 1, y: 0, scale: 1}}
          transition={{type: 'spring', stiffness: 420, damping: 16, delay: 0.08 + i * 0.12}}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
};

/** Russian plural: plural(3, 'столбец', 'столбца', 'столбцов') → 'столбца' */
export const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
};

/** 162 (hundredths) → "1,62"; 7 → "0,07" */
export const fromHundredths = (h: number) => `${Math.floor(h / 100)},${String(h % 100).padStart(2, '0')}`;

/** true on phone-sized screens — SVG stages switch to a taller, narrower layout */
export function useNarrow(max = 640) {
  const q = `(max-width: ${max}px)`;
  const [narrow, setNarrow] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    const on = () => setNarrow(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return narrow;
}

/** A number that springs towards `target` (for SVG geometry that motion can't tween directly). */
export function useSpringNumber(target: number, stiffness = 420, damping = 34) {
  const s = useSpring(target, {stiffness, damping});
  const [v, setV] = useState(target);
  useEffect(() => s.set(target), [s, target]);
  useMotionValueEvent(s, 'change', setV);
  return v;
}

/** Faceless standing pictogram (like the 1,75 m person in the video). Feet at (x, y), height h. */
export const Figure: React.FC<{x: number; y: number; h: number; color?: string}> = ({x, y, h, color = C.blue}) => {
  const top = y - h;
  const r = h * 0.085;
  const tw = h * 0.26;
  const legW = h * 0.12;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={h * 0.2} ry={Math.max(5, h * 0.025)} fill={C.ink} opacity={0.13} />
      <circle cx={x} cy={top + r} r={r} fill={color} />
      <rect x={x - tw / 2} y={top + h * 0.2} width={tw} height={h * 0.38} rx={h * 0.1} fill={color} />
      <rect x={x - tw / 2 - h * 0.074} y={top + h * 0.215} width={h * 0.062} height={h * 0.34} rx={h * 0.031} fill={color} />
      <rect x={x + tw / 2 + h * 0.012} y={top + h * 0.215} width={h * 0.062} height={h * 0.34} rx={h * 0.031} fill={color} />
      <rect x={x - legW - h * 0.01} y={top + h * 0.5} width={legW} height={h * 0.5} rx={legW / 2} fill={color} />
      <rect x={x + h * 0.01} y={top + h * 0.5} width={legW} height={h * 0.5} rx={legW / 2} fill={color} />
      <circle cx={x - r * 0.35} cy={top + r * 0.65} r={r * 0.28} fill="#fff" opacity={0.22} />
    </g>
  );
};
