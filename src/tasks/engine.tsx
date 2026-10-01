import React, {createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import type {TaskApi, TaskDef, TaskStatus} from './types';
import {solveTask, useProgress} from '../lib/store';
import {sfx} from '../lib/sound';
import {burst, celebrate} from '../ui/confetti';
import {fmtTime, type Chapter} from '../data/videos';
import {Icon} from '../ui/Icon';
import {TLink} from '../ui/TLink';

type Ctx = TaskApi & {_register: (ready: boolean, check: () => boolean) => void};
const TaskCtx = createContext<Ctx | null>(null);

/** Inside a Stage: status, attempt, useCheck, finish. */
export function useTask(): TaskApi {
  const c = useContext(TaskCtx);
  if (!c) throw new Error('useTask outside TaskRunner');
  return c;
}

const ease = [0.22, 1, 0.36, 1] as const;

/** XP after hints / retries */
const reward = (xp: number, attempt: number, hint: boolean) => Math.max(2, Math.round(xp * (attempt === 0 ? 1 : attempt === 1 ? 0.6 : 0.35) * (hint ? 0.7 : 1)));

/** What the runner needs to know about the stage it belongs to. */
export type Unit = {key: string; chapters: Chapter[]; next?: {label: string; to: string}};

export const TaskRunner: React.FC<{unit: Unit; tasks: TaskDef[]; onReplay: (t: number) => void}> = ({unit, tasks, onReplay}) => {
  const progress = useProgress();
  const solved = progress.tasks[unit.key] ?? {};
  const firstUnsolved = Math.max(0, tasks.findIndex((t) => !(t.id in solved)));
  const [idx, setIdx] = useState(firstUnsolved);
  const [done, setDone] = useState(false);
  const [session, setSession] = useState<Record<string, {ok: boolean; xp: number}>>({});
  const task = tasks[idx];

  const go = (i: number) => {
    setDone(false);
    setIdx(Math.max(0, Math.min(tasks.length - 1, i)));
  };

  const onFinished = (ok: boolean, xp: number) => {
    setSession((s) => ({...s, [task.id]: {ok, xp}}));
  };
  const next = () => {
    if (idx + 1 < tasks.length) go(idx + 1);
    else {
      setDone(true);
      sfx('win', {vol: 0.7});
      celebrate();
    }
  };

  return (
    <div className="runner">
      <div className="runner__bar">
        <div className="runner__count">
          {done ? 'Итоги' : (
            <>
              Задание <b className="num">{idx + 1}</b> <span className="muted">из {tasks.length}</span>
            </>
          )}
        </div>
        <div className="runner__dots" role="tablist" aria-label="Задания">
          {tasks.map((t, i) => {
            const st = t.id in solved ? 'solved' : session[t.id] ? 'tried' : '';
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={i === idx && !done}
                aria-label={`Задание ${i + 1}: ${t.kind}`}
                className={`runner__dot ${st} ${i === idx && !done ? 'is-current' : ''}`}
                onClick={() => {
                  sfx('tick', {vol: 0.4});
                  go(i);
                }}
              >
                <span />
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div key="done" initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} transition={{duration: 0.5, ease}}>
            <Results unit={unit} tasks={tasks} solved={solved} onRestart={() => go(0)} />
          </motion.div>
        ) : (
          <motion.div key={task.id} initial={{opacity: 0, x: 60}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -60}} transition={{duration: 0.5, ease}}>
            <TaskCard
              unit={unit}
              task={task}
              index={idx}
              wasSolved={task.id in solved}
              onReplay={onReplay}
              onFinished={onFinished}
              onNext={next}
              isLast={idx + 1 === tasks.length}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TaskCard: React.FC<{
  unit: Unit; task: TaskDef; index: number; wasSolved: boolean; isLast: boolean;
  onReplay: (t: number) => void; onFinished: (ok: boolean, xp: number) => void; onNext: () => void;
}> = ({unit, task, index, wasSolved, isLast, onReplay, onFinished, onNext}) => {
  const [status, setStatus] = useState<TaskStatus>('answering');
  const [attempt, setAttempt] = useState(0);
  const [hint, setHint] = useState(false);
  const [ready, setReady] = useState(false);
  const [gained, setGained] = useState(0);
  const checkRef = useRef<() => boolean>(() => false);
  const cardRef = useRef<HTMLDivElement>(null);
  const checkBtn = useRef<HTMLButtonElement>(null);

  const _register = useCallback((r: boolean, check: () => boolean) => {
    checkRef.current = check;
    setReady((old) => (old === r ? old : r));
  }, []);

  const resolve = useCallback(
    (ok: boolean) => {
      const r = (checkBtn.current ?? cardRef.current)?.getBoundingClientRect();
      const at = r ? {x: r.left + r.width / 2, y: r.top + r.height / 2} : undefined;
      if (ok) {
        const xp = reward(task.xp, attempt, hint);
        const got = solveTask(unit.key, task.id, xp, attempt === 0 && !hint, at);
        setGained(got);
        setStatus('right');
        sfx('ding', {vol: 0.7});
        if (at) burst(at.x, at.y, 46, 0.8);
        onFinished(true, got);
      } else {
        setStatus('wrong');
        sfx('buzz', {vol: 0.5});
        cardRef.current?.animate(
          [{transform: 'translateX(0)'}, {transform: 'translateX(-10px)'}, {transform: 'translateX(9px)'}, {transform: 'translateX(-6px)'}, {transform: 'translateX(0)'}],
          {duration: 420, easing: 'ease-out'},
        );
      }
    },
    [attempt, hint, task, unit.key, onFinished],
  );

  const api: Ctx = useMemo(
    () => ({
      status,
      attempt,
      _register,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useCheck: (r: boolean, check: () => boolean) => useLayoutEffect(() => _register(r, check)),
      finish: (ok: boolean) => resolve(ok),
    }),
    [status, attempt, _register, resolve],
  );

  // keyboard: Enter = check / next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || (e.target as HTMLElement)?.tagName === 'BUTTON') return;
      if (status === 'answering' && ready && !task.selfCheck) resolve(checkRef.current());
      else if (status === 'right' || status === 'revealed') onNext();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [status, ready, task.selfCheck, resolve, onNext]);

  const chapter = task.replay ? unit.chapters.find((c) => c.id === task.replay) : undefined;
  const banner = status !== 'answering';

  return (
    <div className="tcard" ref={cardRef}>
      <div className="tcard__head">
        <div>
          <div className="tcard__kind">
            <span className="tcard__num num">{String(index + 1).padStart(2, '0')}</span>
            {task.kind}
            {wasSolved && <span className="tcard__solved"><Icon name="check" /> решено</span>}
          </div>
          <h3 className="tcard__title">{task.title}</h3>
        </div>
        <div className="tcard__xp">
          <b className="num">+{task.xp}</b> XP
        </div>
      </div>

      <div className={`tcard__stage status-${status}`}>
        <TaskCtx.Provider value={api}>
          <task.Stage />
        </TaskCtx.Provider>
      </div>

      <AnimatePresence>
        {hint && status === 'answering' && (
          <motion.div className="tcard__hint" initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}}>
            <div><Icon name="bulb" /> {task.hint}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {!banner && <div className="tcard__actions">
        <div className="tcard__tools">
          {status === 'answering' && (
            <button className="btn btn--sm btn--ghost" onClick={() => { setHint(true); sfx('pop', {vol: 0.4}); }} disabled={hint}>
              <Icon name="bulb" /> Подсказка <span className="muted" style={{fontWeight: 500}}>−30 % XP</span>
            </button>
          )}
          {chapter && (
            <button className="btn btn--sm btn--ghost" onClick={() => onReplay(chapter.t)} data-cursor="Смотреть">
              <Icon name="play" /> Момент из ролика <span className="muted num" style={{fontWeight: 500}}>{fmtTime(chapter.t)}</span>
            </button>
          )}
        </div>
        {!task.selfCheck && status === 'answering' && (
          <button ref={checkBtn} className="btn btn--primary tcard__check" disabled={!ready} onClick={() => resolve(checkRef.current())}>
            Проверить <span className="kbd">↵</span>
          </button>
        )}
      </div>}

      <AnimatePresence>
        {banner && (
          <motion.div
            className={`tcard__banner is-${status}`}
            initial={{y: 40, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 40, opacity: 0}}
            transition={{type: 'spring', stiffness: 260, damping: 26}}
          >
            <div className="tcard__verdict">
              <span className="tcard__badge">{status === 'right' ? <Icon name="check" /> : status === 'revealed' ? <Icon name="eye" /> : <Icon name="x" />}</span>
              <div>
                <b>{status === 'right' ? pick(RIGHT, task.id) : status === 'revealed' ? 'Вот правильный ответ' : pick(WRONG, task.id + attempt)}</b>
                <p>{status === 'wrong' ? task.hint : task.explain}</p>
              </div>
            </div>
            <div className="tcard__banner-actions">
              {status === 'right' && gained > 0 && <span className="xp-pop num">+{gained} XP</span>}
              {status === 'wrong' && attempt >= 1 && (
                <button className="btn btn--sm btn--ghost" onClick={() => { setStatus('revealed'); sfx('pop', {vol: 0.4}); onFinished(false, 0); }}>
                  Показать ответ
                </button>
              )}
              {status === 'wrong' ? (
                <button className="btn btn--sm btn--paper" onClick={() => { setAttempt((a) => a + 1); setStatus('answering'); sfx('click', {vol: 0.4}); }}>
                  Ещё раз
                </button>
              ) : (
                <button className="btn btn--sm btn--primary" onClick={onNext} autoFocus>
                  {isLast ? 'Итоги' : 'Дальше'} <span className="arrow">→</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RIGHT = ['Точно!', 'Верно!', 'Чисто!', 'В яблочко!', 'Отлично!', 'Так и есть!'];
const WRONG = ['Почти.', 'Не совсем.', 'Ещё чуть-чуть.', 'Мимо — но близко.'];
const pick = (arr: string[], seed: string) => arr[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % arr.length];

const Results: React.FC<{unit: Unit; tasks: TaskDef[]; solved: Record<string, number>; onRestart: () => void}> = ({unit, tasks, solved, onRestart}) => {
  const max = tasks.reduce((a, t) => a + t.xp, 0);
  const got = tasks.reduce((a, t) => a + (solved[t.id] ?? 0), 0);
  const n = tasks.filter((t) => t.id in solved).length;
  const stars = got >= max * 0.85 ? 3 : got >= max * 0.5 ? 2 : n > 0 ? 1 : 0;
  return (
    <div className="results">
      <div className="results__stars">
        {[0, 1, 2].map((k) => (
          <motion.svg key={k} viewBox="-50 -50 100 100" initial={{scale: 0, rotate: -40}} animate={{scale: 1, rotate: 0}} transition={{type: 'spring', delay: 0.2 + k * 0.18, stiffness: 300, damping: 14}}>
            <path
              d={Array.from({length: 10}, (_, j) => {
                const a = (j / 10) * Math.PI * 2;
                const rr = j % 2 ? 20 : 46;
                return `${j ? 'L' : 'M'} ${Math.sin(a) * rr} ${-Math.cos(a) * rr}`;
              }).join(' ') + ' Z'}
              fill={k < stars ? '#F4B23E' : 'rgba(29,26,43,.12)'}
              strokeLinejoin="round"
              stroke={k < stars ? '#F4B23E' : 'transparent'}
              strokeWidth={6}
            />
          </motion.svg>
        ))}
      </div>
      <h3 className="display h3">{stars === 3 ? 'Тема покорена.' : stars === 2 ? 'Хороший результат.' : 'Начало положено.'}</h3>
      <p className="lead muted" style={{margin: '14px auto 0'}}>
        Решено <b className="num">{n}</b> из {tasks.length} · набрано <b className="num">{got}</b> из {max} XP
      </p>
      <div className="results__actions">
        {unit.next ? (
          <TLink to={unit.next.to} className="btn btn--primary">
            {unit.next.label} <span className="arrow">→</span>
          </TLink>
        ) : (
          <TLink to="/progress" className="btn btn--primary">
            Мой прогресс <span className="arrow">→</span>
          </TLink>
        )}
        <button className="btn btn--ghost" onClick={onRestart}>
          Пройти ещё раз
        </button>
      </div>
    </div>
  );
};
