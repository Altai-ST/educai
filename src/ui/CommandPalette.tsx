import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {useWipeNavigate} from './TLink';
import {fmtTime} from '../data/videos';
import {SUBJECTS, TOPICS, stageVideo, subjectById, topicUrl} from '../data/catalog';
import {Icon} from './Icon';
import {sfx} from '../lib/sound';
import {lockScroll} from '../lib/scroll';

let openFn: () => void = () => {};
export const openPalette = () => openFn();

type Item = {id: string; group: string; title: string; sub?: string; to: string; icon: string; hay: string};
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[«»"„“.,!?:;—–-]/g, ' ');

function buildIndex(): Item[] {
  const items: Item[] = [
    {id: 'p-predmety', group: 'Разделы', title: 'Все предметы', to: '/predmety', icon: 'grid', hay: 'предметы все'},
    {id: 'p-katalog', group: 'Разделы', title: 'Каталог тем', sub: 'фильтр по предмету и классу', to: '/katalog', icon: 'list', hay: 'каталог темы уроки'},
    {id: 'p-progress', group: 'Разделы', title: 'Мой прогресс', sub: 'XP, уровень, награды', to: '/progress', icon: 'user', hay: 'прогресс профиль награды уровень xp'},
  ];
  for (const s of SUBJECTS) items.push({id: `s-${s.id}`, group: 'Предметы', title: s.title, sub: `${s.grades[0]}–${s.grades[1]} класс`, to: `/predmet/${s.id}`, icon: 'grid', hay: norm(`${s.title} ${s.blurb}`)});
  for (const t of TOPICS) {
    const subj = subjectById(t.subject)!;
    items.push({id: `t-${t.id}`, group: 'Темы', title: t.title, sub: `${subj.title} · ${t.grade} класс`, to: topicUrl(t), icon: 'play', hay: norm(`${t.title} ${t.hook} ${t.section} ${subj.title} ${t.grade} класс ${t.stages.map((s) => s.title).join(' ')}`)});
    t.stages.forEach((st, k) => {
      const v = stageVideo(st);
      if (!v) return;
      const base = topicUrl(t, st.id);
      for (const c of v.chapters) items.push({id: `c-${st.id}-${c.id}`, group: 'Главы видео', title: c.title, sub: `${t.title} · этап ${k + 1} · ${fmtTime(c.t)}`, to: `${base}?t=${c.t.toFixed(1)}`, icon: 'list', hay: norm(`${c.title} ${st.title}`)});
      for (const l of v.lines) items.push({id: `l-${st.id}-${l.id}`, group: 'Фразы из видео', title: l.text, sub: `${st.title} · ${fmtTime(l.t)}`, to: `${base}?t=${l.t.toFixed(1)}`, icon: 'cc', hay: norm(l.text)});
    });
  }
  return items;
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const nav = useWipeNavigate();
  const input = useRef<HTMLInputElement>(null);
  const index = useMemo(buildIndex, []);

  openFn = () => {
    setOpen(true);
    sfx('pop', {vol: 0.4});
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') setOpen(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    lockScroll(open);
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => input.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    const list = words.length ? index.filter((it) => words.every((w) => it.hay.includes(w) || norm(it.title).includes(w))) : index.filter((it) => it.group === 'Разделы' || it.group === 'Предметы');
    return list.slice(0, 40);
  }, [q, index]);

  const go = (it: Item) => {
    setOpen(false);
    nav(it.to);
  };

  let lastGroup = '';
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="cmdk" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <motion.div
            className="cmdk__box"
            role="dialog"
            aria-label="Поиск"
            initial={{opacity: 0, y: -20, scale: 0.96, filter: 'blur(8px)'}}
            animate={{opacity: 1, y: 0, scale: 1, filter: 'blur(0px)'}}
            exit={{opacity: 0, y: -10, scale: 0.98}}
            transition={{type: 'spring', stiffness: 380, damping: 30}}
          >
            <div className="cmdk__input">
              <Icon name="search" size={22} />
              <input
                ref={input}
                value={q}
                placeholder="Предмет, тема или фраза из видео… например «фотосинтез»"
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSel((s) => Math.min(results.length - 1, s + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSel((s) => Math.max(0, s - 1));
                  } else if (e.key === 'Enter' && results[sel]) go(results[sel]);
                }}
              />
              <kbd>Esc</kbd>
            </div>
            <div className="cmdk__list" data-lenis-prevent>
              {results.length === 0 && <div className="cmdk__empty">Ничего не нашлось. Попробуй «дроби», «Ньютон» или «Present Simple».</div>}
              {results.map((it, i) => {
                const head = it.group !== lastGroup ? (lastGroup = it.group) : null;
                return (
                  <React.Fragment key={it.id}>
                    {head && <div className="cmdk__group">{head}</div>}
                    <button className={`cmdk__item ${i === sel ? 'is-sel' : ''}`} onMouseMove={() => setSel(i)} onClick={() => go(it)}>
                      <span className="cmdk__ic"><Icon name={it.icon} size={18} /></span>
                      <span className="cmdk__txt">
                        <b>{it.title}</b>
                        {it.sub && <small>{it.sub}</small>}
                      </span>
                      <Icon name="arrow" size={18} className="cmdk__go" />
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="cmdk__foot muted">
              <span><kbd>↑</kbd><kbd>↓</kbd> выбрать</span>
              <span><kbd>Enter</kbd> открыть</span>
              <span>Ищет даже по словам из видео</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
