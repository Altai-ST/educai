import React, {useRef, useState} from 'react';
import {motion} from 'motion/react';
import {C, FONT} from '../../art/kit';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {StageSvg, useSvgDrag} from '../kit';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';
import {fromHundredths, useNarrow} from './art';

type PinDef = {id: string; target: number; color: string};
const PINS: PinDef[] = [
  {id: '0,7', target: 70, color: C.teal},
  {id: '0,25', target: 25, color: C.blue},
  {id: '0,05', target: 5, color: C.plum},
];
const TOL = 2;

/** phones get a narrower viewBox, bigger labels and bigger pins */
const geo = (narrow: boolean) =>
  narrow
    ? {W: 600, H: 510, x0: 44, x1: 556, LY: 200, park: [150, 300, 450], parkY: 470, font: 30, pin: 1.25, stagger: true}
    : {W: 1000, H: 420, x0: 80, x1: 920, LY: 180, park: [350, 500, 650], parkY: 385, font: 24, pin: 1, stagger: false};
type Geo = ReturnType<typeof geo>;

const HEAD = 66; // tip → head centre
const R = 36;
const PIN_PATH = `M 0 0 C -8 -16 ${-R} -38 ${-R} ${-HEAD} A ${R} ${R} 0 1 1 ${R} ${-HEAD} C ${R} -38 8 -16 0 0 Z`;

const Pin: React.FC<{
  def: PinDef; g: Geo; svg: React.RefObject<SVGSVGElement | null>; index: number;
  pos: number | null; locked: boolean; tone: 'ink' | 'right' | 'bad';
  onPlace: (v: number | null) => void; onLift: () => void;
}> = ({def, g, svg, index, pos, locked, tone, onPlace, onLift}) => {
  const [drag, setDragState] = useState<{x: number; y: number; v: number | null} | null>(null);
  const dragRef = useRef(drag);
  const setDrag = (d: typeof drag) => {
    dragRef.current = d;
    setDragState(d);
  };
  const span = g.x1 - g.x0;
  const toV = (x: number) => Math.max(0, Math.min(100, Math.round(((x - g.x0) / span) * 100)));
  const xOf = (v: number) => g.x0 + (v / 100) * span;

  const handlers = useSvgDrag(
    svg,
    (p) => {
      const tipY = p.y + HEAD * g.pin;
      const near = tipY < g.LY + 80 && tipY > g.LY - 140;
      const v = near ? toV(p.x) : null;
      if (v !== null && dragRef.current?.v !== v) sfx('tick', {vol: 0.3, rate: 0.8 + v / 200, throttle: 25});
      setDrag({x: p.x, y: tipY, v});
    },
    {
      disabled: locked,
      onStart: () => sfx('pop', {vol: 0.4}),
      onEnd: () => {
        const d = dragRef.current;
        if (!d) return;
        onPlace(d.v);
        onLift(); // bring to front only after the drag: moving the node mid-drag drops pointer capture
        sfx(d.v === null ? 'whoosh' : 'snap', {vol: 0.45});
        setDrag(null);
      },
    },
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (locked || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const step = (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 10 : 1);
    onPlace(Math.max(0, Math.min(100, (pos ?? 50) + step)));
    sfx('tick', {vol: 0.35});
  };

  // where the tip is: on the line (snapped), free under the finger, or parked in the tray
  const v = drag ? drag.v : pos;
  const free = drag && drag.v === null;
  const x = free ? drag.x : v !== null ? xOf(v) : g.park[index];
  const y = free ? drag.y : v !== null ? g.LY : g.parkY;
  const fill = tone === 'bad' ? C.red : def.color;
  const chip = tone === 'right' ? C.green : tone === 'bad' ? C.red : C.ink;
  const [vw, vf] = v !== null ? fromHundredths(v).split(',') : ['', ''];

  return (
    <motion.g
      initial={false}
      animate={{x, y, scale: drag ? 1.08 : 1}}
      transition={drag ? {duration: 0} : {type: 'spring', stiffness: 360, damping: 24}}
      {...handlers}
      tabIndex={locked ? -1 : 0}
      onKeyDown={onKey}
      role="slider"
      aria-label={`Флажок ${def.id}`}
      aria-valuenow={v ?? undefined}
    >
      <g transform={`scale(${g.pin})`}>
        <circle cx={0} cy={-HEAD} r={R + 16} fill="transparent" />
        <ellipse cx={4} cy={4} rx={14} ry={5} fill={C.ink} opacity={v !== null ? 0 : 0.15} />
        <path d={PIN_PATH} transform="translate(5 6)" fill={C.ink} opacity={0.14} />
        <path d={PIN_PATH} fill={fill} style={{transition: 'fill .3s'}} />
        <text x={0} y={-HEAD + 9} fontFamily={FONT} fontSize={def.id.length > 3 ? 23 : 27} fontWeight={900} fill={C.white} textAnchor="middle">
          {def.id}
        </text>
        {v !== null && (
          <g transform={`translate(0 ${-HEAD - R - 30})`}>
            <rect x={-42} y={-19} width={84} height={36} rx={18} fill={chip} style={{transition: 'fill .3s'}} />
            <path d="M -7 16 L 0 24 L 7 16 Z" fill={chip} />
            <text x={0} y={8} fontFamily={FONT} fontSize={22} fontWeight={800} fill={C.paper} textAnchor="middle">
              {vw}
              <tspan fill={tone === 'ink' ? '#FF7A63' : C.paper}>,</tspan>
              {vf}
            </text>
          </g>
        )}
      </g>
    </motion.g>
  );
};

const Stage: React.FC = () => {
  const api = useTask();
  const svg = useRef<SVGSVGElement>(null);
  const g = geo(useNarrow());
  const [pos, setPos] = useState<(number | null)[]>(() => PINS.map(() => null));
  const [top, setTop] = useState(0);
  const revealed = api.status === 'revealed';
  const locked = api.status !== 'answering';
  const shown = revealed ? PINS.map((p) => p.target) : pos;
  const off = (i: number) => shown[i] === null || Math.abs((shown[i] as number) - PINS[i].target) > TOL;

  api.useCheck(pos.every((p) => p !== null), () => PINS.every((_, i) => !off(i)));

  const span = g.x1 - g.x0;
  // the last moved pin is drawn on top
  const order = [...PINS.keys()].filter((i) => i !== top).concat(top);

  return (
    <div className="stage-center">
      <StageSvg ref={svg} w={g.W} h={g.H}>
        {/* parking tray */}
        <rect x={g.park[0] - 90} y={g.parkY - (HEAD + R + 24) * g.pin} width={g.park[2] - g.park[0] + 180} height={(HEAD + R + 44) * g.pin} rx={28} fill={C.ink} opacity={0.05} />
        {/* the line */}
        <line x1={g.x0 - 24} x2={g.x1 + 24} y1={g.LY} y2={g.LY} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        {Array.from({length: 21}, (_, k) => {
          const x = g.x0 + (k / 20) * span;
          const major = k % 2 === 0;
          const end = k === 0 || k === 20;
          // on phones every other label drops to a second row so they don't collide
          const low = g.stagger && k % 4 === 2;
          return (
            <g key={k}>
              <line x1={x} x2={x} y1={g.LY - (major ? 18 : 10)} y2={g.LY + (major ? 18 : 10)} stroke={C.ink} strokeWidth={major ? 5 : 3} strokeLinecap="round" />
              {low && <line x1={x} x2={x} y1={g.LY + 22} y2={g.LY + 30 + g.font} stroke={C.ink} strokeWidth={2} opacity={0.25} />}
              {major && (
                <text x={x} y={g.LY + 26 + g.font + (low ? g.font + 12 : 0)} fontFamily={FONT} fontSize={end ? g.font + 6 : g.font} fontWeight={end ? 900 : 700} fill={C.ink} textAnchor="middle" opacity={end ? 1 : 0.75}>
                  {end ? k / 20 : <>0<tspan fill={C.red}>,</tspan>{k / 2}</>}
                </text>
              )}
            </g>
          );
        })}
        {order.map((i) => (
          <Pin
            key={PINS[i].id}
            def={PINS[i]}
            g={g}
            svg={svg}
            index={i}
            pos={shown[i]}
            locked={locked}
            tone={revealed || api.status === 'right' ? 'right' : api.status === 'wrong' && off(i) ? 'bad' : 'ink'}
            onLift={() => setTop(i)}
            onPlace={(v) => setPos((old) => old.map((x, k) => (k === i ? v : x)))}
          />
        ))}
      </StageSvg>
      <p className="stage-note"><Icon name="bulb" size={16} /> Тяни флажки на прямую. Над флажком — число, куда он указывает</p>
    </div>
  );
};

export const numberLine: TaskDef = {
  id: 'line',
  kind: 'Отметь',
  title: 'Поставь флажки на свои места на прямой',
  hint: 'Большие деления — десятые: 0,1, 0,2 … Мелкое деление посередине — ещё 0,05.',
  explain: '0,7 — седьмое большое деление. 0,25 = 0,2 + 0,05 — между 0,2 и 0,3. 0,05 — половина первой десятой.',
  xp: 30,
  replay: 's05_trap',
  Stage,
};
