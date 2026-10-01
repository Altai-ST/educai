import React, {useState} from 'react';
import {motion} from 'motion/react';
import {C} from '../../art/kit';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {Readout, Split, StageSvg} from '../kit';
import {Frac} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import {ChocoPiece, simplify} from './art';
import type {TaskDef} from '../types';
import './drobi.css';

const ROWS = 3;
const COLS = 4;
const N = ROWS * COLS;
const K = 9;
const PW = 130, PH = 110, GAP = 14;
const BW = COLS * PW + (COLS - 1) * GAP;
const BH = ROWS * PH + (ROWS - 1) * GAP;
const X0 = (660 - BW) / 2, Y0 = (500 - BH) / 2 - 6;
/** revealed: three full columns out of four */
const ANSWER = Array.from({length: N}, (_, i) => i).filter((i) => i % COLS < 3);
/** every piece tilts its own way when broken off */
const TILT = [-7, 5, -4, 8, 6, -6, 4, -8, -5, 7, -3, 6];

const Stage: React.FC = () => {
  const api = useTask();
  const [taken, setTaken] = useState<number[]>([]);
  const revealed = api.status === 'revealed';
  const tk = revealed ? ANSWER : taken;
  const locked = api.status !== 'answering';

  api.useCheck(taken.length > 0, () => taken.length === K);

  const toggle = (i: number) => {
    if (locked) return;
    const had = taken.includes(i);
    setTaken((t) => (had ? t.filter((x) => x !== i) : [...t, i]));
    sfx(had ? 'tick' : 'snap', {vol: 0.5, rate: had ? 0.9 : 0.95 + Math.random() * 0.1});
  };

  const n = tk.length;
  const simp = n === N ? ([1, 1] as [number, number]) : simplify(n, N);
  const tone = api.status === 'right' || revealed ? 'right' : api.status === 'wrong' ? 'wrong' : 'ink';
  // lifted pieces are drawn last so they sit on top of their neighbours
  const order = Array.from({length: N}, (_, i) => i).sort((a, b) => Number(tk.includes(a)) - Number(tk.includes(b)));

  return (
    <Split ratio="1.15fr 1fr">
      <StageSvg w={660} h={500}>
        <rect x={X0 - 18 + 10} y={Y0 - 18 + 16} width={BW + 36} height={BH + 36} rx={28} fill={C.ink} opacity={0.14} />
        <rect x={X0 - 18} y={Y0 - 18} width={BW + 36} height={BH + 36} rx={28} fill="#5A321E" />
        {Array.from({length: N}, (_, i) => (
          <rect key={i} x={X0 + (i % COLS) * (PW + GAP)} y={Y0 + Math.floor(i / COLS) * (PH + GAP)} width={PW} height={PH} rx={14} fill="#43241A" />
        ))}
        {order.map((i) => {
          const on = tk.includes(i);
          const x = X0 + (i % COLS) * (PW + GAP);
          const y = Y0 + Math.floor(i / COLS) * (PH + GAP);
          return (
            <motion.g
              key={i}
              className="drobi-hit"
              data-i={i}
              onClick={() => toggle(i)}
              style={{cursor: locked ? 'default' : 'pointer', transformOrigin: `${x + PW / 2}px ${y + PH / 2}px`, transformBox: 'view-box'}}
              animate={{y: on ? -18 : 0, x: on ? TILT[i] * 0.8 : 0, rotate: on ? TILT[i] * 0.6 : 0, scale: on ? 0.95 : 1}}
              whileHover={locked ? undefined : {scale: on ? 0.97 : 1.03}}
              transition={{type: 'spring', stiffness: 380, damping: 18}}
            >
              {on && <rect x={x + 4} y={y + 24} width={PW} height={PH} rx={14} fill={C.ink} opacity={0.22} />}
              <g transform={`translate(${x} ${y})`}>
                <ChocoPiece w={PW} h={PH} taken={on} />
                {on && <motion.rect initial={{opacity: 0}} animate={{opacity: 1}} x={0} y={0} width={PW} height={PH} rx={14} fill="none" stroke={C.red} strokeWidth={8} />}
              </g>
            </motion.g>
          );
        })}
      </StageSvg>

      <div className="stage-panel">
        <div className="target-chip">
          отломи <Frac n={3} d={4} />
        </div>
        <Readout label={<>отломил <b>{n}</b> из <b>{N}</b></>} tone={tone}>
          <span className="drobi-eqline" style={{fontSize: 'inherit', color: 'inherit'}}>
            <Frac n={n} d={N} />
            {simp && (
              <motion.span key={simp.join('/')} className="drobi-eqline" initial={{opacity: 0, x: -12}} animate={{opacity: 1, x: 0}} style={{fontSize: '0.62em', color: 'inherit', marginLeft: '0.3em', gap: '0.25em'}}>
                = {simp[1] === 1 ? <span className="num">1</span> : <Frac n={simp[0]} d={simp[1]} />}
              </motion.span>
            )}
          </span>
        </Readout>
        <p className="stage-note">
          <Icon name="bulb" size={16} /> Нажимай на дольки, чтобы отломить
        </p>
      </div>
    </Split>
  );
};

export const chocolate: TaskDef = {
  id: 'chocolate',
  kind: 'Отломи',
  title: 'Отломи ¾ шоколадки',
  hint: 'Сначала найди ¼: раздели 12 долек на 4 равные части. Потом возьми 3 такие части.',
  explain: '¼ от 12 долек — это 3 дольки, а ¾ — три раза по 3, то есть 9 долек: 9⁄12 = ¾.',
  xp: 20,
  replay: 's03_two',
  Stage,
};
