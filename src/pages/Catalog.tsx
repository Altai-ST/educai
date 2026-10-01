import {useMemo} from 'react';
import {useSearchParams} from 'react-router-dom';
import {AnimatePresence, motion} from 'motion/react';
import {GRADES, SUBJECTS, TOPICS, plural, subjectById} from '../data/catalog';
import {useProgress} from '../lib/store';
import {topicProgress, type StageState} from '../lib/topicProgress';
import {TopicCard} from '../ui/Cards';
import {SplitText} from '../ui/Reveal';
import {Icon} from '../ui/Icon';
import {sfx} from '../lib/sound';

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
const STATES: {id: '' | StageState; label: string}[] = [
  {id: '', label: 'Все'},
  {id: 'new', label: 'С видео'},
  {id: 'wip', label: 'В процессе'},
  {id: 'done', label: 'Пройдено'},
  {id: 'soon', label: 'Скоро'},
];

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const p = useProgress();
  const subject = params.get('predmet') ?? '';
  const grade = Number(params.get('klass') ?? 0);
  const state = (params.get('status') ?? '') as '' | StageState;
  const q = params.get('q') ?? '';

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, {replace: true, preventScrollReset: true});
    sfx('tick', {vol: 0.4});
  };

  const list = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return TOPICS.filter((t) => {
      if (subject && t.subject !== subject) return false;
      if (grade && t.grade !== grade) return false;
      const st = topicProgress(p, t).state;
      if (state === 'new' ? st === 'soon' : state && st !== state) return false;
      if (words.length) {
        const hay = norm(`${t.title} ${t.hook} ${t.blurb} ${t.section} ${subjectById(t.subject)?.title} ${t.stages.map((s) => s.title).join(' ')}`);
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    }).sort((a, b) => Number(topicProgress(p, b).state !== 'soon') - Number(topicProgress(p, a).state !== 'soon') || a.grade - b.grade);
  }, [subject, grade, state, q, p]);

  const subj = subjectById(subject);
  return (
    <div className="catalog2">
      <section className="page-top dark">
        <div className="gridbg" aria-hidden />
        <div className="wrap">
          <span className="eyebrow" style={{['--eyebrow' as string]: subj?.color}}>Каталог</span>
          <SplitText as="h1" className="display h1" text={subj ? subj.title : grade ? `${grade} класс` : 'Все темы'} key={subject + grade} />
          <div className="csearch">
            <Icon name="search" size={20} />
            <input value={q} onChange={(e) => set('q', e.target.value)} placeholder="Поиск по темам, разделам и этапам" aria-label="Поиск" />
            {q && (
              <button onClick={() => set('q', '')} aria-label="Очистить">
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="filters2">
        <div className="wrap">
          <div className="frow">
            <span className="frow__l">Предмет</span>
            <div className="frow__items">
              <button className={`pill ${!subject ? 'is-on' : ''}`} onClick={() => set('predmet', '')}>Все</button>
              {SUBJECTS.map((s) => (
                <button key={s.id} className={`pill ${subject === s.id ? 'is-on' : ''}`} style={{['--c' as string]: s.color}} onClick={() => set('predmet', subject === s.id ? '' : s.id)}>
                  <i /> {s.short}
                </button>
              ))}
            </div>
          </div>
          <div className="frow">
            <span className="frow__l">Класс</span>
            <div className="frow__items">
              <button className={`pill pill--num ${!grade ? 'is-on' : ''}`} onClick={() => set('klass', '')}>Все</button>
              {GRADES.map((g) => (
                <button key={g} className={`pill pill--num num ${grade === g ? 'is-on' : ''}`} onClick={() => set('klass', grade === g ? '' : String(g))}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="frow">
            <span className="frow__l">Статус</span>
            <div className="frow__items">
              {STATES.map((s) => (
                <button key={s.id} className={`pill ${state === s.id ? 'is-on' : ''}`} onClick={() => set('status', s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop: 40}}>
        <div className="wrap">
          <p className="ccount muted num">
            {list.length} {plural(list.length, 'тема', 'темы', 'тем')}
          </p>
          <motion.div layout className="cgrid">
            <AnimatePresence mode="popLayout">
              {list.map((t) => (
                <motion.div key={t.id} layout initial={{opacity: 0, scale: 0.96}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.96}} transition={{duration: 0.35}}>
                  <TopicCard topic={t} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {list.length === 0 && (
            <div className="cempty">
              <b>Ничего не нашлось</b>
              <p className="muted">Попробуй убрать фильтры или поискать другое слово.</p>
              <button className="btn btn--ghost btn--sm" onClick={() => setParams({}, {replace: true})}>
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
