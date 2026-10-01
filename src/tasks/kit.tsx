/**
 * Building blocks for task Stages. Everything here follows the video look:
 * paper frame, ink outlines, red/teal/mustard accents, Rubik heavy numbers.
 */
import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {motion, Reorder} from 'motion/react';
import {sfx} from '../lib/sound';
import {C} from '../art/kit';
import {Icon} from '../ui/Icon';
import type {TaskStatus} from './types';

export const ease = [0.22, 1, 0.36, 1] as const;
export const spring = {type: 'spring', stiffness: 380, damping: 24} as const;

/* ───────────────────────── SVG stage ───────────────────────── */

/** Standard drawing surface: viewBox w×h (default 1000×560), scales to the container width. */
export const StageSvg = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement> & {w?: number; h?: number}>(({w = 1000, h = 560, children, style, ...rest}, ref) => (
  <svg ref={ref} viewBox={`0 0 ${w} ${h}`} className="stage-svg" style={{touchAction: 'none', ...style}} {...rest}>
    {children}
  </svg>
));

/** client → viewBox coordinates */
export function svgPoint(svg: SVGSVGElement, e: {clientX: number; clientY: number}) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const m = svg.getScreenCTM();
  if (!m) return {x: 0, y: 0};
  const p = pt.matrixTransform(m.inverse());
  return {x: p.x, y: p.y};
}

/**
 * Pointer-drag in SVG coordinates. Spread the returned props on the element you grab.
 *   const drag = useSvgDrag(svgRef, (p) => setX(p.x));
 *   <circle {...drag} data-cursor="drag" />
 */
export function useSvgDrag(
  svgRef: React.RefObject<SVGSVGElement | null>,
  onMove: (p: {x: number; y: number}) => void,
  opts: {onStart?: (p: {x: number; y: number}) => void; onEnd?: () => void; disabled?: boolean} = {},
) {
  const active = useRef(false);
  const cb = useRef({onMove, ...opts});
  cb.current = {onMove, ...opts};
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (cb.current.disabled || !svgRef.current) return;
      e.preventDefault();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      active.current = true;
      const p = svgPoint(svgRef.current, e);
      cb.current.onStart?.(p);
      cb.current.onMove(p);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!active.current || !svgRef.current) return;
      cb.current.onMove(svgPoint(svgRef.current, e));
    },
    onPointerUp: () => {
      if (!active.current) return;
      active.current = false;
      cb.current.onEnd?.();
    },
    onPointerCancel: () => {
      active.current = false;
      cb.current.onEnd?.();
    },
    style: {cursor: opts.disabled ? 'default' : 'grab', touchAction: 'none'} as React.CSSProperties,
  };
}

/* ───────────────────────── Readout ───────────────────────── */

/** Big live value under/next to a picture, e.g. <Readout label="закрашено">0,37</Readout> */
export const Readout: React.FC<{label?: React.ReactNode; children: React.ReactNode; tone?: 'ink' | 'right' | 'wrong'; size?: number}> = ({label, children, tone = 'ink', size}) => (
  <div className={`readout tone-${tone}`}>
    <motion.div key={String(children)} className="readout__v num" initial={{y: 8, opacity: 0.4}} animate={{y: 0, opacity: 1}} transition={{duration: 0.25}} style={size ? {fontSize: size} : undefined}>
      {children}
    </motion.div>
    {label && <div className="readout__l">{label}</div>}
  </div>
);

/* ───────────────────────── Choice ───────────────────────── */

/**
 * Big answer tiles. After the check, pass `correct` and `status` to colour them.
 * Keys 1…9 select.
 */
export const Choice: React.FC<{
  options: React.ReactNode[];
  value: number | null;
  onChange: (i: number) => void;
  status: TaskStatus;
  correct?: number;
  columns?: number;
  size?: 'md' | 'lg';
}> = ({options, value, onChange, status, correct, columns, size = 'lg'}) => {
  const locked = status !== 'answering';
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) {
        onChange(n - 1);
        sfx('click', {vol: 0.45});
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [locked, options.length, onChange]);
  return (
    <div className={`choice choice--${size}`} style={{gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))`}}>
      {options.map((o, i) => {
        const st =
          locked && correct === i && (status === 'right' || status === 'revealed')
            ? 'right'
            : locked && value === i && status === 'wrong'
              ? 'wrong'
              : value === i
                ? 'selected'
                : '';
        return (
          <motion.button
            key={i}
            className={`choice__opt ${st}`}
            disabled={locked}
            whileHover={locked ? undefined : {y: -4}}
            whileTap={locked ? undefined : {scale: 0.96}}
            onClick={() => {
              onChange(i);
              sfx('click', {vol: 0.45});
            }}
          >
            <span className="choice__key num">{i + 1}</span>
            <span className="choice__body">{o}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

/* ───────────────────────── NumPad ───────────────────────── */

/**
 * Number entry with an on-screen pad + physical keyboard. Value is a string ("750", "0,25").
 */
export const NumPad: React.FC<{
  value: string;
  onChange: (v: string) => void;
  status: TaskStatus;
  comma?: boolean;
  maxLen?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  label?: React.ReactNode;
  compact?: boolean;
  /** only the active pad listens to the physical keyboard (when a stage has two) */
  active?: boolean;
}> = ({value, onChange, status, comma = false, maxLen = 7, prefix, suffix, label, compact, active = true}) => {
  const locked = status !== 'answering';
  const push = useCallback(
    (k: string) => {
      if (locked) return;
      if (k === '⌫') {
        onChange(value.slice(0, -1));
        sfx('tick', {vol: 0.4});
        return;
      }
      if (k === ',' && (!comma || value.includes(','))) return;
      if (value.replace(',', '').length >= maxLen) return;
      const next = k === ',' && value === '' ? '0,' : value === '0' && k !== ',' ? k : value + k;
      onChange(next);
      sfx('tick', {vol: 0.45, rate: 0.9 + Math.random() * 0.2});
    },
    [locked, comma, value, maxLen, onChange],
  );
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) push(e.key);
      else if (e.key === ',' || e.key === '.') push(',');
      else if (e.key === 'Backspace') push('⌫');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [push, active]);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', comma ? ',' : '', '0', '⌫'];
  const tone = status === 'right' || status === 'revealed' ? 'right' : status === 'wrong' ? 'wrong' : '';
  return (
    <div className={`numpad ${compact ? 'numpad--compact' : ''}`}>
      <div className={`numpad__screen ${tone}`}>
        {label && <span className="numpad__label">{label}</span>}
        <span className="numpad__value num">
          {prefix}
          {value ? (
            value.split('').map((ch, i) => (
              <motion.span key={i + ch} initial={{y: 14, opacity: 0}} animate={{y: 0, opacity: 1}} className={ch === ',' ? 'comma' : ''}>
                {ch}
              </motion.span>
            ))
          ) : (
            <span className="numpad__ph">?</span>
          )}
          {!locked && <span className="numpad__caret" />}
          {suffix && <span className="numpad__suffix">{suffix}</span>}
        </span>
      </div>
      <div className="numpad__keys">
        {keys.map((k, i) =>
          k ? (
            <motion.button key={i} className={`numpad__key ${k === '⌫' ? 'is-fn' : ''}`} whileTap={{scale: 0.9}} disabled={locked} onClick={() => push(k)} aria-label={k === '⌫' ? 'Стереть' : k}>
              {k === '⌫' ? <Icon name="backspace" size={22} /> : k}
            </motion.button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  );
};
/** "1 250,5" → 1250.5 */
export const parseNum = (v: string) => Number(v.replace(/\s/g, '').replace(',', '.'));
/** 4500 → "4 500" (no-break space: Rubik has no thin space), 0.25 → "0,25" */
export const fmtNum = (n: number, digits?: number) => {
  const s = digits === undefined ? String(n) : n.toFixed(digits);
  const [a, b] = s.split('.');
  const aa = a.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return b !== undefined ? `${aa},${b}` : aa;
};

/* ───────────────────────── 10×10 grid ───────────────────────── */

/**
 * 10×10 square of cells you paint by dragging (like the hundredths grid in the videos).
 * cells: 100 booleans, column-major (index = col * 10 + row) — column = one tenth.
 * Tapping the strip above a column fills/clears the whole column.
 */
export const GridPainter: React.FC<{
  cells: boolean[];
  onChange: (c: boolean[]) => void;
  status: TaskStatus;
  color?: string;
  base?: string;
  size?: number;
  x?: number;
  y?: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** cells shown as "already taken" in grey (e.g. the first discount) */
  ghost?: boolean[];
  columnStrips?: boolean;
}> = ({cells, onChange, status, color = C.teal, base = C.white, size = 420, x = 60, y = 90, svgRef, ghost, columnStrips = true}) => {
  const locked = status !== 'answering';
  const cs = size / 10;
  const mode = useRef<boolean>(true);
  const lastIdx = useRef(-1);
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const at = (p: {x: number; y: number}) => {
    const c = Math.floor((p.x - x) / cs);
    const r = Math.floor((p.y - y) / cs);
    if (c < 0 || c > 9 || r < 0 || r > 9) return -1;
    return c * 10 + r;
  };
  const paint = (i: number) => {
    if (i < 0 || i === lastIdx.current || ghost?.[i]) return;
    lastIdx.current = i;
    if (cellsRef.current[i] === mode.current) return;
    const next = cellsRef.current.slice();
    next[i] = mode.current;
    onChange(next);
    sfx('tick', {vol: 0.35, rate: mode.current ? 1.1 : 0.85, throttle: 25});
  };
  const drag = useSvgDrag(svgRef, (p) => paint(at(p)), {
    disabled: locked,
    onStart: (p) => {
      const i = at(p);
      lastIdx.current = -1;
      mode.current = i >= 0 ? !cellsRef.current[i] : true;
    },
  });
  const fillCol = (c: number) => {
    if (locked) return;
    const idx = Array.from({length: 10}, (_, r) => c * 10 + r).filter((i) => !ghost?.[i]);
    const full = idx.every((i) => cells[i]);
    const next = cells.slice();
    idx.forEach((i) => (next[i] = !full));
    onChange(next);
    sfx('snap', {vol: 0.4});
  };
  return (
    <g>
      {columnStrips &&
        Array.from({length: 10}, (_, c) => (
          <g key={c} onClick={() => fillCol(c)} style={{cursor: locked ? 'default' : 'pointer'}} data-cursor={locked ? undefined : 'none'}>
            <rect x={x + c * cs + 3} y={y - 34} width={cs - 6} height={22} rx={8} fill={C.ink} opacity={0.08} />
            <path d={`M ${x + c * cs + cs / 2 - 6} ${y - 26} l 6 6 l 6 -6`} stroke={C.ink} strokeWidth={3} fill="none" opacity={0.35} strokeLinecap="round" />
          </g>
        ))}
      <rect x={x + 6} y={y + 10} width={size} height={size} rx={10} fill={C.ink} opacity={0.12} />
      <g {...drag} data-cursor={locked ? undefined : 'none'}>
        <rect x={x} y={y} width={size} height={size} fill={base} />
        {cells.map((on, i) => {
          const c = Math.floor(i / 10);
          const r = i % 10;
          const g = ghost?.[i];
          return (
            <rect
              key={i}
              x={x + c * cs}
              y={y + r * cs}
              width={cs}
              height={cs}
              fill={g ? '#BDB4A3' : on ? color : 'transparent'}
              style={{transition: 'fill .12s'}}
            />
          );
        })}
        {Array.from({length: 9}, (_, k) => (
          <React.Fragment key={k}>
            <line x1={x + cs * (k + 1)} x2={x + cs * (k + 1)} y1={y} y2={y + size} stroke={C.paper} strokeWidth={4} />
            <line x1={x} x2={x + size} y1={y + cs * (k + 1)} y2={y + cs * (k + 1)} stroke={C.paper} strokeWidth={2.5} />
          </React.Fragment>
        ))}
        <rect x={x} y={y} width={size} height={size} rx={4} fill="none" stroke={C.ink} strokeWidth={6} />
      </g>
    </g>
  );
};
export const emptyCells = () => Array.from({length: 100}, () => false);
export const countCells = (c: boolean[]) => c.filter(Boolean).length;

/* ───────────────────────── Sortable row ───────────────────────── */

/** Drag chips to reorder. items: ids in current order. */
export function SortRow<T extends string>({
  items, onChange, render, status, axis = 'x', correctOrder,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  render: (id: T, i: number) => React.ReactNode;
  status: TaskStatus;
  axis?: 'x' | 'y';
  correctOrder?: T[];
}) {
  const locked = status !== 'answering';
  return (
    <Reorder.Group axis={axis} values={items} onReorder={(v) => { onChange(v as T[]); sfx('tick', {vol: 0.35}); }} className={`sortrow sortrow--${axis}`} as="div">
      {items.map((id, i) => {
        const tone = locked && correctOrder ? (correctOrder[i] === id ? 'right' : status === 'wrong' ? 'wrong' : '') : '';
        return (
          <Reorder.Item
            key={id}
            value={id}
            as="div"
            className={`sortrow__item ${tone}`}
            dragListener={!locked}
            whileDrag={{scale: 1.06, boxShadow: '0 30px 50px -20px rgba(29,26,43,.45)', zIndex: 5}}
            onDragStart={() => sfx('pop', {vol: 0.4})}
            onDragEnd={() => sfx('snap', {vol: 0.45})}
            data-cursor="drag"
          >
            <span className="sortrow__grip" aria-hidden>⋮⋮</span>
            {render(id, i)}
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
}

/* ───────────────────────── Matcher ───────────────────────── */

const PAIR_COLORS = [C.red, C.teal, C.blue, C.mustard, C.plum, C.green];

/**
 * Two columns; tap a left item, then a right one, to connect them with a line.
 * pairs: leftId → rightId.
 */
export const Matcher: React.FC<{
  left: {id: string; node: React.ReactNode}[];
  right: {id: string; node: React.ReactNode}[];
  pairs: Record<string, string>;
  onChange: (p: Record<string, string>) => void;
  status: TaskStatus;
  answer?: Record<string, string>;
}> = ({left, right, pairs, onChange, status, answer}) => {
  const locked = status !== 'answering';
  const box = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [lines, setLines] = useState<{id: string; x1: number; y1: number; x2: number; y2: number; c: string; ok?: boolean}[]>([]);
  const shown = status === 'revealed' && answer ? answer : pairs;

  const measure = useCallback(() => {
    const b = box.current?.getBoundingClientRect();
    if (!b) return;
    setLines(
      Object.entries(shown).flatMap(([l, r]) => {
        const a = refs.current['L' + l]?.getBoundingClientRect();
        const z = refs.current['R' + r]?.getBoundingClientRect();
        if (!a || !z) return [];
        const li = left.findIndex((x) => x.id === l);
        return [{id: l, x1: a.right - b.left, y1: a.top + a.height / 2 - b.top, x2: z.left - b.left, y2: z.top + z.height / 2 - b.top, c: PAIR_COLORS[li % PAIR_COLORS.length], ok: answer ? answer[l] === r : undefined}];
      }),
    );
  }, [shown, left, answer]);
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [measure]);

  const tapLeft = (id: string) => {
    if (locked) return;
    setSel(id);
    sfx('click', {vol: 0.4});
  };
  const tapRight = (id: string) => {
    if (locked) return;
    if (!sel) {
      // tapping a right item that is already linked unlinks it
      const l = Object.keys(pairs).find((k) => pairs[k] === id);
      if (l) {
        const next = {...pairs};
        delete next[l];
        onChange(next);
        sfx('tick', {vol: 0.4});
      }
      return;
    }
    const next = Object.fromEntries(Object.entries(pairs).filter(([k, v]) => k !== sel && v !== id));
    next[sel] = id;
    onChange(next);
    setSel(null);
    sfx('snap', {vol: 0.5});
  };
  const colorOfLeft = (id: string) => (id in shown ? PAIR_COLORS[left.findIndex((x) => x.id === id) % PAIR_COLORS.length] : undefined);
  const colorOfRight = (id: string) => {
    const l = Object.keys(shown).find((k) => shown[k] === id);
    return l ? colorOfLeft(l) : undefined;
  };
  return (
    <div className="matcher" ref={box}>
      <svg className="matcher__lines" aria-hidden>
        {lines.map((l) => {
          const d = `M ${l.x1} ${l.y1} C ${(l.x1 + l.x2) / 2} ${l.y1}, ${(l.x1 + l.x2) / 2} ${l.y2}, ${l.x2} ${l.y2}`;
          // pathLength drives stroke-dasharray, so a dashed (wrong) link is drawn as a plain path
          return locked && status === 'wrong' && l.ok === false ? (
            <path key={l.id + 'x'} d={d} stroke={C.red} strokeDasharray="10 12" strokeWidth={6} strokeLinecap="round" fill="none" />
          ) : (
            <motion.path key={l.id + l.x2 + l.y2} d={d} stroke={l.c} strokeWidth={6} strokeLinecap="round" fill="none" initial={{pathLength: 0}} animate={{pathLength: 1}} transition={{duration: 0.45, ease}} />
          );
        })}
      </svg>
      <div className="matcher__col">
        {left.map((it) => (
          <button
            key={it.id}
            ref={(el) => void (refs.current['L' + it.id] = el)}
            className={`matcher__item ${sel === it.id ? 'is-sel' : ''}`}
            style={{['--pc' as string]: colorOfLeft(it.id)}}
            data-linked={it.id in shown || undefined}
            onClick={() => tapLeft(it.id)}
            disabled={locked}
          >
            {it.node}
          </button>
        ))}
      </div>
      <div className="matcher__col">
        {right.map((it) => (
          <button
            key={it.id}
            ref={(el) => void (refs.current['R' + it.id] = el)}
            className="matcher__item"
            style={{['--pc' as string]: colorOfRight(it.id)}}
            data-linked={colorOfRight(it.id) ? true : undefined}
            onClick={() => tapRight(it.id)}
            disabled={locked}
          >
            {it.node}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ───────────────────────── quick rounds ───────────────────────── */

/**
 * For selfCheck stages made of several quick questions.
 *   const r = useRounds(3, api.finish, 2) // need ≥2 right
 *   r.answer(isRight) → shows per-round feedback, then advances; r.index, r.results
 */
export function useRounds(n: number, finish: (ok: boolean) => void, need = n) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>(() => Array(n).fill(null));
  const [flash, setFlash] = useState<boolean | null>(null);
  const answer = (ok: boolean) => {
    if (flash !== null) return;
    setFlash(ok);
    sfx(ok ? 'pop' : 'buzz', {vol: ok ? 0.55 : 0.4});
    const next = results.slice();
    next[index] = ok;
    setResults(next);
    setTimeout(() => {
      setFlash(null);
      if (index + 1 < n) setIndex(index + 1);
      else finish(next.filter(Boolean).length >= need);
    }, ok ? 900 : 1700);
  };
  const reset = () => {
    setIndex(0);
    setResults(Array(n).fill(null));
    setFlash(null);
  };
  return {index, results, flash, answer, reset};
}

export const RoundDots: React.FC<{results: (boolean | null)[]; index: number}> = ({results, index}) => (
  <div className="rounddots">
    {results.map((r, i) => (
      <span key={i} className={`rounddots__d ${r === true ? 'right' : r === false ? 'wrong' : i === index ? 'cur' : ''}`}>
        {r === true ? <Icon name="check" size={14} stroke={3} /> : r === false ? <Icon name="x" size={14} stroke={3} /> : i + 1}
      </span>
    ))}
  </div>
);

/** Layout helper: picture on the left, controls on the right (stacks on mobile). */
export const Split: React.FC<{children: React.ReactNode; ratio?: string; className?: string}> = ({children, ratio = '1.25fr 1fr', className}) => (
  <div className={`stage-split ${className ?? ''}`} style={{['--ratio' as string]: ratio}}>
    {children}
  </div>
);
