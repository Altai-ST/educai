import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Person, Pizza} from '../../art/art';
import {C} from '../../art/kit';
import {useTask} from '../engine';
import {Choice, RoundDots, Split, StageSvg, useRounds} from '../kit';
import {Icon} from '../../ui/Icon';
import type {TaskDef, TaskStatus} from '../types';
import {GREY, Pct, TestSheet} from './art';

type Round = {big: string; small: string; options: number[]; right: number; Pic: React.FC};

const SheetPic: React.FC = () => <TestSheet x={260} y={225} s={0.98} wrong={[6]} />;

const PizzaPic: React.FC = () => (
  <motion.g initial={{rotate: -10, scale: 0.94}} animate={{rotate: 0, scale: 1}} transition={{type: 'spring', stiffness: 180, damping: 14}} style={{transformOrigin: '260px 225px'}}>
    <Pizza id="how-much" x={260} y={225} r={165} angles={[0, 90, 180, 270]} explode={5} lift={[34, 0, 0, 0]} ring={[1, 0, 0, 0]} ringColor={C.red} />
  </motion.g>
);

const ClassPic: React.FC = () => (
  <g>
    {Array.from({length: 20}, (_, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const on = i === 1 || i === 8 || i === 17;
      return (
        <motion.g key={i} initial={{opacity: 0, y: 14}} animate={{opacity: 1, y: 0}} transition={{type: 'spring', stiffness: 300, damping: 20, delay: i * 0.03}}>
          <Person x={100 + col * 80} y={80 + row * 100} s={0.56} color={on ? C.red : GREY} />
        </motion.g>
      );
    })}
  </g>
);

const ROUNDS: Round[] = [
  {big: '9 из 10', small: 'заданий решены', options: [9, 90, 10, 91], right: 1, Pic: SheetPic},
  {big: '1 кусок из 4', small: 'пиццы взяли', options: [4, 14, 40, 25], right: 3, Pic: PizzaPic},
  {big: '3 из 20', small: 'учеников в классе', options: [3, 15, 20, 30], right: 1, Pic: ClassPic},
];

const Stage: React.FC = () => {
  const api = useTask();
  const r = useRounds(ROUNDS.length, api.finish, 2);
  const [picks, setPicks] = useState<(number | null)[]>(() => ROUNDS.map(() => null));
  const done = api.status !== 'answering';
  const round = ROUNDS[r.index];

  useEffect(() => {
    if (api.attempt === 0) return;
    r.reset();
    setPicks(ROUNDS.map(() => null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.attempt]);

  const choose = (i: number) => {
    if (done || r.flash !== null) return;
    setPicks((p) => p.map((x, k) => (k === r.index ? i : x)));
    r.answer(i === round.right);
  };
  const status: TaskStatus = r.flash === null ? 'answering' : r.flash ? 'right' : 'wrong';

  return (
    <Split ratio="1fr 1fr">
      <StageSvg w={520} h={450}>
        <AnimatePresence mode="wait">
          <motion.g key={r.index} initial={{opacity: 0, x: 40}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -40}} transition={{type: 'spring', stiffness: 260, damping: 26}}>
            <round.Pic />
          </motion.g>
        </AnimatePresence>
      </StageSvg>

      <div className="stage-panel">
        <RoundDots results={r.results} index={r.index} />
        {done ? (
          <div className="proc-sum">
            {ROUNDS.map((rd, i) => {
              const ok = api.status === 'revealed' || r.results[i] === true;
              const pk = picks[i];
              return (
                <motion.div key={i} className="proc-sum__row" initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: i * 0.12}}>
                  <span>{rd.big}</span>
                  <span className="proc-sum__v">
                    {!ok && pk !== null && <s><Pct n={rd.options[pk]} /></s>}
                    <Pct n={rd.options[rd.right]} />
                  </span>
                  <span className={`proc-sum__mark ${ok ? '' : 'is-wrong'}`}>
                    <Icon name={ok ? 'check' : 'x'} stroke={3} />
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div key={r.index} className="proc-cap" initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -12}}>
                <b>{round.big}</b>
                <span>{round.small}</span>
              </motion.div>
            </AnimatePresence>
            <Choice
              key={r.index}
              options={round.options.map((p) => <Pct n={p} />)}
              value={picks[r.index]}
              onChange={choose}
              status={status}
              correct={round.right}
              columns={2}
              size="md"
            />
            <div className="proc-fix" aria-live="polite">
              {r.flash === false && (
                <motion.span initial={{opacity: 0, y: 6}} animate={{opacity: 1, y: 0}}>
                  Правильно: <b><Pct n={round.options[round.right]} /></b>
                </motion.span>
              )}
            </div>
          </>
        )}
      </div>
    </Split>
  );
};

export const howMuch: TaskDef = {
  id: 'how-much',
  kind: 'Сколько процентов?',
  title: 'Посмотри на картинку и выбери, сколько это процентов',
  hint: 'Сделай из дроби сотые: 9⁄10 = 90⁄100, 1⁄4 = 25⁄100, 3⁄20 = 15⁄100.',
  explain: '9 из 10 = 90⁄100 = 90\u00A0%, 1 из 4 = 25⁄100 = 25\u00A0%, 3 из 20 = 15⁄100 = 15\u00A0%.',
  xp: 20,
  replay: 's06_life',
  selfCheck: true,
  Stage,
};
