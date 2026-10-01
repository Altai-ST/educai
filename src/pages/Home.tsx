import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion, useScroll, useTransform} from 'motion/react';
import {GRADES, SUBJECTS, TOPICS, isLive, plural, subjectById, topicUrl} from '../data/catalog';
import {FormulaField, type Formula} from '../ui/FormulaField';
import {SubjectTile, TopicCard} from '../ui/Cards';
import {Reveal, SplitText} from '../ui/Reveal';
import {TLink, useWipeNavigate} from '../ui/TLink';
import {Magnetic} from '../ui/Magnetic';
import {Icon} from '../ui/Icon';
import {useProgress} from '../lib/store';
import {topicProgress} from '../lib/topicProgress';

const ease = [0.22, 1, 0.36, 1] as const;

const FORMULAS: Formula[] = [
  {text: 'a²+b²=c²', color: '#FF5B3A', label: 'Математика · 8 класс · теорема Пифагора'},
  {text: 'H₂O', color: '#12B886', label: 'Химия · 8 класс · строение вещества'},
  {text: 'F=ma', color: '#00A6FF', label: 'Физика · 9 класс · законы Ньютона'},
  {text: 'Аа Бб', color: '#3D6BFF', label: 'Русский язык · 1 класс · звуки и буквы'},
  {text: 'DNA', color: '#6CC24A', label: 'Биология · 10 класс · наследственность'},
  {text: '½=0,5', color: '#FF5B3A', label: 'Математика · 5 класс · дроби'},
  {text: 'if/else', color: '#7C5CFF', label: 'Информатика · 6 класс · алгоритмы'},
];

const PROMPTS = ['дроби', 'фотосинтез', 'законы Ньютона', 'Present Simple', 'причастный оборот', 'часовые пояса'];

/* ───────── hero ───────── */
const Hero: React.FC = () => {
  const [fi, setFi] = useState(0);
  const [q, setQ] = useState('');
  const [ph, setPh] = useState('');
  const go = useWipeNavigate();
  const formulas = useMemo(() => FORMULAS, []);

  // typewriter placeholder
  useEffect(() => {
    let i = 0, k = 0, dir = 1, id = 0;
    const step = () => {
      const word = PROMPTS[i];
      k += dir;
      setPh(word.slice(0, k));
      let delay = dir > 0 ? 80 : 35;
      if (k === word.length) {
        dir = -1;
        delay = 1600;
      } else if (k === 0) {
        dir = 1;
        i = (i + 1) % PROMPTS.length;
        delay = 300;
      }
      id = window.setTimeout(step, delay);
    };
    id = window.setTimeout(step, 900);
    return () => clearTimeout(id);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    go(`/katalog${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <section className="hero2 dark">
      <div className="gridbg" aria-hidden />
      <div className="hero2__glow" style={{background: `radial-gradient(circle, ${FORMULAS[fi].color}40, transparent 60%)`}} aria-hidden />
      <FormulaField formulas={formulas} onChange={setFi} className="hero2__field" />
      <div className="wrap hero2__in">
        <div className="hero2__copy">
          <motion.div className="eyebrow" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}}>
            1–11 класс · {SUBJECTS.length} предметов
          </motion.div>
          <SplitText
            as="h1"
            className="display h1 hero2__title"
            text={'Всё\nшкольное\u00A0—\nпонятно.'}
            delay={0.15}
            stagger={0.08}
            render={(w) => (w === 'понятно.' ? <span className="hero2__mark">понятно.</span> : w)}
          />
          <motion.p className="lead hero2__lead" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.6, duration: 0.9, ease}}>
            Короткие видео и интерактивные задания по школьной программе. Каждая тема разбита на этапы: смотришь, пробуешь руками, идёшь дальше.
          </motion.p>
          <motion.form className="hsearch" onSubmit={submit} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.75, duration: 0.9, ease}}>
            <Icon name="search" size={22} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Что хочешь понять? ${ph}`} aria-label="Поиск темы" />
            <button className="btn btn--primary btn--sm" type="submit">
              Найти <span className="arrow">→</span>
            </button>
          </motion.form>
          <motion.div className="hgrades" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.95}}>
            <span className="muted">Мой класс:</span>
            {GRADES.map((g) => (
              <TLink key={g} to={`/katalog?klass=${g}`} className="hgrades__g num">
                {g}
              </TLink>
            ))}
          </motion.div>
        </div>
      </div>
      <div className="wrap hero2__caption">
        <AnimatePresence mode="wait">
          <motion.span key={fi} initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -8}} transition={{duration: 0.4}}>
            <i style={{background: FORMULAS[fi].color}} /> {FORMULAS[fi].label}
          </motion.span>
        </AnimatePresence>
        <span className="muted hero2__hint">наведи курсор на формулу</span>
      </div>
    </section>
  );
};

/* ───────── continue learning (only with progress) ───────── */
const Continue: React.FC = () => {
  const p = useProgress();
  const started = TOPICS.filter((t) => isLive(t)).map((t) => ({t, tp: topicProgress(p, t)})).filter((x) => x.tp.state === 'wip');
  if (!started.length) return null;
  const {t, tp} = started[0];
  const subj = subjectById(t.subject)!;
  const stage = t.stages[tp.current];
  return (
    <section className="wrap cont">
      <TLink to={topicUrl(t, stage.id)} className="cont__card" style={{['--c' as string]: subj.color}}>
        <span className="cont__ring num">{Math.round(tp.t * 100)}%</span>
        <span className="cont__txt">
          <small>Продолжить · {subj.title}, {t.grade} класс</small>
          <b>{t.title}</b>
          <span className="muted">Этап {tp.current + 1} из {t.stages.length}: {stage.title}</span>
        </span>
        <span className="btn btn--primary btn--sm">
          Продолжить <span className="arrow">→</span>
        </span>
      </TLink>
    </section>
  );
};

/* ───────── subjects bento ───────── */
const Subjects: React.FC = () => (
  <section className="section">
    <div className="wrap">
      <div className="sec-head sec-head--row">
        <div>
          <span className="eyebrow">Предметы</span>
          <SplitText className="display h2" text={'Одиннадцать предметов.\nОдин подход.'} />
        </div>
        <p className="lead muted">У каждого предмета свой цвет и свои темы по классам. Начни с любого — прогресс сохраняется.</p>
      </div>
      <div className="bento">
        {SUBJECTS.map((s, i) => (
          <Reveal key={s.id} delay={(i % 4) * 0.06} className={i === 0 ? 'bento__big' : ''}>
            <SubjectTile subject={s} big={i === 0} />
          </Reveal>
        ))}
        <Reveal delay={0.2}>
          <TLink to="/predmety" className="subj subj--all">
            <span className="subj__body">
              <b>Все предметы</b>
              <small>и темы по классам</small>
            </span>
            <span className="subj__go">
              <Icon name="arrow" size={18} />
            </span>
          </TLink>
        </Reveal>
      </div>
    </div>
  </section>
);

/* ───────── how a topic works: stages ───────── */
const STEPS = [
  {k: 'Видео', t: 'Короткое объяснение', d: 'Одна идея за пару минут. Главы на шкале, субтитры с подсветкой слов, поиск по фразам.', icon: 'play'},
  {k: 'Пауза', t: 'Вопрос посреди видео', d: 'Видео останавливается на самом интересном и спрашивает: «А ты как думаешь?»', icon: 'bulb'},
  {k: 'Задания', t: 'Практика в мире видео', d: 'Задания нарисованы в стиле ролика: те же предметы, цвета и герои — только теперь действуешь ты.', icon: 'grid'},
  {k: 'Дальше', t: 'Следующий этап', d: 'Тема складывается из этапов. Прошёл один — открывается следующий, а прогресс виден на карте темы.', icon: 'arrow'},
];

const HowStages: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const {scrollYProgress} = useScroll({target: ref, offset: ['start 70%', 'end 60%']});
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <section className="section dark how2" ref={ref}>
      <div className="gridbg" aria-hidden />
      <div className="wrap how2__in">
        <div className="how2__copy">
          <span className="eyebrow">Как устроена тема</span>
          <SplitText className="display h2" text={'Тема —\nэто несколько\nэтапов.'} />
          <p className="lead muted">Сложная тема не помещается в одно видео. Поэтому мы делим её на шаги: каждый этап — видео и задания к нему. Видео есть только внутри темы — там, где оно нужно.</p>
          <div className="how2__demo">
            {['Обыкновенные дроби', 'Десятичные дроби', 'Проценты'].map((s, i) => (
              <div key={s} className={`how2__chip ${i === 0 ? 'is-done' : i === 1 ? 'is-now' : ''}`}>
                <span className="num">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="how2__steps">
          <motion.span className="how2__line" style={{scaleY: line}} aria-hidden />
          {STEPS.map((s, i) => (
            <Reveal key={s.k} delay={i * 0.08} className="how2__step">
              <span className="how2__ic">
                <Icon name={s.icon} size={22} />
              </span>
              <div>
                <span className="how2__k num">0{i + 1} · {s.k}</span>
                <h3>{s.t}</h3>
                <p className="muted">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ───────── featured topics ───────── */
const Featured: React.FC = () => {
  const list = [...TOPICS.filter(isLive), ...TOPICS.filter((t) => !isLive(t) && t.isNew), ...TOPICS.filter((t) => !isLive(t) && !t.isNew)].slice(0, 7);
  return (
    <section className="section">
      <div className="wrap">
        <div className="sec-head sec-head--row">
          <div>
            <span className="eyebrow">Темы</span>
            <SplitText className="display h2" text={'Новое\nи на подходе.'} />
          </div>
          <TLink to="/katalog" className="btn btn--ghost">
            Весь каталог <span className="arrow">→</span>
          </TLink>
        </div>
        <div className="feat">
          {list.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.06} className={i === 0 ? 'feat__wide' : ''}>
              <TopicCard topic={t} wide={i === 0} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ───────── grades ───────── */
const Grades: React.FC = () => (
  <section className="section grades-sec">
    <div className="wrap">
      <div className="sec-head">
        <span className="eyebrow">Классы</span>
        <SplitText className="display h2" text={'С первого\nпо одиннадцатый.'} />
      </div>
      <div className="grades">
        {GRADES.map((g, i) => {
          const n = TOPICS.filter((t) => t.grade === g).length;
          const subjects = SUBJECTS.filter((s) => g >= s.grades[0] && g <= s.grades[1]);
          return (
            <Reveal key={g} delay={(i % 6) * 0.04}>
              <TLink to={`/katalog?klass=${g}`} className="grade" data-cursor={`${g} класс`}>
                <span className="grade__n display num">{g}</span>
                <span className="grade__t">
                  <b>{g} класс</b>
                  <small className="num">{subjects.length} {plural(subjects.length, 'предмет', 'предмета', 'предметов')} · {n} {plural(n, 'тема', 'темы', 'тем')}</small>
                </span>
                <span className="grade__dots" aria-hidden>
                  {subjects.map((s) => (
                    <i key={s.id} style={{background: s.color}} />
                  ))}
                </span>
              </TLink>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);

/* ───────── features ───────── */
const FEATURES = [
  {t: 'Поиск по словам из видео', d: 'Вспомнил фразу — найдёшь момент. Ctrl K и любое слово.', icon: 'search', c: '#6B4BFF'},
  {t: 'Подсказки без спойлеров', d: 'После ошибки — наводка, после второй — правильный ответ с объяснением.', icon: 'bulb', c: '#F2B705'},
  {t: 'Момент из видео', d: 'Забыл, как было? Одна кнопка — и видео перематывается к нужной сцене.', icon: 'replay', c: '#12B886'},
  {t: 'Опыт и награды', d: 'XP за задания, уровни, серии дней и награды. Всё видно в прогрессе.', icon: 'bolt', c: '#FF5B3A'},
];

const Features: React.FC = () => (
  <section className="section feats-sec">
    <div className="wrap">
      <div className="feats">
        {FEATURES.map((f, i) => (
          <Reveal key={f.t} delay={i * 0.07}>
            <div className="feat-card" style={{['--c' as string]: f.c}}>
              <span className="feat-card__ic">
                <Icon name={f.icon} size={22} />
              </span>
              <h3>{f.t}</h3>
              <p className="muted">{f.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ───────── final call ───────── */
const Cta: React.FC = () => {
  const live = TOPICS.find(isLive)!;
  return (
    <section className="cta2 dark">
      <div className="gridbg" aria-hidden />
      <div className="wrap cta2__in">
        <SplitText className="display h1" text={'Начни\nс одной темы.'} />
        <p className="lead muted">Сейчас открыта тема «{live.title}» — {live.stages.length} {plural(live.stages.length, "этап", "этапа", "этапов")} с видео и заданиями. Остальные темы появляются по мере съёмок.</p>
        <div className="cta2__btns">
          <Magnetic>
            <TLink to={topicUrl(live)} className="btn btn--primary">
              Открыть тему <span className="arrow">→</span>
            </TLink>
          </Magnetic>
          <Magnetic>
            <TLink to="/katalog" className="btn btn--ghost">
              Каталог
            </TLink>
          </Magnetic>
        </div>
      </div>
    </section>
  );
};

export const Home: React.FC = () => (
  <>
    <Hero />
    <Continue />
    <Subjects />
    <HowStages />
    <Featured />
    <Grades />
    <Features />
    <Cta />
  </>
);
