import React, {useState} from 'react';
import {useTask} from '../engine';
import {Matcher} from '../kit';
import {Dec, Frac} from '../../ui/Frac';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';
import {Pct} from './art';

const LEFT = [50, 25, 10, 1, 75].map((p) => ({id: `p${p}`, node: <Pct n={p} />}));
const RIGHT = [
  {id: 'half', node: <Frac n={1} d={2} />},
  {id: 'three-q', node: <Frac n={3} d={4} />},
  {id: 'tenth', node: <Dec v="0,1" />},
  {id: 'hundredth', node: <Frac n={1} d={100} />},
  {id: 'quarter', node: <Frac n={1} d={4} />},
];
const ANSWER: Record<string, string> = {p50: 'half', p25: 'quarter', p10: 'tenth', p1: 'hundredth', p75: 'three-q'};

const Stage: React.FC = () => {
  const api = useTask();
  const [pairs, setPairs] = useState<Record<string, string>>({});

  api.useCheck(Object.keys(pairs).length === LEFT.length, () => LEFT.every(({id}) => pairs[id] === ANSWER[id]));

  return (
    <div className="stage-center proc-match">
      <div className="proc-match__heads" aria-hidden>
        <span>проценты</span>
        <span>дроби</span>
      </div>
      <Matcher left={LEFT} right={RIGHT} pairs={pairs} onChange={setPairs} status={api.status} answer={ANSWER} />
      <p className="stage-note">
        <Icon name="bulb" size={16} /> Нажми на процент, потом — на его дробь
      </p>
    </div>
  );
};

export const match: TaskDef = {
  id: 'match',
  kind: 'Переведи',
  title: 'Соедини проценты с дробями',
  hint: 'Процент — это сотые: 25\u00A0% = 25⁄100. Сократи дробь.',
  explain: '50\u00A0% = ½, 25\u00A0% = ¼, 75\u00A0% = ¾, 10\u00A0% = 10⁄100 = 0,1, а 1\u00A0% = 1⁄100.',
  xp: 20,
  replay: 's03_what',
  Stage,
};
