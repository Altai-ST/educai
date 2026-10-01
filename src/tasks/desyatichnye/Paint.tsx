import React, {useRef, useState} from 'react';
import {C} from '../../art/kit';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {GridPainter, Split, StageSvg, countCells, emptyCells} from '../kit';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';
import {DecNum, fromHundredths, plural} from './art';

const TARGET = 37;
const answerCells = () => Array.from({length: 100}, (_, i) => i < TARGET);

const Stage: React.FC = () => {
  const api = useTask();
  const svg = useRef<SVGSVGElement>(null);
  const [cells, setCells] = useState(emptyCells);
  const revealed = api.status === 'revealed';
  const shown = revealed ? answerCells() : cells;
  const n = countCells(shown);
  const cols = Math.floor(n / 10);
  const rest = n % 10;
  const locked = api.status !== 'answering';

  api.useCheck(countCells(cells) > 0, () => countCells(cells) === TARGET);

  const clear = () => {
    setCells(emptyCells());
    sfx('whoosh', {vol: 0.35});
  };
  const tone = api.status === 'right' || revealed ? 'right' : api.status === 'wrong' ? 'wrong' : 'ink';

  return (
    <Split ratio="1fr 1fr">
      <StageSvg ref={svg} w={560} h={540}>
        <GridPainter cells={shown} onChange={setCells} status={api.status} svgRef={svg} base={C.mustard} color={C.teal} x={70} y={80} size={420} />
      </StageSvg>

      <div className="stage-panel">
        <div className="target-chip">
          цель <b className="num">0,37</b>
        </div>
        <DecNum v={fromHundredths(n)} labels tone={tone} />
        <p className="des-line">
          <b className="t num">{cols}</b> {plural(cols, 'столбец', 'столбца', 'столбцов')} и <b className="r num">{rest}</b> {plural(rest, 'клетка', 'клетки', 'клеток')}
        </p>
        <button className="des-ghost" onClick={clear} disabled={locked || n === 0}>
          <Icon name="undo" size={18} /> Стереть
        </button>
        <p className="stage-note"><Icon name="bulb" size={16} /> Проводи по клеткам. Стрелка над столбцом закрашивает его целиком</p>
      </div>
    </Split>
  );
};

export const paint: TaskDef = {
  id: 'paint',
  kind: 'Закрась',
  title: 'Закрась 0,37 квадрата',
  hint: 'Столбец — одна десятая, клетка — одна сотая. Сколько десятых и сотых в 0,37?',
  explain: '0,37 — это 3 десятых и 7 сотых: 3 полных столбца и ещё 7 клеток, всего 37 клеток из 100.',
  xp: 20,
  replay: 's04_places',
  Stage,
};
