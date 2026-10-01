import React, {useEffect, useRef, useState} from 'react';
import {motion, useSpring, useTransform} from 'motion/react';
import {C, sectorPath} from '../../art/kit';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {Readout, Split, StageSvg, useSvgDrag} from '../kit';
import {Frac} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import {ClockFace} from './art';
import type {TaskDef} from '../types';
import './drobi.css';

const GOAL = 45;
const NICE: Record<number, [number, number]> = {15: [1, 4], 20: [1, 3], 30: [1, 2], 40: [2, 3], 45: [3, 4], 60: [1, 1]};
const cx = 300, cy = 280, r = 228;

const Stage: React.FC = () => {
  const api = useTask();
  const svg = useRef<SVGSVGElement>(null);
  const [m, setM] = useState(0);
  const [touched, setTouched] = useState(false);
  const dragging = useRef(false);
  const revealed = api.status === 'revealed';
  const locked = api.status !== 'answering';
  const mm = revealed ? GOAL : m;

  api.useCheck(m > 0, () => m === GOAL);

  const mRef = useRef(m);
  mRef.current = m;
  const set = (v: number) => {
    const next = Math.max(0, Math.min(60, v));
    if (next === mRef.current) return;
    mRef.current = next;
    setM(next);
    setTouched(true);
    sfx('tick', {vol: 0.45, rate: 0.85 + next / 150});
  };
  const fromPoint = (p: {x: number; y: number}) => {
    const cur = mRef.current;
    const a = ((Math.atan2(p.x - cx, cy - p.y) * 180) / Math.PI + 360) % 360;
    let v = Math.round(a / 30) * 5; // 0…60, snapped to 5 minutes
    if (v === 0 || v === 60) v = cur >= 30 ? 60 : 0;
    // the first point of a press may jump anywhere; while dragging, stop at 12 instead of wrapping
    if (dragging.current && Math.abs(v - cur) > 30) v = cur > 30 ? 60 : 0;
    dragging.current = true;
    set(v);
  };
  const drag = useSvgDrag(svg, fromPoint, {disabled: locked, onStart: () => (dragging.current = false)});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(m + 5);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(m - 5);
      else return;
      e.preventDefault();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const ang = useSpring(mm * 6, {stiffness: 300, damping: 26});
  useEffect(() => ang.set(mm * 6), [ang, mm]);
  const sector = useTransform(ang, (a) => (a < 0.5 ? 'M 0 0' : sectorPath(cx, cy, r - 6, 0, Math.min(a, 360))));
  const hourRot = useTransform(ang, (a) => a / 12);

  const nice = NICE[mm];
  const tone = api.status === 'right' || revealed ? 'right' : api.status === 'wrong' ? 'wrong' : 'ink';
  const origin = {transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box'} as const;

  return (
    <Split ratio="1.1fr 1fr">
      <StageSvg ref={svg} w={600} h={560}>
        <g {...drag} data-cursor={locked ? undefined : 'drag'}>
          <ClockFace cx={cx} cy={cy} r={r}>
            <motion.path d={sector} fill={C.red} opacity={0.22} />
          </ClockFace>
          {/* hour hand */}
          <motion.g style={{...origin, rotate: hourRot}}>
            <line x1={cx} y1={cy + 18} x2={cx} y2={cy - r * 0.48} stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
          </motion.g>
          {/* minute hand */}
          <motion.g style={{...origin, rotate: ang}}>
            <path d={`M ${cx - 9} ${cy + 34} L ${cx - 4} ${cy - r + 46} Q ${cx} ${cy - r + 36} ${cx + 4} ${cy - r + 46} L ${cx + 9} ${cy + 34} Z`} fill={C.red} />
            {!touched && !locked && (
              <motion.circle cx={cx} cy={cy - r + 58} r={22} fill="none" stroke={C.red} strokeWidth={4}
                animate={{r: [18, 34], opacity: [0.8, 0]}} transition={{duration: 1.3, repeat: Infinity, ease: 'easeOut'}} />
            )}
            <circle cx={cx} cy={cy - r + 58} r={15} fill={C.red} stroke={C.white} strokeWidth={5} />
          </motion.g>
          <circle cx={cx} cy={cy} r={18} fill={C.ink} />
          <circle cx={cx} cy={cy} r={7} fill={C.red} />
          <circle cx={cx} cy={cy} r={r + 22} fill="transparent" />
        </g>
      </StageSvg>

      <div className="stage-panel">
        <div className="target-chip">
          цель <Frac n={3} d={4} /> часа
        </div>
        <Readout tone={tone} label="из 60 минут в часе">
          <span className="drobi-clock-v">
            {mm}
            <small>мин</small>
          </span>
        </Readout>
        <div className="drobi-eqline" style={{minHeight: '2.4em'}}>
          {nice && (
            <motion.span key={mm} className="drobi-eqline" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
              = {nice[1] === 1 ? <span className="num">1</span> : <Frac n={nice[0]} d={nice[1]} />} <small>часа</small>
            </motion.span>
          )}
        </div>
        <p className="stage-note">
          <Icon name="bulb" size={16} /> Тяни красную стрелку
        </p>
      </div>
    </Split>
  );
};

export const clock: TaskDef = {
  id: 'clock',
  kind: 'Покажи',
  title: 'Поставь стрелку на ¾ часа',
  hint: 'В часе 60 минут. Четверть часа — 15 минут. А сколько будет три четверти?',
  explain: '¼ часа = 60 : 4 = 15 минут, значит ¾ часа = 3 · 15 = 45 минут.',
  xp: 25,
  replay: 's05_life',
  Stage,
};
