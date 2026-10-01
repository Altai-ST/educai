import React, {useState} from 'react';
import {motion} from 'motion/react';
import {PriceTag} from '../../art/art';
import {C, FONT} from '../../art/kit';
import {useTask} from '../engine';
import {Choice, Split, StageSvg} from '../kit';
import type {TaskDef} from '../types';
import {money} from './art';

const OPTIONS = ['Стала больше', 'Не изменилась', 'Стала меньше'];
const RIGHT = 2;

// bars: the axis starts at 800 so that a difference of 10 is visible; 1 unit = 1 px
const BASE = 400, ZERO = 800, BW = 86;
const yOf = (v: number) => BASE - (v - ZERO);
const BARS = [
  {cx: 100, v: 1000, label: 'было'},
  {cx: 310, v: 1100, label: 'после +10 %'},
  {cx: 520, v: 990, label: 'после −10 %'},
];
const springT = (delay: number) => ({type: 'spring', stiffness: 140, damping: 18, delay}) as const;

/** «+10 %» between two bars: label, arrow, and (after the check) the amount */
const Hop: React.FC<{x1: number; x2: number; y: number; text: string; sub?: string; color: string; delay: number}> = ({x1, x2, y, text, sub, color, delay}) => {
  const mx = (x1 + x2) / 2;
  return (
    <motion.g initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={springT(delay)}>
      <text x={mx} y={y} fontFamily={FONT} fontSize={32} fontWeight={900} textAnchor="middle" fill={color}>{text}</text>
      <path d={`M ${x1} ${y + 26} L ${x2} ${y + 26} M ${x2 - 12} ${y + 16} L ${x2} ${y + 26} L ${x2 - 12} ${y + 36}`} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {sub && (
        <motion.text x={mx} y={y + 70} fontFamily={FONT} fontSize={30} fontWeight={800} textAnchor="middle" fill={color} initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} transition={springT(delay + 0.3)}>
          {sub}
        </motion.text>
      )}
    </motion.g>
  );
};

const Bars: React.FC<{shown: boolean}> = ({shown}) => {
  const [b0, b1, b2] = BARS;
  const y1000 = yOf(1000), y1100 = yOf(1100), y990 = yOf(990);
  return (
    <g>
      {/* floor */}
      <line x1={24} x2={596} y1={BASE} y2={BASE} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />

      {/* bar 1: 1 000 */}
      <rect x={b0.cx - BW / 2 + 6} y={y1000 + 8} width={BW} height={BASE - y1000} rx={10} fill={C.ink} opacity={0.12} />
      <rect x={b0.cx - BW / 2} y={y1000} width={BW} height={BASE - y1000} rx={10} fill={C.teal} />

      {shown ? (
        <>
          {/* shadows grow with the bars */}
          <motion.rect x={b1.cx - BW / 2 + 6} width={BW} rx={10} fill={C.ink} opacity={0.12} initial={{y: BASE, height: 0}} animate={{y: y1100 + 8, height: BASE - y1100}} transition={springT(0.55)} />
          <motion.rect x={b2.cx - BW / 2 + 6} width={BW} rx={10} fill={C.ink} opacity={0.12} initial={{y: BASE, height: 0}} animate={{y: y990 + 8, height: BASE - y990}} transition={springT(1.0)} />
          {/* bar 2: 1 000 + 100 */}
          {/* the +100 part sits under the teal 1 000 so the rounded top does not leave a gap */}
          <motion.rect x={b1.cx - BW / 2} width={BW} rx={10} fill={C.mustard} initial={{y: y1000, height: 0}} animate={{y: y1100, height: y1000 - y1100 + 10}} transition={springT(0.55)} />
          <motion.rect x={b1.cx - BW / 2} width={BW} rx={10} fill={C.teal} initial={{y: BASE, height: 0}} animate={{y: y1000, height: BASE - y1000}} transition={springT(0.15)} />
          {/* bar 3: 1 100 − 110 = 990, the cut part stays as a dashed ghost */}
          <motion.rect x={b2.cx - BW / 2} width={BW} rx={10} fill={C.teal} initial={{y: BASE, height: 0}} animate={{y: y990, height: BASE - y990}} transition={springT(1.0)} />
          <motion.rect
            x={b2.cx - BW / 2 + 2}
            y={y1100 + 2}
            width={BW - 4}
            height={y990 - y1100 - 2}
            rx={8}
            fill={C.red}
            fillOpacity={0.14}
            stroke={C.red}
            strokeWidth={4}
            strokeDasharray="10 8"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{delay: 1.25}}
          />
          {/* 1 000 level */}
          <motion.g initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1.7}}>
            <line x1={b0.cx + BW / 2} x2={b2.cx + BW / 2 + 16} y1={y1000} y2={y1000} stroke={C.ink} strokeWidth={3} strokeDasharray="8 8" opacity={0.55} />
          </motion.g>
          <motion.g initial={{opacity: 0, scale: 0.6}} animate={{opacity: 1, scale: 1}} transition={springT(0.7)} style={{transformOrigin: `${b1.cx}px ${y1100 - 34}px`}}>
            <PriceTag x={b1.cx + 4} y={y1100 - 34} s={0.4} rotate={-4} text={money(1100)} />
          </motion.g>
          <motion.g initial={{opacity: 0, scale: 0.6}} animate={{opacity: 1, scale: 1}} transition={springT(1.4)} style={{transformOrigin: `${b2.cx}px ${y1100 - 34}px`}}>
            <PriceTag x={b2.cx + 4} y={y1100 - 34} s={0.4} rotate={4} text={money(990)} />
          </motion.g>
        </>
      ) : (
        <>
          {[b1, b2].map((b) => (
            <g key={b.cx}>
              <rect x={b.cx - BW / 2 + 2} y={y1000 + 2} width={BW - 4} height={BASE - y1000 - 4} rx={10} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="12 10" opacity={0.3} />
              <text x={b.cx} y={y1000 + 120} fontFamily={FONT} fontSize={64} fontWeight={900} textAnchor="middle" fill={C.ink} opacity={0.22}>?</text>
            </g>
          ))}
        </>
      )}

      <PriceTag x={b0.cx + 4} y={y1000 - 34} s={0.4} rotate={-4} text={money(1000)} />

      <Hop x1={b0.cx + BW / 2 + 12} x2={b1.cx - BW / 2 - 12} y={262} text="+10 %" sub={shown ? '+100' : undefined} color={C.green} delay={0.1} />
      <Hop x1={b1.cx + BW / 2 + 12} x2={b2.cx - BW / 2 - 12} y={262} text="−10 %" sub={shown ? '−110' : undefined} color={C.red} delay={shown ? 1.0 : 0.25} />

      {BARS.map((b) => (
        <text key={b.cx} x={b.cx} y={BASE + 40} fontFamily={FONT} fontSize={26} fontWeight={700} textAnchor="middle" fill={C.ink} opacity={0.55}>{b.label}</text>
      ))}
      {shown && (
        <motion.text x={310} y={BASE + 94} fontFamily={FONT} fontSize={34} fontWeight={800} textAnchor="middle" fill={C.ink} initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={springT(1.9)}>
          10 % от <tspan fill={C.red}>1 100</tspan> — это уже <tspan fill={C.red}>110</tspan>
        </motion.text>
      )}
    </g>
  );
};

const Stage: React.FC = () => {
  const api = useTask();
  const [pick, setPick] = useState<number | null>(null);
  const value = api.status === 'revealed' ? RIGHT : pick;

  api.useCheck(pick !== null, () => pick === RIGHT);

  return (
    <Split ratio="1.25fr 1fr">
      <StageSvg w={620} h={510}>
        <Bars key={api.status === 'answering' ? 'q' : 'a'} shown={api.status !== 'answering'} />
      </StageSvg>
      <div className="stage-panel">
        <Choice options={OPTIONS} value={value} onChange={setPick} status={api.status} correct={RIGHT} columns={1} size="md" />
      </div>
    </Split>
  );
};

export const upDown: TaskDef = {
  id: 'up-down',
  kind: 'Подумай',
  title: 'Цену 1\u00A0000 подняли на 10\u00A0%, а потом снизили на 10\u00A0%. Что стало?',
  hint: 'Второй раз 10\u00A0% считают уже от новой цены, а не от 1\u00A0000.',
  explain: '+10\u00A0% от 1\u00A0000 — это +100, цена 1\u00A0100. Потом −10\u00A0% от 1\u00A0100 — это −110. Итог 990 — меньше, чем было.',
  xp: 25,
  replay: 's05_trap',
  Stage,
};
