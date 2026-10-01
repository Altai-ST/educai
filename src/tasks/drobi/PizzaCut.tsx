import React, {useRef, useState} from 'react';
import {motion} from 'motion/react';
import {Pizza} from '../../art/art';
import {C, pol, sectorPath} from '../../art/kit';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {Readout, Split, StageSvg} from '../kit';
import {Frac} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';

const N = 8;
const K = 3;

const Stage: React.FC = () => {
  const api = useTask();
  const svg = useRef<SVGSVGElement>(null);
  const [n, setN] = useState(4);
  const [taken, setTaken] = useState<number[]>([]);
  const revealed = api.status === 'revealed';
  const nn = revealed ? N : n;
  const tk = revealed ? [0, 1, 2] : taken;
  const locked = api.status !== 'answering';

  api.useCheck(taken.length > 0, () => n === N && taken.length === K);

  const cut = (d: number) => {
    const next = Math.max(2, Math.min(12, n + d));
    if (next === n || locked) return;
    setN(next);
    setTaken([]);
    sfx('chop', {vol: 0.5, rate: 0.9 + next * 0.02});
  };
  const toggle = (i: number) => {
    if (locked) return;
    setTaken((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));
    sfx(taken.includes(i) ? 'tick' : 'pop', {vol: 0.5});
  };
  const angles = Array.from({length: nn}, (_, i) => (i * 360) / nn);
  const cx = 300, cy = 280, r = 220;

  return (
    <Split ratio="1.1fr 1fr">
      <StageSvg ref={svg} w={600} h={560}>
        <motion.g key={nn} initial={{rotate: -8, scale: 0.96}} animate={{rotate: 0, scale: 1}} transition={{type: 'spring', stiffness: 200, damping: 14}} style={{transformOrigin: `${cx}px ${cy}px`}}>
          <Pizza
            id="cut"
            x={cx}
            y={cy}
            r={r}
            angles={angles}
            explode={6}
            lift={angles.map((_, i) => (tk.includes(i) ? 26 : 0))}
            ring={angles.map((_, i) => (tk.includes(i) ? 1 : 0))}
            ringColor={C.red}
          />
        </motion.g>
        {/* hit areas */}
        {angles.map((a0, i) => {
          const a1 = a0 + 360 / nn;
          const [lx, ly] = pol(cx, cy, r * 0.62, (a0 + a1) / 2);
          return (
            <g key={i} onClick={() => toggle(i)} style={{cursor: locked ? 'default' : 'pointer'}}>
              <path d={sectorPath(cx, cy, r + 20, a0, a1)} fill="transparent" />
              {tk.includes(i) && (
                <motion.g initial={{scale: 0}} animate={{scale: 1}} style={{transformOrigin: `${lx}px ${ly}px`}}>
                  <circle cx={lx} cy={ly} r={22} fill={C.red} />
                  <path d={`M ${lx - 9} ${ly} l 6 7 l 12 -13`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </motion.g>
              )}
            </g>
          );
        })}
      </StageSvg>

      <div className="stage-panel">
        <div className="target-chip">
          цель <Frac n={K} d={N} />
        </div>
        <Readout label={<>взял <b>{tk.length}</b> из <b>{nn}</b></>} tone={api.status === 'right' || revealed ? 'right' : api.status === 'wrong' ? 'wrong' : 'ink'}>
          <Frac n={tk.length} d={nn} style={{fontSize: 'clamp(64px, 8vw, 120px)'}} />
        </Readout>
        <div className="stepper" aria-label="Количество кусков">
          <button className="stepper__b" onClick={() => cut(-1)} disabled={locked || n <= 2} aria-label="Меньше кусков">−</button>
          <div className="stepper__v">
            <b className="num">{nn}</b>
            <span>кусков</span>
          </div>
          <button className="stepper__b" onClick={() => cut(1)} disabled={locked || n >= 12} aria-label="Больше кусков">+</button>
        </div>
        <p className="stage-note"><Icon name="bulb" size={16} /> Сначала разрежь, потом нажимай на куски</p>
      </div>
    </Split>
  );
};

export const pizzaCut: TaskDef = {
  id: 'pizza-cut',
  kind: 'Разрежь',
  title: 'Разрежь пиццу и возьми ровно 3⁄8',
  hint: 'Знаменатель — на сколько частей режем. Числитель — сколько кусков берём.',
  explain: '3⁄8 — пиццу режут на 8 равных кусков и берут 3 из них.',
  xp: 20,
  replay: 's03_two',
  Stage,
};
