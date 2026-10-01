import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Jacket, PriceTag, Sticker, Terminal} from '../../art/art';
import {C, FONT} from '../../art/kit';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {Choice, Split, StageSvg} from '../kit';
import type {TaskDef} from '../types';
import {Bubble, CellGrid, GREY, money} from './art';

const OPTIONS = [3200, 3600, 4000, 2800];
const RIGHT = 1;

// proof grid geometry (column-major cells: 0–49 grey, 50–54 red, 55–99 teal)
const GX = 120, GY = 110, GS = 360, CS = GS / 10;
const T_RED = 0.95, T_TEAL = 1.55, T_TOTAL = 2.5;
const cellColor = (i: number) => (i < 50 ? GREY : i < 55 ? C.red : C.teal);
const cellDelay = (i: number) => (i < 50 ? 0.25 + i * 0.012 : i < 55 ? T_RED + (i - 50) * 0.08 : T_TEAL + (i - 55) * 0.012);

const fadeUp = (delay: number) => ({
  initial: {opacity: 0, y: 12},
  animate: {opacity: 1, y: 0},
  transition: {type: 'spring', stiffness: 260, damping: 22, delay},
}) as const;

/** 10×10 proof: −50 % grey, then 10 % of what is left in red, the rest teal = what we pay */
const Proof: React.FC = () => {
  useEffect(() => {
    const a = setTimeout(() => sfx('snap', {vol: 0.4}), T_RED * 1000);
    const b = setTimeout(() => sfx('cash', {vol: 0.4}), (T_TEAL + 0.6) * 1000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  const redX = GX + 5 * CS + CS / 2;
  return (
    <motion.g initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.3}}>
      <CellGrid x={GX} y={GY} size={GS} fill={cellColor} delay={cellDelay} />
      {/* red label + pointer */}
      <motion.g {...fadeUp(T_RED + 0.2)}>
        <text x={redX} y={58} fontFamily={FONT} fontSize={34} fontWeight={800} textAnchor="middle" fill={C.red}>
          −10 % от {money(4000)} = 400
        </text>
        <path d={`M ${redX} 70 L ${redX} ${GY - 8}`} stroke={C.red} strokeWidth={5} strokeLinecap="round" />
      </motion.g>
      <motion.text {...fadeUp(0.7)} x={GX + 2.2 * CS} y={GY + GS + 50} fontFamily={FONT} fontSize={34} fontWeight={800} textAnchor="middle" fill="#7D7568">
        −50 %
      </motion.text>
      <motion.text {...fadeUp(T_TEAL + 0.6)} x={GX + 8 * CS} y={GY + GS + 50} fontFamily={FONT} fontSize={36} fontWeight={900} textAnchor="middle" fill={C.teal}>
        платим {money(3600)}
      </motion.text>
      <motion.text {...fadeUp(T_TOTAL)} x={300} y={GY + GS + 112} fontFamily={FONT} fontSize={35} fontWeight={800} textAnchor="middle" fill={C.ink}>
        итого скидка <tspan fill={C.red} fontWeight={900}>55 %</tspan>
        <tspan fill={C.ink} opacity={0.5} fontWeight={700}>, а не 60 %</tspan>
      </motion.text>
    </motion.g>
  );
};

/** the shop: jacket with −50 % and a till that adds −10 % */
const Shop: React.FC<{gone: boolean}> = ({gone}) => (
  <motion.g
    animate={gone ? {opacity: 0, scale: 0.9} : {opacity: 1, scale: 1}}
    transition={{type: 'spring', stiffness: 220, damping: 24}}
    style={{transformOrigin: '300px 300px'}}
  >
    <Jacket x={205} y={330} s={0.72} />
    <PriceTag x={300} y={410} s={0.56} text={money(8000)} strike={1} />
    <motion.g initial={{scale: 0, rotate: -40}} animate={{scale: 1, rotate: 0}} transition={{type: 'spring', stiffness: 260, damping: 13, delay: 0.25}} style={{transformOrigin: '100px 175px'}}>
      <Sticker x={100} y={175} r={74} text="" />
      <text x={100} y={175 + 14} fontFamily={FONT} fontSize={40} fontWeight={900} textAnchor="middle" fill={C.white} transform="rotate(-14 100 175)">−50%</text>
    </motion.g>
    <Terminal x={485} y={365} s={0.55} screen="−10%" />
    <motion.g initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{type: 'spring', stiffness: 260, damping: 18, delay: 0.6}}>
      <Bubble x={485} y={225} w={170} text="ещё −10 %!" />
    </motion.g>
  </motion.g>
);

const Stage: React.FC = () => {
  const api = useTask();
  const [pick, setPick] = useState<number | null>(null);
  const checked = api.status !== 'answering';
  const value = api.status === 'revealed' ? RIGHT : pick;

  api.useCheck(pick !== null, () => pick === RIGHT);

  return (
    <Split ratio="1.1fr 1fr">
      <StageSvg w={600} h={600}>
        <Shop gone={checked} />
        <AnimatePresence>{checked && <Proof key="proof" />}</AnimatePresence>
      </StageSvg>

      <div className="stage-panel">
        <div className="proc-chain" aria-label="8 000, скидка 50 %, на кассе ещё 10 %">
          <span>{money(8000)}</span>
          <i>·</i>
          <span className="is-red">−50 %</span>
          <i>·</i>
          <span className="is-ink">−10 %</span>
          <i className="proc-chain__end">=</i>
          <span className={`proc-chain__end ${checked ? 'is-teal' : ''}`}>{checked ? money(3600) : '?'}</span>
        </div>
        <Choice options={OPTIONS.map(money)} value={value} onChange={setPick} status={api.status} correct={RIGHT} columns={2} />
      </div>
    </Split>
  );
};

export const till: TaskDef = {
  id: 'till',
  kind: 'Касса',
  title: 'Сколько заплатим на кассе?',
  hint: 'Вторая скидка считается не от 8\u00A0000, а от новой цены.',
  explain: 'После −50\u00A0% куртка стоит 4\u00A0000. 10\u00A0% от 4\u00A0000 — это 400, значит платим 3\u00A0600. Вся скидка — 55\u00A0%, а не 60\u00A0%.',
  xp: 30,
  replay: 's05_trap',
  Stage,
};
