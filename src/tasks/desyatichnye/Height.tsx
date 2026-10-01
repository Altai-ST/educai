import React, {useRef, useState} from 'react';
import {C, FONT} from '../../art/kit';
import {sfx} from '../../lib/sound';
import {useTask} from '../engine';
import {Split, StageSvg, useSvgDrag} from '../kit';
import {Icon} from '../../ui/Icon';
import type {TaskDef} from '../types';
import {DecNum, Figure, fromHundredths, useNarrow, useSpringNumber} from './art';

/** everything is in centimetres (hundredths of a metre) */
const TARGET = 162;
const MIN = 100;
const MAX = 200;
const START = 140;

const W = 600;
const FLOOR = 640;
const PX = 2.9; // viewBox units per cm
const yOf = (cm: number) => FLOOR - cm * PX;
const RX = 290; // ruler left edge
const RW = 46;
const PERSON_X = 150;
const TAG_X = 476;
const tickLabel = (cm: number) => (cm % 100 === 0 ? `${cm / 100} м` : `1,${(cm % 100) / 10}`);

const Ruler: React.FC<{part: 'body' | 'labels'; font?: number}> = ({part, font = 21}) => {
  const top = yOf(MAX) - 14;
  const one = yOf(100);
  if (part === 'labels')
    return (
      <g>
        {Array.from({length: 11}, (_, k) => (
          <text key={k} x={RX + RW + 12} y={yOf(MIN + k * 10) + font / 3} fontFamily={FONT} fontSize={font} fontWeight={800} fill={C.ink} stroke="#F3EBDD" strokeWidth={7} paintOrder="stroke" strokeLinejoin="round">
            {tickLabel(MIN + k * 10)}
          </text>
        ))}
      </g>
    );
  return (
    <g>
      <rect x={RX + 6} y={top + 8} width={RW} height={FLOOR - top} rx={8} fill={C.ink} opacity={0.12} />
      <rect x={RX} y={top} width={RW} height={FLOOR - top} rx={8} fill={C.white} stroke={C.ink} strokeWidth={4} />
      {/* the first metre — one solid block, like in the video */}
      <rect x={RX + 2} y={one} width={RW - 4} height={FLOOR - one - 2} fill={C.ink} />
      <text x={RX + RW / 2} y={(one + FLOOR) / 2} fontFamily={FONT} fontSize={20} fontWeight={800} fill={C.paper} textAnchor="middle" transform={`rotate(-90 ${RX + RW / 2} ${(one + FLOOR) / 2})`} dominantBaseline="middle">
        1 метр
      </text>
      {Array.from({length: MAX - MIN + 1}, (_, k) => {
        const cm = MIN + k;
        const y = yOf(cm);
        const major = cm % 10 === 0;
        const mid = cm % 5 === 0;
        const len = major ? 30 : mid ? 20 : 11;
        return <line key={cm} x1={RX} x2={RX + len} y1={y} y2={y} stroke={C.ink} strokeWidth={major ? 3.5 : mid ? 2.4 : 1.2} opacity={major || mid ? 1 : 0.55} />;
      })}
    </g>
  );
};

const Stage: React.FC = () => {
  const api = useTask();
  const svg = useRef<SVGSVGElement>(null);
  const [cm, setCm] = useState(START);
  const [touched, setTouched] = useState(false);
  const [kbd, setKbd] = useState(false);
  const narrow = useNarrow();
  const revealed = api.status === 'revealed';
  const locked = api.status !== 'answering';
  const v = revealed ? TARGET : cm;
  const y = useSpringNumber(yOf(v));

  api.useCheck(touched, () => cm === TARGET);

  const set = (next: number) => {
    const c = Math.max(MIN, Math.min(MAX, Math.round(next)));
    if (c === cm || locked) return;
    setCm(c);
    setTouched(true);
    sfx('tick', {vol: 0.35, rate: 0.8 + (c - MIN) / 200, throttle: 20});
  };
  const drag = useSvgDrag(svg, (p) => set((FLOOR - p.y) / PX), {
    disabled: locked,
    onStart: () => {
      setKbd(false);
      svg.current?.focus({preventScroll: true});
    },
  });
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setKbd(true);
      set(cm + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1));
    }
  };

  const tone = api.status === 'right' || revealed ? 'right' : api.status === 'wrong' ? 'wrong' : 'ink';
  const markColor = tone === 'right' ? C.green : C.red;
  const label = fromHundredths(v);

  return (
    <Split ratio="1fr 1fr">
      <StageSvg ref={svg} w={W} h={FLOOR + 20} tabIndex={0} onKeyDown={onKey} className="stage-svg des-focus des-tall" data-kbd={kbd || undefined} onKeyUp={(e) => e.key === 'Tab' && setKbd(true)} aria-label="Рост: стрелки вверх и вниз" role="slider" aria-valuemin={1} aria-valuemax={2} aria-valuenow={v / 100}>
        <g {...drag}>
          <rect x={0} y={0} width={W} height={FLOOR + 20} fill="transparent" />
          <line x1={20} x2={W - 20} y1={FLOOR} y2={FLOOR} stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
          <Figure x={PERSON_X} y={FLOOR} h={FLOOR - y} />
          <Ruler part="body" />
          {/* marker */}
          <line x1={PERSON_X - 60} x2={TAG_X - 50} y1={y} y2={y} stroke={markColor} strokeWidth={4} strokeDasharray="12 9" strokeLinecap="round" />
          <circle cx={RX} cy={y} r={7} fill={markColor} />
          <Ruler part="labels" font={narrow ? 28 : 21} />
          <g transform={`translate(${TAG_X} ${y})`}>
            <path d="M -52 0 L -36 -24 L 52 -24 Q 62 -24 62 -14 L 62 14 Q 62 24 52 24 L -36 24 Z" fill={markColor} />
            <text x={14} y={9} fontFamily={FONT} fontSize={26} fontWeight={900} fill={C.white} textAnchor="middle">
              {label}
            </text>
            {!locked && (
              <g fill={C.ink} opacity={0.55}>
                <path d="M 76 -6 l 8 -10 l 8 10 Z" />
                <path d="M 76 6 l 8 10 l 8 -10 Z" />
              </g>
            )}
          </g>
        </g>
      </StageSvg>

      <div className="stage-panel">
        <div className="target-chip">
          рост <b className="num" style={{textTransform: 'none'}}>1,62 м</b>
        </div>
        <div>
          <DecNum v={label} tone={tone} />
          <span className="stage-big" style={{fontSize: 'clamp(30px, 3.4vw, 48px)', marginLeft: 10, color: 'var(--muted)'}}>м</span>
        </div>
        <div className="stepper" aria-label="Рост">
          <button className="stepper__b" onClick={() => set(cm - 1)} disabled={locked || cm <= MIN} aria-label="Ниже на 0,01 м">−</button>
          <div className="stepper__v">
            <b className="num">0,01</b>
            <span>метра</span>
          </div>
          <button className="stepper__b" onClick={() => set(cm + 1)} disabled={locked || cm >= MAX} aria-label="Выше на 0,01 м">+</button>
        </div>
        <p className="stage-note"><Icon name="bulb" size={16} /> Тяни красную метку. Точно — стрелками ↑ ↓</p>
      </div>
    </Split>
  );
};

export const height: TaskDef = {
  id: 'height',
  kind: 'Измерь',
  title: 'Покажи рост 1,62 м',
  hint: 'До запятой — целые метры. Первая цифра после запятой — большие деления (десятые), вторая — мелкие (сотые).',
  explain: '1,62 м — это 1 целый метр, 6 десятых и 2 сотых: метка на втором мелком делении после 1,6.',
  xp: 25,
  replay: 's03_comma',
  Stage,
};
