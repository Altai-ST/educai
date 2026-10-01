import React, {useRef, useState} from 'react';
import {motion} from 'motion/react';
import {C, FONT} from '../../art/kit';
import {useTask} from '../engine';
import {countCells, emptyCells, fmtNum, GridPainter, Readout, Split, StageSvg} from '../kit';
import {Dec, Frac} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';
import {Pct} from './art';

const TARGET = 35;
const ANSWER = Array.from({length: 100}, (_, i) => i < TARGET);

const Stage: React.FC = () => {
  const api = useTask();
  const svg = useRef<SVGSVGElement>(null);
  const [cells, setCells] = useState(emptyCells);
  const revealed = api.status === 'revealed';
  const shown = revealed ? ANSWER : cells;
  const n = countCells(shown);

  api.useCheck(countCells(cells) > 0, () => countCells(cells) === TARGET);

  const tone = api.status === 'right' || revealed ? 'right' : api.status === 'wrong' ? 'wrong' : 'ink';

  return (
    <Split ratio="1fr 1fr">
      <StageSvg ref={svg} w={500} h={560}>
        <GridPainter cells={shown} onChange={setCells} status={api.status} svgRef={svg} color={C.red} base={C.white} x={40} y={80} size={420} />
        <text x={250} y={550} fontFamily={FONT} fontSize={26} fontWeight={700} textAnchor="middle" fill={C.ink} opacity={0.55}>
          весь квадрат — 100 клеток
        </text>
      </StageSvg>

      <div className="stage-panel">
        <div className="target-chip">
          цель <b><Pct n={TARGET} /></b>
        </div>
        <Readout tone={tone} label={<>закрашено <b>{n}</b> из <b>100</b> клеток</>}>
          <motion.span key={n} initial={{y: 10, opacity: 0.4}} animate={{y: 0, opacity: 1}} transition={{type: 'spring', stiffness: 420, damping: 22}} style={{display: 'inline-block'}}>
            <Pct n={n} />
          </motion.span>
        </Readout>
        <div className="proc-eq" aria-label={`${n} процентов = ${n}/100`}>
          <span className="proc-eq__sign">=</span>
          <Frac n={n} d={100} />
          <span className="proc-eq__sign">=</span>
          <Dec v={fmtNum(n / 100)} />
        </div>
        <p className="stage-note">
          <Icon name="bulb" size={16} /> Проводи по клеткам. Стрелка сверху — весь столбик
        </p>
      </div>
    </Split>
  );
};

export const paint: TaskDef = {
  id: 'paint',
  kind: 'Закрась',
  title: 'Закрась 35\u00A0% квадрата',
  hint: '«Процент» — «на сотню». В квадрате 100 клеток, значит 1\u00A0% — это одна клетка.',
  explain: '35\u00A0% = 35⁄100 = 0,35 — из 100 клеток закрашено 35: три столбика по 10 и ещё 5.',
  xp: 20,
  replay: 's03_what',
  Stage,
};
