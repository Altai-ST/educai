import React from 'react';
import {C, FONT, pol, sectorPath} from './kit';


/* ---------------- Pizza ---------------- */

// toppings in unit coords (pizza radius = 1)
const PEP: [number, number, number][] = [
  [0.0, -0.55, 0.15], [0.47, -0.3, 0.14], [0.52, 0.25, 0.15], [0.12, 0.6, 0.14], [-0.4, 0.45, 0.15],
  [-0.6, -0.05, 0.14], [-0.3, -0.45, 0.13], [0.15, -0.08, 0.14], [-0.15, 0.2, 0.12], [0.3, 0.05, 0.1],
  [0.25, 0.42, 0.09], [-0.22, -0.18, 0.09],
];
const BASIL: [number, number, number][] = [
  [0.32, -0.55, 30], [0.68, -0.02, 110], [-0.12, 0.42, 200], [-0.55, 0.22, 60], [-0.48, -0.42, 150], [0.05, 0.25, 80],
];

const PizzaBody: React.FC<{r: number}> = ({r}) => (
  <g>
    <circle r={r} fill="#C9823A" />
    <circle r={r * 0.97} fill="#E3A653" />
    <circle r={r * 0.86} fill="#D2442E" />
    <path
      d={Array.from({length: 24}, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const rr = r * (0.82 + (i % 2 ? 0.035 : -0.01));
        return `${i ? 'L' : 'M'} ${Math.sin(a) * rr} ${-Math.cos(a) * rr}`;
      }).join(' ') + ' Z'}
      fill="#F7C95A"
      strokeLinejoin="round"
      stroke="#F7C95A"
      strokeWidth={r * 0.04}
    />
    {[[-0.3, -0.25, 0.2], [0.35, 0.3, 0.18], [0.2, -0.45, 0.12], [-0.4, 0.3, 0.14]].map(([x, y, s], i) => (
      <circle key={i} cx={x * r} cy={y * r} r={s * r} fill="#FBDA7C" opacity={0.7} />
    ))}
    {PEP.map(([x, y, s], i) => (
      <g key={i}>
        <circle cx={x * r} cy={y * r + s * r * 0.12} r={s * r} fill="#8E2A22" />
        <circle cx={x * r} cy={y * r} r={s * r} fill="#B8352B" />
        <circle cx={x * r - s * r * 0.3} cy={y * r - s * r * 0.25} r={s * r * 0.22} fill="#D25B47" />
        <circle cx={x * r + s * r * 0.35} cy={y * r + s * r * 0.2} r={s * r * 0.12} fill="#8E2A22" />
      </g>
    ))}
    {BASIL.map(([x, y, rot], i) => (
      <g key={i} transform={`translate(${x * r} ${y * r}) rotate(${rot})`}>
        <ellipse rx={r * 0.075} ry={r * 0.035} fill="#3C8D4E" />
        <path d={`M ${-r * 0.06} 0 L ${r * 0.06} 0`} stroke="#2C6E3B" strokeWidth={r * 0.008} />
      </g>
    ))}
  </g>
);

export type PizzaProps = {
  id: string;
  x: number;
  y: number;
  r: number;
  /** slice boundaries in degrees (0 = up, clockwise). Empty → whole pizza */
  angles?: number[];
  explode?: number;
  /** extra outward offset per slice */
  lift?: number[];
  /** 0..1 fade per slice (1 = "not taken", ghosted) */
  dim?: number[];
  /** outline per slice (0..1) */
  ring?: number[];
  ringColor?: string;
  scale?: number;
  rotate?: number;
};

export const Pizza: React.FC<PizzaProps> = ({id, x, y, r, angles = [], explode = 0, lift = [], dim = [], ring = [], ringColor = C.ink, scale = 1, rotate = 0}) => {
  const sectors: {a0: number; a1: number; i: number}[] = [];
  if (angles.length >= 2) {
    angles.forEach((a0, i) => {
      const a1 = i + 1 < angles.length ? angles[i + 1] : angles[0] + 360;
      if (a1 - a0 > 0.2) sectors.push({a0, a1, i});
    });
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <ellipse cx={0} cy={r * 0.1} rx={r * 1.04} ry={r * 1.0} fill={C.ink} opacity={0.12} />
      {sectors.length === 0 ? (
        <PizzaBody r={r} />
      ) : (
        sectors.map(({a0, a1, i}) => {
          const mid = (a0 + a1) / 2;
          const off = explode + (lift[i] ?? 0);
          const [dx, dy] = pol(0, 0, off, mid);
          const cid = `${id}-s${i}`;
          const d = sectorPath(0, 0, r * 1.002, a0, a1);
          const dm = dim[i] ?? 0;
          return (
            <g key={i} transform={`translate(${dx} ${dy})`}>
              <clipPath id={cid}>
                <path d={d} />
              </clipPath>
              <g clipPath={`url(#${cid})`} opacity={1 - 0.72 * dm}>
                <PizzaBody r={r} />
              </g>
              {(ring[i] ?? 0) > 0 && (
                <path d={d} fill="none" stroke={ringColor} strokeWidth={8} strokeLinejoin="round" opacity={ring[i]} />
              )}
            </g>
          );
        })
      )}
    </g>
  );
};

/** A single slice of pizza, drawn with its tip at (x, y), opening upward-ish */
export const Slice: React.FC<{id: string; x: number; y: number; r: number; a0: number; a1: number; rotate?: number; opacity?: number; stroke?: string}> = ({id, x, y, r, a0, a1, rotate = 0, opacity = 1, stroke}) => {
  const d = sectorPath(0, 0, r, a0, a1);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} transform="translate(0 10)" fill={C.ink} opacity={0.12} />
      <g clipPath={`url(#${id})`}>
        <PizzaBody r={r} />
      </g>
      {stroke && <path d={d} fill="none" stroke={stroke} strokeWidth={7} strokeLinejoin="round" />}
    </g>
  );
};

/* ---------------- Burger ---------------- */

export const Burger: React.FC<{x: number; y: number; w?: number; patty?: number; scale?: number; rotate?: number}> = ({x, y, w = 360, patty = 44, scale = 1, rotate = 0}) => {
  const h = w / 2;
  const seeds = [[-0.5, -0.62], [-0.2, -0.8], [0.15, -0.75], [0.45, -0.6], [-0.05, -0.52], [0.28, -0.45], [-0.35, -0.42], [0.6, -0.38], [-0.62, -0.32]];
  // stack from the bottom up, y = 0 is the table
  const bunB = 54;
  const pattyY = -bunB - patty;
  const cheeseY = pattyY - 4;
  const lettuceY = cheeseY - 16;
  const topY = lettuceY - 6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <ellipse cx={0} cy={6} rx={h * 1.05} ry={16} fill={C.ink} opacity={0.14} />
      {/* bottom bun */}
      <path d={`M ${-h} ${-bunB} Q ${-h} 0 ${-h * 0.75} 0 L ${h * 0.75} 0 Q ${h} 0 ${h} ${-bunB} Z`} fill="#D98F3E" />
      <rect x={-h} y={-bunB - 6} width={w} height={14} rx={7} fill="#EDB868" />
      {/* patty */}
      <rect x={-h * 1.03} y={pattyY} width={w * 1.03} height={patty} rx={patty * 0.45} fill="#6B3A26" />
      <rect x={-h * 0.95} y={pattyY + patty * 0.18} width={w * 0.6} height={Math.max(4, patty * 0.14)} rx={4} fill="#86503A" />
      {/* cheese */}
      <path d={`M ${-h * 1.02} ${cheeseY} L ${h * 1.02} ${cheeseY} L ${h * 0.86} ${cheeseY + 34} L ${h * 0.62} ${cheeseY + 10} L ${h * 0.1} ${cheeseY + 40} L ${-h * 0.25} ${cheeseY + 8} L ${-h * 0.7} ${cheeseY + 30} L ${-h * 0.9} ${cheeseY + 8} Z`} fill="#F6BD3C" />
      {/* lettuce */}
      <path
        d={`M ${-h * 1.08} ${lettuceY + 10} ` + Array.from({length: 12}, (_, i) => {
          const xx = -h * 1.08 + ((i + 1) / 12) * w * 1.08;
          return `Q ${xx - (w * 1.08) / 24} ${lettuceY + (i % 2 ? 22 : -4)} ${xx} ${lettuceY + 10}`;
        }).join(' ') + ` L ${h * 1.0} ${lettuceY} L ${-h} ${lettuceY} Z`}
        fill="#6DBA4F"
      />
      {/* top bun */}
      <path d={`M ${-h * 1.02} ${topY} Q ${-h * 1.02} ${topY - h * 0.95} 0 ${topY - h * 0.95} Q ${h * 1.02} ${topY - h * 0.95} ${h * 1.02} ${topY} Z`} fill="#E09A46" />
      <path d={`M ${-h * 0.8} ${topY - h * 0.45} Q ${-h * 0.5} ${topY - h * 0.85} ${-h * 0.05} ${topY - h * 0.86}`} stroke="#F1BE74" strokeWidth={14} fill="none" strokeLinecap="round" />
      {seeds.map(([sx, sy], i) => (
        <ellipse key={i} cx={sx * h} cy={topY + sy * h * 1.0} rx={7} ry={3.6} fill="#FFF3D6" transform={`rotate(${(i * 37) % 60 - 30} ${sx * h} ${topY + sy * h})`} />
      ))}
    </g>
  );
};

/* ---------------- Person (faceless pictogram) ---------------- */

export const Person: React.FC<{x: number; y: number; color: string; s?: number; opacity?: number; rotate?: number}> = ({x, y, color, s = 1, opacity = 1, rotate = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`} opacity={opacity}>
    <ellipse cx={0} cy={58} rx={56} ry={10} fill={C.ink} opacity={0.12} />
    <path d="M -54 58 Q -54 -6 0 -6 Q 54 -6 54 58 Z" fill={color} />
    <circle cx={0} cy={-46} r={32} fill={color} />
    <circle cx={-10} cy={-56} r={9} fill="#fff" opacity={0.25} />
  </g>
);

/* ---------------- Chocolate bar ---------------- */

export const Chocolate: React.FC<{x: number; y: number; w: number; h: number; parts: number; cut: number; taken?: number; liftT?: number}> = ({x, y, w, h, parts, cut, taken = 0, liftT = 0}) => {
  const pw = w / parts;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={6} y={14} width={w} height={h} rx={18} fill={C.ink} opacity={0.15} />
      {Array.from({length: parts}, (_, i) => {
        const isTaken = i < taken;
        const ly = isTaken ? -70 * liftT : 0;
        const lx = isTaken ? -20 * liftT : 0;
        const gap = cut * 10;
        const px = i * pw + (i - (parts - 1) / 2) * gap;
        return (
          <g key={i} transform={`translate(${px + lx} ${ly}) rotate(${isTaken ? -6 * liftT : 0} ${pw / 2} ${h / 2})`}>
            <rect x={0} y={0} width={pw} height={h} rx={14} fill={isTaken && liftT > 0 ? '#7B4A2E' : '#6A3E26'} />
            <rect x={pw * 0.14} y={h * 0.12} width={pw * 0.72} height={h * 0.76} rx={10} fill="#83502F" />
            <rect x={pw * 0.2} y={h * 0.18} width={pw * 0.6} height={h * 0.12} rx={6} fill="#9C6640" opacity={0.8} />
            {isTaken && liftT > 0 && <rect x={0} y={0} width={pw} height={h} rx={14} fill="none" stroke={C.red} strokeWidth={8} opacity={liftT} />}
          </g>
        );
      })}
    </g>
  );
};

/* ---------------- tiny icons ---------------- */

export const Check: React.FC<{x: number; y: number; s?: number; color?: string; t?: number}> = ({x, y, s = 1, color = C.green, t = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={40} fill={color} />
    <path d="M -18 0 L -5 14 L 20 -14" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
  </g>
);

export const Cross: React.FC<{x: number; y: number; s?: number; color?: string; t?: number}> = ({x, y, s = 1, color = C.red, t = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -60 -60 L 60 60" stroke={color} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, t * 2)} />
    <path d="M 60 -60 L -60 60" stroke={color} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, t * 2 - 1)} />
  </g>
);

/** decimal number with coloured whole part, comma and fractional part; anchored at its centre */
export const Dec: React.FC<{
  x: number; y: number; whole: string; frac: string; size: number; wholeColor?: string; commaColor?: string;
  fracColor?: string; extra?: string; extraColor?: string; opacity?: number; weight?: number;
}> = ({x, y, whole, frac, size, wholeColor = C.ink, commaColor = C.red, fracColor = C.teal, extra, extraColor = C.mustard, opacity = 1, weight = 800}) => (
  <text x={x} y={y} fontFamily={FONT} fontSize={size} fontWeight={weight} textAnchor="middle" opacity={opacity}>
    <tspan fill={wholeColor}>{whole}</tspan>
    <tspan fill={commaColor}>,</tspan>
    <tspan fill={fracColor}>{frac}</tspan>
    {extra && <tspan fill={extraColor}>{extra}</tspan>}
  </text>
);

/**
 * 10×10 grid square. Columns = tenths, cells = hundredths.
 * fill: number of hundredths filled (column by column, top to bottom).
 * colCut: 0..1 visibility of column dividers; rowCut[i]: 0..1 visibility of cell dividers in column i.
 */
export const Grid: React.FC<{
  x: number; y: number; s: number; fill?: number; fillColor?: string; base?: string;
  colCut?: number; rowCut?: (i: number) => number; gap?: number; hiCol?: number; hiColT?: number;
  hiCell?: [number, number]; hiCellT?: number; hiColor?: string; line?: string; lift?: number;
}> = ({lift = 0, x, y, s, fill = 0, fillColor = C.teal, base = C.mustard, colCut = 0, rowCut = () => 0, gap = 0, hiCol = -1, hiColT = 0, hiCell, hiCellT = 0, hiColor = C.red, line = C.paper}) => {
  const cw = (s - gap * 9) / 10;
  const ch = s / 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={6} y={10} width={s} height={s} rx={14} fill={C.ink} opacity={0.12} />
      {Array.from({length: 10}, (_, i) => {
        const cx = i * (cw + gap);
        const filled = Math.max(0, Math.min(10, fill - i * 10));
        const hi = i === hiCol ? hiColT : 0;
        const rc = rowCut(i);
        return (
          <g key={i} transform={`translate(${cx} ${i === hiCol ? -lift : 0})`}>
            <rect x={0} y={0} width={cw} height={s} rx={gap > 0 ? 8 : 0} fill={base} />
            {filled > 0 && <rect x={0} y={0} width={cw} height={ch * filled} fill={fillColor} />}
            {hi > 0 && <rect x={0} y={0} width={cw} height={s} rx={gap > 0 ? 8 : 0} fill={hiColor} opacity={hi} />}
            {rc > 0 && Array.from({length: 9}, (_, k) => (
              <line key={k} x1={0} x2={cw} y1={ch * (k + 1)} y2={ch * (k + 1)} stroke={line} strokeWidth={3} opacity={rc} />
            ))}
            {hiCell && hiCell[0] === i && hiCellT > 0 && (
              <rect x={2} y={ch * hiCell[1] + 2} width={cw - 4} height={ch - 4} fill={hiColor} opacity={hiCellT} />
            )}
          </g>
        );
      })}
      {gap === 0 && colCut > 0 && Array.from({length: 9}, (_, k) => (
        <line key={k} x1={cw * (k + 1)} x2={cw * (k + 1)} y1={0} y2={s} stroke={line} strokeWidth={5} opacity={colCut} />
      ))}
      <rect x={0} y={0} width={s} height={s} rx={gap > 0 ? 0 : 6} fill="none" stroke={C.ink} strokeWidth={gap > 0 ? 0 : 6} />
    </g>
  );
};

/** top-down swimmer: cap + arms, moving to the right */
export const Swimmer: React.FC<{x: number; y: number; cap: string; f: number; speed?: number}> = ({x, y, cap, f, speed = 0.35}) => {
  const a = Math.sin(f * speed);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={-70} cy={0} rx={90} ry={22} fill="#fff" opacity={0.25} />
      <ellipse cx={-40} cy={0} rx={60} ry={26} fill="#E9B48A" />
      <path d={`M -10 -10 Q 25 ${-42 - 20 * a} ${52 + 14 * a} ${-30 - 14 * a}`} stroke="#E9B48A" strokeWidth={15} fill="none" strokeLinecap="round" />
      <path d={`M -10 10 Q 25 ${42 + 20 * a} ${52 + 14 * a} ${30 + 14 * a}`} stroke="#E9B48A" strokeWidth={15} fill="none" strokeLinecap="round" />
      <circle cx={30} cy={0} r={28} fill={cap} />
      <circle cx={22} cy={-9} r={7} fill="#fff" opacity={0.35} />
    </g>
  );
};

export const Medal: React.FC<{x: number; y: number; s?: number; rotate?: number; label?: string; shine?: number}> = ({x, y, s = 1, rotate = 0, label, shine = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    <path d="M -60 -260 L -20 -60 L 20 -60 L 60 -260 Z" fill={C.blue} />
    <path d="M -20 -260 L 0 -60 L 20 -260 Z" fill={C.red} />
    <circle r={150} fill="#C9922E" />
    <circle r={130} fill="#F2C14E" />
    <circle r={108} fill="none" stroke="#C9922E" strokeWidth={6} />
    {label && <text x={0} y={30} fontFamily={FONT} fontSize={86} fontWeight={900} fill="#8A5A12" textAnchor="middle">{label}</text>}
    <clipPath id="medal-clip"><circle r={130} /></clipPath>
    {shine > 0 && <path clipPath="url(#medal-clip)" d={`M ${-150 + 300 * shine} -150 L ${-100 + 300 * shine} -150 L ${-200 + 300 * shine} 150 L ${-250 + 300 * shine} 150 Z`} fill="#fff" opacity={0.45 * Math.sin(Math.PI * shine)} />}
  </g>
);

export const Star: React.FC<{x: number; y: number; r: number; fill: string}> = ({x, y, r, fill}) => (
  <path
    transform={`translate(${x} ${y})`}
    d={Array.from({length: 10}, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      const rr = i % 2 ? r * 0.45 : r;
      return `${i ? 'L' : 'M'} ${Math.sin(a) * rr} ${-Math.cos(a) * rr}`;
    }).join(' ') + ' Z'}
    fill={fill}
    strokeLinejoin="round"
  />
);

export const Jacket: React.FC<{x: number; y: number; s?: number; rotate?: number}> = ({x, y, s = 1, rotate = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    {/* hanger */}
    <path d="M 0 -250 q 0 -30 22 -30 q 22 0 22 22 q 0 18 -22 26 L 0 -250" stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M 0 -232 L -170 -170 L 170 -170 Z" fill="none" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    {/* sleeves */}
    <path d="M -150 -170 L -235 -20 L -215 170 L -150 170 L -140 -40 Z" fill="#23766D" />
    <path d="M 150 -170 L 235 -20 L 215 170 L 150 170 L 140 -40 Z" fill="#23766D" />
    {/* body */}
    <path d="M -150 -175 Q 0 -150 150 -175 L 160 200 Q 0 220 -160 200 Z" fill={C.teal} />
    {/* hood/collar */}
    <path d="M -80 -170 Q 0 -110 80 -170 Q 60 -210 0 -212 Q -60 -210 -80 -170 Z" fill="#1D5F58" />
    <line x1={0} y1={-140} x2={0} y2={210} stroke={C.mustard} strokeWidth={8} />
    {[-80, 0, 80].map((yy) => (
      <rect key={yy} x={-120} y={yy} width={70} height={10} rx={5} fill="#1D5F58" />
    ))}
    {[-80, 0, 80].map((yy) => (
      <rect key={yy} x={50} y={yy} width={70} height={10} rx={5} fill="#1D5F58" />
    ))}
  </g>
);

export const PriceTag: React.FC<{x: number; y: number; s?: number; text: string; strike?: number; rotate?: number}> = ({x, y, s = 1, text, strike = 0, rotate = 8}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    <path d="M -150 -60 L 110 -60 L 160 0 L 110 60 L -150 60 Q -170 60 -170 40 L -170 -40 Q -170 -60 -150 -60 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <circle cx={118} cy={0} r={12} fill={C.ink} />
    <text x={-20} y={24} fontFamily={FONT} fontSize={68} fontWeight={800} textAnchor="middle" fill={C.ink}>{text}</text>
    {strike > 0 && <line x1={-140} x2={-140 + 250 * strike} y1={0} y2={0} stroke={C.red} strokeWidth={10} strokeLinecap="round" />}
  </g>
);

export const Sticker: React.FC<{x: number; y: number; s?: number; text: string; color?: string; r?: number; rotate?: number}> = ({x, y, s = 1, text, color = C.red, r = 110, rotate = -14}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    <path
      d={Array.from({length: 32}, (_, i) => {
        const a = (i / 32) * Math.PI * 2;
        const rr = i % 2 ? r * 0.9 : r;
        return `${i ? 'L' : 'M'} ${Math.sin(a) * rr} ${-Math.cos(a) * rr}`;
      }).join(' ') + ' Z'}
      fill={color}
    />
    <text x={0} y={r * 0.26} fontFamily={FONT} fontSize={r * 0.72} fontWeight={900} textAnchor="middle" fill={C.white}>{text}</text>
  </g>
);

export const Terminal: React.FC<{x: number; y: number; s?: number; screen: string; flash?: number}> = ({x, y, s = 1, screen, flash = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-170} y={-240} width={340} height={480} rx={40} fill={C.ink2} />
    <rect x={-140} y={-210} width={280} height={170} rx={16} fill={flash > 0.5 ? '#3B5A2E' : '#1E3A2A'} />
    <text x={0} y={-100} fontFamily={FONT} fontSize={84} fontWeight={900} textAnchor="middle" fill="#7CF29A">{screen}</text>
    {Array.from({length: 9}, (_, i) => (
      <rect key={i} x={-120 + (i % 3) * 90} y={0 + Math.floor(i / 3) * 70} width={60} height={50} rx={10} fill="#4A4560" />
    ))}
  </g>
);

export const Brain: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -110 10 Q -130 -60 -70 -80 Q -50 -120 0 -105 Q 50 -125 80 -85 Q 135 -70 120 0 Q 135 60 80 75 Q 50 105 0 90 Q -50 110 -80 75 Q -135 65 -110 10 Z" fill="#F2A7B5" />
    <path d="M 0 -100 Q -15 -40 5 0 Q 20 40 0 88" stroke="#D97A8E" strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d="M -80 -40 q 30 10 40 -20 M -90 30 q 30 -15 50 10 M 40 -50 q 30 0 40 30 M 40 40 q 25 -20 55 0" stroke="#D97A8E" strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);

export const Cloud: React.FC<{x: number; y: number; s?: number; rain?: number; f?: number}> = ({x, y, s = 1, rain = 0, f = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {rain > 0 && Array.from({length: 9}, (_, i) => {
      const yy = ((f * 9 + i * 47) % 200) + 60;
      return <line key={i} x1={-110 + i * 28} x2={-122 + i * 28} y1={yy} y2={yy + 34} stroke="#7FB8E6" strokeWidth={8} strokeLinecap="round" opacity={rain} />;
    })}
    <circle cx={-70} cy={10} r={70} fill="#DDE6EE" />
    <circle cx={10} cy={-30} r={95} fill="#DDE6EE" />
    <circle cx={95} cy={15} r={65} fill="#DDE6EE" />
    <rect x={-140} y={10} width={300} height={70} rx={35} fill="#DDE6EE" />
  </g>
);

export const Umbrella: React.FC<{x: number; y: number; s?: number; open?: number}> = ({x, y, s = 1, open = 1}) => {
  const w = 40 + 180 * open;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M 0 -10 L 0 170 q 0 34 -34 34 q -26 0 -30 -26`} stroke={C.ink} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d={`M ${-w} 0 Q 0 ${-150 * (0.4 + 0.6 * open)} ${w} 0 Q ${w * 0.5} ${-20} 0 0 Q ${-w * 0.5} -20 ${-w} 0 Z`} fill={C.red} />
      <circle cx={0} cy={-150 * (0.4 + 0.6 * open) / 2 - 8} r={9} fill={C.ink} />
    </g>
  );
};
