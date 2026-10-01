/**
 * Graphics for the «Проценты» tasks — same flat look as the video:
 * white 10×10 grid with paper lines, test sheet with ticks, small pictograms.
 */
import React from 'react';
import {motion} from 'motion/react';
import {C, FONT} from '../../art/kit';
import {fmtNum} from '../kit';
import './procenty.css';

/** grey of the «already taken» cells — the first discount */
export const GREY = '#BDB4A3';

/** 8000 → "8 000" with a non-breaking space (never wraps) */
export const money = (n: number) => fmtNum(n).replace(/ /g, '\u00A0');

/** "35 %" in HTML: number, a narrow gap, the sign */
export const Pct: React.FC<{n: React.ReactNode; className?: string; style?: React.CSSProperties}> = ({n, className = '', style}) => (
  <span className={`proc-pct num ${className}`} style={style}>
    {n}
    <span className="proc-pct__s">%</span>
  </span>
);

/**
 * Static 10×10 grid (cells column-major: index = col * 10 + row).
 * fill(i) → colour of the cell or undefined (= base). Cells animate their colour
 * with a per-cell delay, so a grid «fills itself» like in the video.
 */
export const CellGrid: React.FC<{
  x: number;
  y: number;
  size: number;
  fill: (i: number) => string | undefined;
  delay?: (i: number) => number;
  base?: string;
}> = ({x, y, size, fill, delay = () => 0, base = C.white}) => {
  const cs = size / 10;
  return (
    <g>
      <rect x={x + size * 0.015} y={y + size * 0.025} width={size} height={size} rx={size * 0.025} fill={C.ink} opacity={0.12} />
      <rect x={x} y={y} width={size} height={size} fill={base} />
      {Array.from({length: 100}, (_, i) => (
        <motion.rect
          key={i}
          x={x + Math.floor(i / 10) * cs}
          y={y + (i % 10) * cs}
          width={cs}
          height={cs}
          initial={{fill: base}}
          animate={{fill: fill(i) ?? base}}
          transition={{duration: 0.22, delay: fill(i) ? delay(i) : 0}}
        />
      ))}
      {Array.from({length: 9}, (_, k) => (
        <React.Fragment key={k}>
          <line x1={x + cs * (k + 1)} x2={x + cs * (k + 1)} y1={y} y2={y + size} stroke={C.paper} strokeWidth={Math.max(2, size / 105)} />
          <line x1={x} x2={x + size} y1={y + cs * (k + 1)} y2={y + cs * (k + 1)} stroke={C.paper} strokeWidth={Math.max(1.5, size / 170)} />
        </React.Fragment>
      ))}
      <rect x={x} y={y} width={size} height={size} rx={3} fill="none" stroke={C.ink} strokeWidth={Math.max(3, size / 70)} />
    </g>
  );
};

/** «Контрольная»: a sheet with 10 lines, a tick or a cross on each. wrong = 0-based indexes of crosses */
export const TestSheet: React.FC<{x: number; y: number; s?: number; wrong?: number[]; rotate?: number}> = ({x, y, s = 1, wrong = [6], rotate = -4}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    <rect x={-142} y={-192} width={300} height={400} rx={10} fill={C.ink} opacity={0.13} />
    <rect x={-150} y={-200} width={300} height={400} rx={10} fill={C.white} />
    <text x={-118} y={-150} fontFamily={FONT} fontSize={28} fontWeight={800} fill={C.ink}>Контрольная</text>
    {Array.from({length: 10}, (_, i) => {
      const yy = -112 + i * 31;
      const bad = wrong.includes(i);
      return (
        <g key={i}>
          <text x={-118} y={yy + 6} fontFamily={FONT} fontSize={16} fontWeight={700} fill={C.ink} opacity={0.75}>{i + 1}.</text>
          <rect x={-86} y={yy - 2} width={150 - (i % 3) * 18} height={7} rx={3.5} fill={C.paper2} />
          {bad ? (
            <motion.path
              d={`M ${92} ${yy - 10} l 18 18 M ${110} ${yy - 10} l -18 18`}
              stroke={C.red}
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
              initial={{pathLength: 0}}
              animate={{pathLength: 1}}
              transition={{duration: 0.3, delay: 0.15 + i * 0.07}}
            />
          ) : (
            <motion.path
              d={`M ${90} ${yy} l 8 8 l 16 -18`}
              stroke={C.green}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{pathLength: 0}}
              animate={{pathLength: 1}}
              transition={{duration: 0.3, delay: 0.15 + i * 0.07}}
            />
          )}
        </g>
      );
    })}
  </g>
);

/** small speech bubble (tail at the bottom centre), anchored at the tail tip */
export const Bubble: React.FC<{x: number; y: number; w: number; text: string; size?: number}> = ({x, y, w, text, size = 24}) => {
  const h = size * 1.9;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2 + 4} y={-h - 12 + 6} width={w} height={h} rx={h / 2.4} fill={C.ink} opacity={0.14} />
      <rect x={-w / 2} y={-h - 12} width={w} height={h} rx={h / 2.4} fill={C.white} />
      <path d="M -10 -13 L 0 0 L 10 -13 Z" fill={C.white} />
      <text x={0} y={-12 - h / 2 + size * 0.36} fontFamily={FONT} fontSize={size} fontWeight={800} textAnchor="middle" fill={C.ink}>{text}</text>
    </g>
  );
};
