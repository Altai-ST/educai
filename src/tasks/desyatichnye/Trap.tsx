import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {RoundDots, useRounds} from '../kit';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';
import {DecNum} from './art';

/** [a, b] — the first one is always the bigger */
const PAIRS: [string, string][] = [
  ['0,5', '0,45'],
  ['0,7', '0,65'],
  ['0,3', '0,29'],
  ['0,1', '0,08'],
];
const fracLen = (v: string) => v.split(',')[1].length;
/** zeros to append so both numbers have the same number of digits after the comma */
const pad = (v: string, other: string) => '0'.repeat(Math.max(0, fracLen(other) - fracLen(v)));
/** "0,5" + "0" → 50 (сотых) */
const hundredths = (v: string, extra: string) => Number((v.split(',')[1] + extra).slice(0, 2));

const pop = {type: 'spring', stiffness: 460, damping: 18} as const;

const Round: React.FC<{pair: [string, string]; flip: boolean; onAnswer: (ok: boolean) => void; locked: boolean}> = ({pair, flip, onAnswer, locked}) => {
  const [big] = pair;
  const sides = flip ? [pair[1], pair[0]] : pair;
  const [pick, setPick] = useState<number | null>(null);
  const timer = useRef<number>(0);
  const done = pick !== null;
  const ok = done && sides[pick] === big;

  const choose = (i: number) => {
    if (done || locked) return;
    setPick(i);
    sfx('click', {vol: 0.45});
    // the zeros drop in first, then the verdict
    window.setTimeout(() => sfx('tick', {vol: 0.4, rate: 1.2}), 120);
    timer.current = window.setTimeout(() => onAnswer(sides[i] === big), 520);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === '2') choose(Number(e.key) - 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <motion.div className="des-trap__row" initial={{opacity: 0, y: 24}} animate={{opacity: 1, y: 0}} transition={{type: 'spring', stiffness: 260, damping: 24}}>
      {sides.map((v, i) => {
        const other = sides[1 - i];
        const extra = done ? pad(v, other) : '';
        const isBig = v === big;
        return (
          <motion.button
            key={v}
            className={`des-trap__opt ${i === 0 ? 'is-a' : 'is-b'} ${done && isBig ? 'is-big' : ''} ${pick === i ? `is-pick ${ok ? 'is-right' : 'is-wrong'}` : ''}`}
            disabled={done || locked}
            onClick={() => choose(i)}
            whileHover={done || locked ? undefined : {y: -4}}
            whileTap={done || locked ? undefined : {scale: 0.96}}
          >
            <span className="des-trap__key num">{i + 1}</span>
            <DecNum v={v} extra={extra} />
            <AnimatePresence>
              {done && (
                <motion.span
                  className={`des-trap__pill num ${isBig ? '' : 'is-small'}`}
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: 0.3}}
                >
                  {hundredths(v, extra)} сотых
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
      <div className="des-trap__mid">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.span key="v" className={`des-trap__badge ${ok ? 'is-right' : 'is-wrong'}`} initial={{scale: 0, rotate: -40}} animate={{scale: 1, rotate: 0}} transition={{...pop, delay: 0.38}}>
              <Icon name={ok ? 'check' : 'x'} size={34} stroke={3.4} />
            </motion.span>
          ) : (
            <motion.span key="q" className="des-trap__q-mark" initial={{scale: 0.6, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.4, opacity: 0}}>
              ?
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/** after «Показать ответ»: every pair with the zeros already appended */
const Answers: React.FC = () => (
  <div className="des-trap__all">
    {PAIRS.map(([a, b], k) => (
      <motion.div key={k} className="des-trap__pair" initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{delay: k * 0.08}}>
        <DecNum v={a} extra={pad(a, b)} className="is-big" />
        <span className="des-trap__sign">&gt;</span>
        <DecNum v={b} extra={pad(b, a)} />
      </motion.div>
    ))}
  </div>
);

const randomSides = () => PAIRS.map(() => Math.random() < 0.5);

const Stage: React.FC = () => {
  const api = useTask();
  const r = useRounds(PAIRS.length, api.finish, 3);
  const [flips, setFlips] = useState(randomSides);
  const locked = api.status !== 'answering';

  // «Ещё раз» → fresh rounds, sides shuffled again
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    r.reset();
    setFlips(randomSides());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.attempt]);

  return (
    <div className="des-trap">
      <div className="des-trap__top">
        <span className="sticker">Ловушка</span>
        <RoundDots results={r.results} index={r.index} />
      </div>
      {api.status === 'revealed' ? (
        <Answers />
      ) : (
        <>
          <div className="des-trap__q">Что больше?</div>
          <Round key={`${api.attempt}-${r.index}`} pair={PAIRS[r.index]} flip={flips[r.index]} onAnswer={r.answer} locked={locked} />
          <p className="stage-note"><Icon name="bulb" size={16} /> Нажми на большее число · клавиши 1 / 2</p>
        </>
      )}
    </div>
  );
};

export const trap: TaskDef = {
  id: 'trap',
  kind: 'Ловушка',
  title: 'Выбери большее число — четыре раунда',
  hint: 'Не смотри на длину числа. Допиши нули, чтобы цифр после запятой стало поровну.',
  explain: '0,5 = 0,50, а 50 сотых больше 45 сотых. Длинная запись не значит большое число.',
  xp: 20,
  replay: 's05_trap',
  selfCheck: true,
  Stage,
};
