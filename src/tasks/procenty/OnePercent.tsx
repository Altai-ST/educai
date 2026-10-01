import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Jacket, PriceTag} from '../../art/art';
import {C, FONT} from '../../art/kit';
import {useTask} from '../engine';
import {NumPad, parseNum, RoundDots, Split, StageSvg, useRounds} from '../kit';
import {Icon} from '../../ui/Icon';
import type {TaskDef, TaskStatus} from '../types';
import {CellGrid, money, Pct} from './art';

const PRICE = 8000;
const STEPS = [
  {p: 1, ans: 80, cells: '1 клетка'},
  {p: 15, ans: 1200, cells: '15 клеток'},
];

const Stage: React.FC = () => {
  const api = useTask();
  const r = useRounds(STEPS.length, api.finish, STEPS.length);
  const [vals, setVals] = useState(['', '']);
  const done = api.status !== 'answering';
  const step = STEPS[r.index];
  const v = vals[r.index];

  // «Ещё раз» → start both steps over
  useEffect(() => {
    if (api.attempt === 0) return;
    r.reset();
    setVals(['', '']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.attempt]);

  const submit = () => {
    if (done || r.flash !== null || !v) return;
    r.answer(parseNum(v) === step.ans);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && submit();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const padStatus: TaskStatus = done ? api.status : r.flash === null ? 'answering' : r.flash ? 'right' : 'wrong';
  const lit = done ? STEPS[1].p : step.p;
  // what the right side of the grid says: the value is known once the step is answered
  const known = done || r.flash !== null ? STEPS[done ? 1 : r.index].ans : null;
  const cur = done ? STEPS[1] : step;

  return (
    <Split ratio="1.05fr 1fr">
      <StageSvg w={560} h={600}>
        <Jacket x={185} y={215} s={0.6} />
        <PriceTag x={372} y={250} s={0.6} text={money(PRICE)} />

        <CellGrid x={40} y={390} size={190} fill={(i) => (i < lit ? C.red : undefined)} delay={(i) => i * 0.04} />
        <text x={258} y={416} fontFamily={FONT} fontSize={30} fontWeight={800} fill={C.ink}>
          {money(PRICE)} = 100 %
        </text>
        <AnimatePresence mode="wait">
          <motion.g key={cur.p} initial={{opacity: 0, x: -14}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 14}} transition={{type: 'spring', stiffness: 300, damping: 26}}>
            <text x={258} y={480} fontFamily={FONT} fontSize={30} fontWeight={800} fill={C.red}>
              {cur.cells} = {cur.p} %
            </text>
            <text x={258} y={562} fontFamily={FONT} fontSize={54} fontWeight={900} fill={known !== null ? C.teal : C.ink} opacity={known !== null ? 1 : 0.25}>
              = {known !== null ? money(known) : '?'}
            </text>
          </motion.g>
        </AnimatePresence>
      </StageSvg>

      <div className="stage-panel">
        <RoundDots results={r.results} index={r.index} />
        {done ? (
          <div className="proc-sum">
            {STEPS.map((s, i) => {
              const ok = api.status === 'revealed' ? true : r.results[i] === true;
              return (
                <motion.div key={s.p} className="proc-sum__row" initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: i * 0.12}}>
                  <span>
                    <Pct n={s.p} /> от {money(PRICE)} =
                  </span>
                  <span className="proc-sum__v">
                    {api.status !== 'revealed' && !ok && vals[i] && <s>{money(parseNum(vals[i]))}</s>}
                    {money(s.ans)}
                  </span>
                  <span className={`proc-sum__mark ${ok ? '' : 'is-wrong'}`}>
                    <Icon name={ok ? 'check' : 'x'} stroke={3} />
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="proc-steppanel">
            <AnimatePresence mode="wait">
              <motion.div key={r.index} className="proc-q" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}}>
                <Pct n={step.p} /> от {money(PRICE)} <span className="proc-q__muted">=</span> ?
              </motion.div>
            </AnimatePresence>
            <NumPad
              value={v}
              onChange={(nv) => setVals((a) => a.map((x, i) => (i === r.index ? nv : x)))}
              status={padStatus}
              compact
              active={r.flash === null}
            />
            <button className="btn btn--mustard" onClick={submit} disabled={!v || r.flash !== null}>
              Ответить <span className="kbd">↵</span>
            </button>
            <div className="proc-fix" aria-live="polite">
              {r.flash === false && (
                <motion.span initial={{opacity: 0, y: 6}} animate={{opacity: 1, y: 0}}>
                  Правильно: <b className="num">{money(step.ans)}</b>
                </motion.span>
              )}
            </div>
          </div>
        )}
      </div>
    </Split>
  );
};

export const onePercent: TaskDef = {
  id: 'one-percent',
  kind: 'Посчитай',
  title: 'Найди 1\u00A0%, а потом 15\u00A0% от цены куртки',
  hint: '1\u00A0% — сотая часть: раздели цену на 100. Потом умножь на число процентов.',
  explain: '1\u00A0% от 8\u00A0000 = 8\u00A0000\u00A0:\u00A0100 = 80, а 15\u00A0% = 15\u00A0×\u00A080 = 1\u00A0200.',
  xp: 25,
  replay: 's04_find',
  selfCheck: true,
  Stage,
};
