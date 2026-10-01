import React, {useState} from 'react';
import {motion} from 'motion/react';
import {useTask} from '../engine';
import {SortRow} from '../kit';
import {Frac} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import {useNarrow} from './art';
import type {TaskDef} from '../types';
import './drobi.css';

type Id = '1/2' | '1/3' | '3/4' | '1/8' | '5/8';
const CORRECT: Id[] = ['1/8', '1/3', '1/2', '5/8', '3/4'];
const parse = (id: Id) => id.split('/').map(Number) as [number, number];

/** random start order that is never already sorted (nor almost sorted) */
const shuffled = (): Id[] => {
  for (;;) {
    const a = CORRECT.slice().sort(() => Math.random() - 0.5);
    if (a.filter((id, i) => id === CORRECT[i]).length <= 1) return a;
  }
};

/** paper bar split into d parts, n of them red — the proof under each chip */
const Bar: React.FC<{n: number; d: number; delay: number}> = ({n, d, delay}) => (
  <motion.div className="drobi-bar" initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} transition={{delay, duration: 0.3}}>
    <motion.div className="drobi-bar__fill" initial={{width: 0}} animate={{width: `${(n / d) * 100}%`}} transition={{delay: delay + 0.15, type: 'spring', stiffness: 120, damping: 18}} />
    {Array.from({length: d - 1}, (_, k) => (
      <span key={k} className="drobi-bar__cut" style={{left: `${((k + 1) / d) * 100}%`}} />
    ))}
  </motion.div>
);

const Stage: React.FC = () => {
  const api = useTask();
  const narrow = useNarrow(600);
  const [items, setItems] = useState<Id[]>(shuffled);
  const [moved, setMoved] = useState(false);
  const revealed = api.status === 'revealed';
  const proof = api.status !== 'answering';
  const shown = revealed ? CORRECT : items;

  api.useCheck(moved, () => items.join() === CORRECT.join());

  return (
    <div className="stage-center drobi-order">
      {narrow && <p className="stage-note">Сверху — самая маленькая</p>}
      <SortRow
        items={shown}
        onChange={(v) => {
          setItems(v);
          setMoved(true);
        }}
        status={api.status}
        axis={narrow ? 'y' : 'x'}
        correctOrder={CORRECT}
        render={(id) => {
          const [n, d] = parse(id);
          return (
            <div className="drobi-chip">
              <Frac n={n} d={d} />
              {proof && <Bar n={n} d={d} delay={0.1 + shown.indexOf(id) * 0.09} />}
            </div>
          );
        }}
      />
      {!narrow && (
        <div className="drobi-axis">
          меньше <i /> больше
        </div>
      )}
      <p className="stage-note">
        <Icon name="bulb" size={16} /> Перетаскивай карточки
      </p>
    </div>
  );
};

export const order: TaskDef = {
  id: 'order',
  kind: 'Расставь',
  title: 'Расставь дроби от меньшей к большей',
  hint: 'Сравни каждую дробь с половиной: какие меньше ½, какие больше? И помни: 1⁄8 меньше 1⁄3 — частей больше, каждая мельче.',
  explain: '1⁄8 < 1⁄3 < 1⁄2 < 5⁄8 < 3⁄4. Половина — это 4⁄8, значит 5⁄8 чуть больше половины, а ¾ = 6⁄8 — ещё больше.',
  xp: 25,
  replay: 's04_pizza',
  Stage,
};
