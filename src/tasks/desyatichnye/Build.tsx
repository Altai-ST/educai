import React, {useEffect, useRef, useState} from 'react';
import {motion} from 'motion/react';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';
import {DecNum} from './art';

const TARGET = [4, 9, 5] as const;
const mod10 = (n: number) => ((n % 10) + 10) % 10;
const reel = {type: 'spring', stiffness: 380, damping: 26} as const;

/**
 * One scoreboard drum. Keeps an unbounded position so 9 → 0 keeps rolling the same way.
 * ▲ / drag up / wheel down / ↑ = +1.
 */
const Drum: React.FC<{value: number; onChange: (v: number) => void; locked: boolean; kind: 'w' | 't' | 'h'; name: string}> = ({value, onChange, locked, kind, name}) => {
  const [pos, setPos] = useState(value);
  const win = useRef<HTMLDivElement>(null);
  const posRef = useRef(pos);
  posRef.current = pos;
  const cb = useRef({onChange, locked});
  cb.current = {onChange, locked};

  // follow outside changes (the revealed answer) by the shortest way round
  useEffect(() => {
    const cur = mod10(posRef.current);
    if (cur === value) return;
    const d = mod10(value - cur);
    setPos(posRef.current + (d > 5 ? d - 10 : d));
  }, [value]);

  const goto = (p: number) => {
    if (cb.current.locked || p === posRef.current) return;
    posRef.current = p;
    setPos(p);
    cb.current.onChange(mod10(p));
    sfx('tick', {vol: 0.4, rate: 0.85 + mod10(p) * 0.04, throttle: 30});
  };
  const step = (d: number) => goto(posRef.current + d);

  // wheel: non-passive so the page does not scroll under the drum
  useEffect(() => {
    const el = win.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (cb.current.locked) return;
      e.preventDefault();
      // one notch = one digit; trackpads add up small deltas
      acc += e.deltaY;
      if (Math.abs(acc) >= 50) {
        goto(posRef.current + Math.sign(acc));
        acc = 0;
      }
    };
    el.addEventListener('wheel', onWheel, {passive: false});
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // vertical drag: one digit per ~half a window
  const drag = useRef<{y: number; p: number} | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (locked) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).focus({preventScroll: true});
    drag.current = {y: e.clientY, p: posRef.current};
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !win.current) return;
    const unit = win.current.clientHeight * 0.36;
    goto(drag.current.p + Math.round((drag.current.y - e.clientY) / unit));
  };
  const onPointerUp = () => (drag.current = null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      step(e.key === 'ArrowUp' ? 1 : -1);
    } else if (/^[0-9]$/.test(e.key)) {
      const d = mod10(Number(e.key) - mod10(posRef.current));
      step(d > 5 ? d - 10 : d);
    }
  };

  return (
    <div className={`des-drum is-${kind}`}>
      <button className="des-drum__b" onClick={() => step(1)} disabled={locked} aria-label={`${name}: больше`}>
        <Icon name="chev" size={22} stroke={3} className="des-rot-up" />
      </button>
      <div
        ref={win}
        className="des-drum__win"
        data-lenis-prevent
        tabIndex={locked ? -1 : 0}
        role="spinbutton"
        aria-label={name}
        aria-valuenow={mod10(pos)}
        aria-valuemin={0}
        aria-valuemax={9}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        style={{cursor: locked ? 'default' : undefined}}
      >
        <span className="des-drum__line" />
        {[-2, -1, 0, 1, 2].map((o) => {
          const k = pos + o;
          return (
            <motion.span
              key={k}
              className="des-drum__dig num"
              initial={{y: `${o * 0.92}em`, opacity: o === 0 ? 1 : 0.35}}
              animate={{y: `${o * 0.92}em`, opacity: o === 0 ? 1 : 0.35, scale: o === 0 ? 1 : 0.86}}
              transition={reel}
            >
              {mod10(k)}
            </motion.span>
          );
        })}
      </div>
      <button className="des-drum__b" onClick={() => step(-1)} disabled={locked} aria-label={`${name}: меньше`}>
        <Icon name="chev" size={22} stroke={3} className="des-rot-down" />
      </button>
    </div>
  );
};

const Stage: React.FC = () => {
  const api = useTask();
  const [d, setD] = useState<[number, number, number]>([0, 0, 0]);
  const [touched, setTouched] = useState(false);
  const revealed = api.status === 'revealed';
  const locked = api.status !== 'answering';
  const shown = revealed ? [...TARGET] : d;

  api.useCheck(touched, () => d.every((x, i) => x === TARGET[i]));

  const set = (i: number) => (v: number) => {
    setD((old) => {
      const next = [...old] as [number, number, number];
      next[i] = v;
      return next;
    });
    setTouched(true);
  };
  const tone = api.status === 'right' || revealed ? 'right' : api.status === 'wrong' ? 'wrong' : 'ink';

  return (
    <div className="des-build">
      <DecNum v={`${shown[0]},${shown[1]}${shown[2]}`} labels tone={tone} />
      <div className={`des-drums ${tone === 'ink' ? '' : 'is-' + tone}`}>
        <Drum value={shown[0]} onChange={set(0)} locked={locked} kind="w" name="Целые" />
        <span className="des-drums__comma" aria-hidden>,</span>
        <Drum value={shown[1]} onChange={set(1)} locked={locked} kind="t" name="Десятые" />
        <Drum value={shown[2]} onChange={set(2)} locked={locked} kind="h" name="Сотые" />
      </div>
      <p className="stage-note"><Icon name="bulb" size={16} /> Крути барабаны: стрелки, колесо мыши или тяни вверх-вниз</p>
    </div>
  );
};

export const build: TaskDef = {
  id: 'build',
  kind: 'Собери',
  title: 'Собери число: 4 целых, 9 десятых и 5 сотых',
  hint: 'Целые — до запятой. Сразу после запятой — десятые, следом — сотые.',
  explain: '4 целых, 9 десятых и 5 сотых записываются как 4,95: цифра 9 стоит первой после запятой, 5 — второй.',
  xp: 20,
  replay: 's04_places',
  Stage,
};
