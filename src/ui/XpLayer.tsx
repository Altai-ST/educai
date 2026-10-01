import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {getProgress, grantBadge, levelOf, onBadge, onXp, useProgress} from '../lib/store';
import {sfx} from '../lib/sound';
import {celebrate} from './confetti';
import {BADGES, badgeById} from '../data/badges';

type Fly = {id: number; n: number; x: number; y: number; tx: number; ty: number};
type Toast = {id: number; kind: 'level' | 'badge'; title: string; sub: string; glyph: string; color: string};

/** Flying "+XP" chips, level-up and badge toasts. */
export const XpLayer: React.FC = () => {
  const [flies, setFlies] = useState<Fly[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const p = useProgress();
  const lastLevel = useRef(levelOf(getProgress().xp).index);
  const uid = useRef(0);

  useEffect(
    () =>
      onXp((n, at) => {
        const target = document.getElementById('xp-target')?.getBoundingClientRect();
        const x = at?.x ?? innerWidth / 2;
        const y = at?.y ?? innerHeight / 2;
        const id = ++uid.current;
        setFlies((f) => [...f, {id, n, x, y, tx: target ? target.left + 22 : innerWidth - 80, ty: target ? target.top + target.height / 2 : 30}]);
        setTimeout(() => {
          setFlies((f) => f.filter((q) => q.id !== id));
          const el = document.getElementById('xp-target');
          el?.animate([{transform: 'scale(1)'}, {transform: 'scale(1.18)'}, {transform: 'scale(1)'}], {duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)'});
          sfx('rise', {vol: 0.35});
        }, 1050);
      }),
    [],
  );

  const push = (t: Omit<Toast, 'id'>) => {
    const id = ++uid.current;
    setToasts((x) => [...x, {...t, id}]);
    setTimeout(() => setToasts((x) => x.filter((q) => q.id !== id)), 4600);
  };

  useEffect(
    () =>
      onBadge((id) => {
        const b = badgeById(id);
        if (!b) return;
        setTimeout(() => {
          push({kind: 'badge', title: b.title, sub: 'Новая награда · ' + b.text, glyph: b.glyph, color: b.color});
          sfx('stamp', {vol: 0.6});
        }, 1300);
      }),
    [],
  );

  // level-ups + badges are derived from progress
  useEffect(() => {
    const lv = levelOf(p.xp);
    if (lv.index > lastLevel.current) {
      lastLevel.current = lv.index;
      setTimeout(() => {
        push({kind: 'level', title: lv.name, sub: `Уровень ${lv.index}`, glyph: String(lv.index), color: 'var(--lime)'});
        sfx('win', {vol: 0.6});
        celebrate();
      }, 1200);
    }
    BADGES.forEach((b) => {
      if (!p.badges.includes(b.id) && b.test(p)) grantBadge(b.id);
    });
  }, [p]);

  return (
    <>
      <div className="xpfly-layer" aria-hidden>
        {flies.map((f) => (
          <motion.div
            key={f.id}
            className="xpfly num"
            initial={{x: f.x, y: f.y, scale: 0.4, opacity: 0}}
            animate={{
              x: [f.x, f.x + (f.tx - f.x) * 0.15, f.tx],
              y: [f.y, f.y - 120, f.ty],
              scale: [0.4, 1.25, 0.5],
              opacity: [0, 1, 0.9],
            }}
            transition={{duration: 1.05, times: [0, 0.35, 1], ease: [0.5, 0, 0.3, 1]}}
          >
            +{f.n} XP
          </motion.div>
        ))}
      </div>
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast toast--${t.kind}`}
              initial={{opacity: 0, y: 40, scale: 0.9}}
              animate={{opacity: 1, y: 0, scale: 1}}
              exit={{opacity: 0, x: 80}}
              transition={{type: 'spring', stiffness: 260, damping: 22}}
            >
              <span className="toast__glyph" style={{background: t.color}}>{t.glyph}</span>
              <span>
                <small>{t.kind === 'level' ? 'Новый уровень' : 'Награда'}</small>
                <b>{t.title}</b>
                <span className="toast__sub">{t.sub}</span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
