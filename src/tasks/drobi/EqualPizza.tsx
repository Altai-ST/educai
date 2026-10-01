import React, {useState} from 'react';
import {motion} from 'motion/react';
import {Pizza} from '../../art/art';
import {C, pol, sectorPath} from '../../art/kit';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {Frac} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';
import './drobi.css';

const N = 12;
const K = 9;
const LEFT = [0, 90, 180, 270];
const RIGHT = Array.from({length: N}, (_, i) => (i * 360) / N);
const ANSWER = Array.from({length: K}, (_, i) => i);
const S = 520, c = S / 2, R = 210;

const Stage: React.FC = () => {
  const api = useTask();
  const [taken, setTaken] = useState<number[]>([]);
  const revealed = api.status === 'revealed';
  const done = api.status === 'right' || revealed;
  const tk = revealed ? ANSWER : taken;
  const locked = api.status !== 'answering';

  api.useCheck(taken.length > 0, () => taken.length === K);

  const toggle = (i: number) => {
    if (locked) return;
    const had = taken.includes(i);
    setTaken((t) => (had ? t.filter((x) => x !== i) : [...t, i]));
    sfx(had ? 'tick' : 'pop', {vol: 0.5, rate: 0.9 + tk.length * 0.02});
  };
  const tone = done ? 'is-right' : api.status === 'wrong' ? 'is-wrong' : '';

  return (
    <div className="drobi-eq">
      <svg className="drobi-eq__lp" viewBox={`0 0 ${S} ${S}`} aria-hidden>
          <Pizza id="eq-l" x={c} y={c} r={R} angles={LEFT} explode={5} lift={[14, 14, 14, 0]} ring={[1, 1, 1, 0]} ringColor={C.red} dim={[0, 0, 0, 1]} />
      </svg>
      <svg className="drobi-eq__rp" viewBox={`0 0 ${S} ${S}`}>
          <Pizza
            id="eq-r"
            x={c}
            y={c}
            r={R}
            angles={RIGHT}
            explode={4}
            lift={RIGHT.map((_, i) => (tk.includes(i) ? 16 : 0))}
            ring={RIGHT.map((_, i) => (tk.includes(i) ? 1 : 0))}
            ringColor={C.red}
            dim={RIGHT.map((_, i) => (done && !tk.includes(i) ? 1 : 0))}
          />
          {RIGHT.map((a0, i) => {
            const a1 = a0 + 360 / N;
            const [lx, ly] = pol(c, c, R * 0.7, (a0 + a1) / 2);
            const on = tk.includes(i);
            return (
              <g key={i} className="drobi-hit" onClick={() => toggle(i)} style={{cursor: locked ? 'default' : 'pointer'}}>
                <path d={sectorPath(c, c, R + 30, a0, a1)} fill="transparent" />
                {on && (
                  <motion.g initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', stiffness: 500, damping: 20}} style={{transformOrigin: `${lx}px ${ly}px`, transformBox: 'view-box'}}>
                    <circle cx={lx} cy={ly} r={17} fill={C.red} />
                    <path d={`M ${lx - 7} ${ly} l 5 5.5 l 9 -10`} stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.g>
                )}
              </g>
            );
          })}
          {done && (
            <motion.path
              d={sectorPath(c, c, R + 26, 0, 270)}
              fill="none"
              stroke={C.ink}
              strokeWidth={5}
              strokeDasharray="14 12"
              strokeLinejoin="round"
              initial={{opacity: 0, scale: 1.12, rotate: -20}}
              animate={{opacity: 1, scale: 1, rotate: 0}}
              transition={{type: 'spring', stiffness: 140, damping: 16, delay: 0.25}}
              style={{pointerEvents: 'none', transformOrigin: `${c}px ${c}px`, transformBox: 'view-box'}}
            />
          )}
      </svg>

      <div className="drobi-eq__frac drobi-eq__lf">
        <Frac n={3} d={4} />
        <span className="drobi-eq__l">3 куска из 4</span>
      </div>
      <div className={`drobi-eq__e num ${tone}`}>=</div>
      <div className="drobi-eq__frac drobi-eq__rf">
          <Frac n={tk.length ? tk.length : <span className="q">?</span>} d={N} />
          <span className="drobi-eq__l">
            {locked ? <span>взял <b>{tk.length}</b> из <b>{N}</b></span> : <><Icon name="bulb" size={14} /> нажимай на куски</>}
          </span>
      </div>
    </div>
  );
};

export const equalPizza: TaskDef = {
  id: 'equal-pizza',
  kind: 'Найди пару',
  title: 'Возьми из второй пиццы столько же, сколько слева',
  hint: 'Каждый кусок слева разрезан на 3 маленьких. Сколько маленьких кусков в трёх больших?',
  explain: 'Каждая четверть — это 3 куска из 12. Три четверти — 3 · 3 = 9 кусков: ¾ = 9⁄12.',
  xp: 25,
  replay: 's06_equal',
  Stage,
};
