import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Burger} from '../../art/art';
import {useTask} from '../engine';
import {RoundDots, useRounds} from '../kit';
import {Frac} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import {Crown, useSpringNumber} from './art';
import type {TaskDef} from '../types';
import './drobi.css';

type F = [number, number];
const PAIRS: [F, F][] = [
  [[1, 5], [1, 7]],
  [[2, 3], [2, 9]],
  [[1, 4], [3, 4]],
  [[1, 2], [3, 8]],
];
const val = ([n, d]: F) => n / d;
/** patty thickness ∝ the fraction of a pound; before the tap both look the same */
const pattyOf = (f: F) => 8 + 130 * val(f);
const NEUTRAL = 52;
const flips = () => PAIRS.map(() => Math.random() < 0.5);

const BurgerCard: React.FC<{
  f: F; k: number; open: boolean; tone: 'right' | 'wrong' | ''; crown: boolean; locked: boolean; onPick: () => void;
}> = ({f, k, open, tone, crown, locked, onPick}) => {
  const p = useSpringNumber(open ? pattyOf(f) : NEUTRAL, {stiffness: 120, damping: 14});
  const top = 54 + p + 26 + 142;
  return (
    <motion.button
      className={`drobi-burger ${tone ? 'is-' + tone : ''}`}
      onClick={onPick}
      disabled={locked}
      whileHover={locked ? undefined : {y: -6}}
      whileTap={locked ? undefined : {scale: 0.96}}
      aria-label={`Бургер ${f[0]}/${f[1]} фунта`}
    >
      <span className="drobi-burger__key num">{k}</span>
      <svg viewBox="-175 -425 350 445" className="drobi-burger__svg" aria-hidden>
        <Burger x={0} y={0} w={300} patty={p} />
        <AnimatePresence>
          {crown && (
            <motion.g initial={{opacity: 0, y: -30, scale: 0.4}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0}} transition={{type: 'spring', stiffness: 260, damping: 14, delay: 0.35}}>
              <Crown x={0} y={-top - 44} s={1.05} />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
      <Frac n={f[0]} d={f[1]} className="drobi-burger__frac" />
      <span className="drobi-burger__unit">фунта</span>
      <AnimatePresence>
        {tone && (
          <motion.span className={`drobi-badge is-${tone}`} initial={{scale: 0, rotate: -30}} animate={{scale: 1, rotate: 0}} exit={{scale: 0}} transition={{type: 'spring', stiffness: 400, damping: 16}}>
            <Icon name={tone === 'right' ? 'check' : 'x'} size={22} stroke={3.4} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const Stage: React.FC = () => {
  const api = useTask();
  const r = useRounds(PAIRS.length, api.finish, 3);
  const [flip, setFlip] = useState(flips);
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = api.status === 'revealed';

  useEffect(() => setPicked(null), [r.index]);
  useEffect(() => {
    if (api.attempt === 0) return;
    r.reset();
    setFlip(flips());
    setPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.attempt]);

  const index = revealed ? PAIRS.length - 1 : r.index;
  const [a, b] = PAIRS[index];
  const sides: [F, F] = flip[index] ? [b, a] : [a, b];
  const correct = val(sides[0]) > val(sides[1]) ? 0 : 1;
  const shown = revealed ? correct : picked;
  const locked = api.status !== 'answering' || picked !== null;

  const pick = (i: number) => {
    if (locked) return;
    setPicked(i);
    r.answer(i === correct);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === '2') pick(Number(e.key) - 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const sign = val(sides[0]) > val(sides[1]) ? '>' : '<';
  return (
    <div className="stage-center drobi-rounds">
      <div className="drobi-rounds__top">
        <RoundDots results={r.results} index={index} />
        <span className="stage-note">Котлета — сколько мяса в бургере</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index + (flip[index] ? 'f' : '')}
          className="drobi-duel"
          initial={{opacity: 0, x: 60}}
          animate={{opacity: 1, x: 0}}
          exit={{opacity: 0, x: -60}}
          transition={{type: 'spring', stiffness: 260, damping: 26}}
        >
          {sides.map((f, i) => (
            <React.Fragment key={i}>
              {i === 1 && (
                <div className="drobi-duel__sign num">
                  <AnimatePresence>
                    {shown !== null && (
                      <motion.span initial={{scale: 0, rotate: -90}} animate={{scale: 1, rotate: 0}} transition={{type: 'spring', stiffness: 300, damping: 15, delay: 0.25}}>
                        {sign}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <BurgerCard
                f={f}
                k={i + 1}
                open={shown !== null}
                tone={shown === i ? (i === correct ? 'right' : 'wrong') : ''}
                crown={shown !== null && i === correct}
                locked={locked}
                onPick={() => pick(i)}
              />
            </React.Fragment>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const burgerRounds: TaskDef = {
  id: 'burger-rounds',
  kind: 'Сравни',
  title: 'Какой бургер больше? Четыре раунда',
  hint: 'Числители равны — больше та, где знаменатель меньше (части крупнее). Знаменатели равны — где числитель больше. А ½ — это 4⁄8.',
  explain: '1⁄5 > 1⁄7 и 2⁄3 > 2⁄9 — меньше частей, крупнее каждая. 3⁄4 > 1⁄4 и 1⁄2 = 4⁄8 > 3⁄8 — при равных частях больше та, где их взяли больше.',
  xp: 20,
  replay: 's04_pizza',
  selfCheck: true,
  Stage,
};
