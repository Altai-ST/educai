import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Medal, Swimmer} from '../../art/art';
import {C} from '../../art/kit';
import {useTask} from '../engine';
import {SortRow} from '../kit';
import {Dec} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';

type Id = '50,58' | '50,59' | '50,6' | '50,09';
const CORRECT: Id[] = ['50,09', '50,58', '50,59', '50,6'];
const START: Id[] = ['50,6', '50,58', '50,09', '50,59'];
const CAP: Record<Id, string> = {'50,58': '#F4F4F4', '50,59': C.red, '50,6': C.mustard, '50,09': C.teal};

/** slow arm strokes while the race is "live" */
function useFrame(running: boolean) {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setF((x) => x + 1), 60);
    return () => clearInterval(t);
  }, [running]);
  return f;
}

const Lane: React.FC<{id: Id; f: number}> = ({id, f}) => (
  <div className="des-lane">
    <span className="des-lane__time num">
      <Dec v={id} />
    </span>
    <span className="des-lane__swim">
      <svg viewBox="-190 -50 260 100" preserveAspectRatio="xMaxYMid meet" aria-hidden>
        <Swimmer x={0} y={0} cap={CAP[id]} f={f + id.length * 7 + Number(id.slice(-1)) * 3} speed={0.4} />
      </svg>
    </span>
  </div>
);

const Stage: React.FC = () => {
  const api = useTask();
  const [order, setOrder] = useState<Id[]>(START);
  const [touched, setTouched] = useState(false);
  const revealed = api.status === 'revealed';
  const checked = api.status !== 'answering';
  const items = revealed ? CORRECT : order;
  const f = useFrame(!checked);

  api.useCheck(touched, () => order.every((id, i) => id === CORRECT[i]));

  return (
    <div className="stage-center">
      <div className="des-pool">
        <div className="des-pool__wall" aria-hidden />
        <div className="des-pool__badges">
          <span className="des-pool__badge">ПЕКИН · 2008</span>
          <span className="des-pool__badge is-mustard">100 м баттерфляй</span>
        </div>
        <div className="des-pool__lanes">
          <div className="des-pool__places" aria-hidden>
            {items.map((id, i) => {
              const on = checked;
              const gold = on && i === 0 && id === CORRECT[0];
              return (
                <div key={i} className="des-pool__place">
                  <AnimatePresence mode="wait" initial={false}>
                    {gold ? (
                      <motion.svg key="gold" width={50} height={65} viewBox="-165 -265 330 430" initial={{scale: 0, rotate: -30}} animate={{scale: 1, rotate: 0}} transition={{type: 'spring', stiffness: 320, damping: 13, delay: 0.15}}>
                        <Medal x={0} y={0} label="1" />
                      </motion.svg>
                    ) : (
                      <motion.span
                        key={on ? 'on' : 'off'}
                        className={`des-pool__num num ${on ? 'is-on' : ''}`}
                        initial={on ? {scale: 0.3} : false}
                        animate={{scale: 1}}
                        transition={{type: 'spring', stiffness: 420, damping: 16, delay: on ? 0.1 + i * 0.08 : 0}}
                      >
                        {i + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <SortRow
            items={items}
            onChange={(v) => {
              setOrder(v);
              setTouched(true);
            }}
            render={(id) => <Lane id={id} f={f} />}
            status={api.status}
            axis="y"
            correctOrder={CORRECT}
          />
        </div>
      </div>
      <p className="stage-note"><Icon name="bulb" size={16} /> Тяни дорожки: сверху — первое место</p>
    </div>
  );
};

export const photoFinish: TaskDef = {
  id: 'photo-finish',
  kind: 'Фотофиниш',
  title: 'Расставь по местам: кто приплыл первым?',
  hint: 'Меньше время — быстрее. Сравнивай по разрядам: целые, потом десятые, потом сотые.',
  explain: 'Целые у всех 50. По десятым первый 50,09 (0 десятых), последний 50,6 = 50,60. А 50,58 быстрее 50,59 на одну сотую.',
  xp: 25,
  replay: 's01_hook',
  Stage,
};
