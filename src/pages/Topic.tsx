import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import {AnimatePresence, motion} from 'motion/react';
import {plural, stageKey, stageVideo, subjectById, topicById, topicMinutes, topicUrl, topicsOf, type Topic as TopicT} from '../data/catalog';
import {fmtTime} from '../data/videos';
import {TASKS} from '../tasks/registry';
import {TaskRunner} from '../tasks/engine';
import {VideoPlayer, type PlayerHandle} from '../player/VideoPlayer';
import {SidePanel} from '../player/Transcript';
import {toggleWish, useProgress} from '../lib/store';
import {topicProgress} from '../lib/topicProgress';
import {createBus, type Bus} from '../lib/bus';
import {scrollToEl} from '../lib/scroll';
import {sfx} from '../lib/sound';
import {Reveal, SplitText} from '../ui/Reveal';
import {TLink} from '../ui/TLink';
import {Icon} from '../ui/Icon';
import {Ring} from '../ui/Ring';
import {Tilt} from '../ui/Tilt';
import {TopicCard} from '../ui/Cards';
import NotFound from './NotFound';

const ease = [0.22, 1, 0.36, 1] as const;

export default function Topic() {
  const {id, stage: stageId} = useParams();
  const topic = topicById(id);
  const p = useProgress();
  // the player and its clock are shared by the video part and the tasks (for «Момент из видео»)
  const player = useRef<PlayerHandle>(null);
  const time = useMemo(() => createBus(0), [id, stageId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!topic) return <NotFound />;
  const subj = subjectById(topic.subject)!;
  const tp = topicProgress(p, topic);
  const si = Math.max(0, topic.stages.findIndex((s) => s.id === stageId));
  const stage = stageId ? topic.stages[si] : topic.stages[tp.current];
  const idx = topic.stages.indexOf(stage);
  const live = !!stageVideo(stage);

  return (
    <div className="topic" style={{['--c' as string]: subj.color}}>
      <section className="topic__top dark">
        <div className="gridbg" aria-hidden />
        <div className="topic__glow" aria-hidden />
        <div className="wrap topic__head">
          <nav className="crumbs" aria-label="Навигация">
            <TLink to="/katalog">Каталог</TLink>
            <Icon name="chev" size={14} />
            <TLink to={`/predmet/${subj.id}`}>{subj.title}</TLink>
            <Icon name="chev" size={14} />
            <TLink to={`/katalog?predmet=${subj.id}&klass=${topic.grade}`}>{topic.grade} класс</TLink>
          </nav>
          <div className="topic__title-row">
            <div>
              <span className="eyebrow" style={{['--eyebrow' as string]: subj.color}}>
                {subj.title} · {topic.grade} класс · {topic.section}
              </span>
              <SplitText as="h1" className="display topic__title" text={topic.title} delay={0.05} key={topic.id} />
              <motion.p className="lead muted" initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{delay: 0.35, duration: 0.8, ease}}>
                {topic.blurb}
              </motion.p>
            </div>
            <motion.div className="topic__sum" initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{delay: 0.45, duration: 0.8, ease}}>
              <div className="topic__ring">
                <Ring t={tp.t} color="var(--c)" size={92} />
                <b className="num">{Math.round(tp.t * 100)}%</b>
              </div>
              <ul>
                <li>
                  <b className="num">{topic.stages.length}</b> {plural(topic.stages.length, 'этап', 'этапа', 'этапов')}
                </li>
                <li>
                  <b className="num">~{topicMinutes(topic)}</b> мин видео
                </li>
                <li>
                  <b className="num">{tp.tasks || '—'}</b> {plural(tp.tasks, 'задание', 'задания', 'заданий')}
                </li>
              </ul>
            </motion.div>
          </div>

          {/* stage map */}
          <div className="smap" role="tablist" aria-label="Этапы темы">
            {topic.stages.map((s, i) => {
              const sp = tp.stages[i];
              const on = i === idx;
              return (
                <TLink
                  key={s.id}
                  to={topicUrl(topic, s.id)}
                  role="tab"
                  aria-selected={on}
                  className={`smap__st st-${sp.state} ${on ? 'is-on' : ''}`}
                  data-cursor={sp.live ? `Этап ${i + 1}` : 'Скоро'}
                  preventScrollReset
                >
                  <span className="smap__n num">{sp.state === 'done' ? <Icon name="check" size={18} stroke={3} /> : i + 1}</span>
                  <span className="smap__t">
                    <small>Этап {i + 1}{sp.state === 'soon' ? ' · скоро' : sp.state === 'done' ? ' · пройден' : sp.state === 'wip' ? ' · в процессе' : ''}</small>
                    <b>{s.title}</b>
                  </span>
                  <span className="smap__bar">
                    <i style={{transform: `scaleX(${sp.t})`}} />
                  </span>
                  {on && <motion.span layoutId="smap-on" className="smap__on" transition={{type: 'spring', stiffness: 380, damping: 34}} />}
                </TLink>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={stage.id} initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} transition={{duration: 0.5, ease}}>
            {live ? <StageVideo topic={topic} stageIndex={idx} player={player} time={time} /> : <StageSoon topic={topic} stageIndex={idx} />}
          </motion.div>
        </AnimatePresence>
      </section>

      {live && <StageBody key={stage.id} topic={topic} stageIndex={idx} player={player} time={time} />}

      <Related topic={topic} />
    </div>
  );
}

/* ───────── the video part of a stage (dark) ───────── */
type Shared = {player: React.RefObject<PlayerHandle | null>; time: Bus<number>};

const StageVideo: React.FC<{topic: TopicT; stageIndex: number} & Shared> = ({topic, stageIndex, player, time}) => {
  const stage = topic.stages[stageIndex];
  const video = stageVideo(stage)!;
  const key = stageKey(topic, stage);
  const [params] = useSearchParams();
  const tasks = TASKS[key] ?? [];

  const onTime = useCallback((x: number) => time.set(Math.round(x * 20) / 20), [time]);
  const seek = useCallback(
    (x: number, play = true) => {
      player.current?.seek(x, play);
      time.set(x);
    },
    [time, player],
  );

  useEffect(() => {
    const q = params.get('t');
    if (!q) return;
    const id = setTimeout(() => {
      scrollToEl('#player', -100);
      seek(Number(q), true);
    }, 450);
    return () => clearTimeout(id);
  }, [params, seek]);

  return (
    <div className="wrap stagev" id="player">
      <div className="stagev__head">
        <span className="stagev__k num">Этап {stageIndex + 1} из {topic.stages.length}</span>
        <h2 className="display h3">{stage.title}</h2>
        <span className="muted num">
          видео {fmtTime(video.duration)} · {video.chapters.length} глав · {tasks.length} {plural(tasks.length, 'задание', 'задания', 'заданий')}
        </span>
      </div>
      <div className="stagev__grid">
        <div className="stagev__player">
          <VideoPlayer ref={player} video={video} onTime={onTime} onEnded={() => setTimeout(() => scrollToEl('#praktika'), 1800)} />
        </div>
        <div className="stagev__side">
          <SidePanel video={video} time={time} onSeek={(x) => seek(x, true)} />
        </div>
      </div>
    </div>
  );
};

/* ───────── summary + tasks + next (light) ───────── */
const StageBody: React.FC<{topic: TopicT; stageIndex: number} & Shared> = ({topic, stageIndex, player, time}) => {
  const stage = topic.stages[stageIndex];
  const video = stageVideo(stage)!;
  const key = stageKey(topic, stage);
  const tasks = TASKS[key] ?? [];
  const next = topic.stages[stageIndex + 1];
  const replay = useCallback(
    (x: number) => {
      scrollToEl('#player', -100);
      setTimeout(() => {
        player.current?.seek(x, true);
        time.set(x);
      }, 550);
    },
    [player, time],
  );
  const unit = useMemo(
    () => ({
      key,
      chapters: video.chapters,
      next: next ? {label: `Этап ${stageIndex + 2}: ${next.title}`, to: topicUrl(topic, next.id)} : {label: 'Все темы', to: '/katalog'},
    }),
    [key, video.chapters, next, stageIndex, topic],
  );

  return (
    <>
      <section className="section stage-sum">
        <div className="wrap">
          <div className="sec-head sec-head--row">
            <div>
              <span className="eyebrow" style={{['--eyebrow' as string]: 'var(--c)'}}>Конспект этапа</span>
              <SplitText className="display h2" text={'Главное\nза 10 секунд.'} />
            </div>
          </div>
          <div className="summary">
            {video.summary.map((c, k) => (
              <Reveal key={k} delay={k * 0.1}>
                <Tilt className="summary__card">
                  <span className="summary__n num">0{k + 1}</span>
                  {/* the big formula is shown in the video's own font and colours */}
                  <div className="summary__big" style={{color: c.color}}>{c.big}</div>
                  <h3>{c.title}</h3>
                  <p className="muted">{c.text}</p>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section stage-practice" id="praktika">
        <div className="wrap">
          <div className="sec-head sec-head--row">
            <div>
              <span className="eyebrow" style={{['--eyebrow' as string]: 'var(--c)'}}>Практика · этап {stageIndex + 1}</span>
              <SplitText className="display h2" text={'Теперь —\nсам.'} />
            </div>
            <p className="lead muted">Задания нарисованы в стиле видео этого этапа. После промаха — подсказка, после второго — ответ. Кнопка «Момент из видео» перемотает ролик к нужной сцене.</p>
          </div>
          {tasks.length ? <TaskRunner unit={unit} tasks={tasks} onReplay={replay} /> : <p className="muted">Задания к этому этапу готовятся.</p>}
        </div>
      </section>

      {next && (
        <section className="nextstage dark">
          <div className="gridbg" aria-hidden />
          <TLink to={topicUrl(topic, next.id)} className="wrap nextstage__in" data-cursor="Дальше">
            <span className="eyebrow" style={{['--eyebrow' as string]: 'var(--c)'}}>Следующий этап · {stageIndex + 2} из {topic.stages.length}</span>
            <span className="display h2 nextstage__t">
              {next.title} <span className="nextstage__arrow">→</span>
            </span>
            <span className="muted">{stageVideo(next) ? `видео ${fmtTime(stageVideo(next)!.duration)} · ${(TASKS[stageKey(topic, next)] ?? []).length} заданий` : 'скоро'}</span>
          </TLink>
        </section>
      )}
    </>
  );
};

/* ───────── a stage without a video yet ───────── */
const StageSoon: React.FC<{topic: TopicT; stageIndex: number}> = ({topic, stageIndex}) => {
  const p = useProgress();
  const stage = topic.stages[stageIndex];
  const on = p.wishes.includes(topic.id);
  return (
    <div className="wrap stagesoon">
      <div className="stagesoon__card">
        <span className="stagesoon__badge">
          <Icon name="lock" size={16} /> Этап {stageIndex + 1} · скоро
        </span>
        <h2 className="display h2">{stage.title}</h2>
        <p className="lead muted">
          Видео и задания этого этапа ещё в работе. Здесь будет короткий ролик (~{stage.minutes ?? 2} мин), пауза-вопрос и задания в его стиле.
        </p>
        <div className="stagesoon__plan">
          {['Видео', 'Пауза-вопрос', 'Конспект', 'Задания'].map((x, i) => (
            <span key={x}>
              <i className="num">{i + 1}</i> {x}
            </span>
          ))}
        </div>
        <button
          className={`btn ${on ? 'btn--light' : 'btn--primary'}`}
          onClick={() => {
            toggleWish(topic.id);
            sfx(on ? 'tick' : 'pop', {vol: 0.5});
          }}
          aria-pressed={on}
        >
          <Icon name={on ? 'check' : 'bell'} size={18} /> {on ? 'Ты ждёшь эту тему' : 'Хочу эту тему'}
        </button>
      </div>
    </div>
  );
};

const Related: React.FC<{topic: TopicT}> = ({topic}) => {
  const list = topicsOf(topic.subject)
    .filter((t) => t.id !== topic.id)
    .sort((a, b) => Math.abs(a.grade - topic.grade) - Math.abs(b.grade - topic.grade))
    .slice(0, 3);
  if (!list.length) return null;
  return (
    <section className="section related">
      <div className="wrap">
        <div className="sec-head sec-head--row">
          <div>
            <span className="eyebrow" style={{['--eyebrow' as string]: 'var(--c)'}}>{subjectById(topic.subject)!.title}</span>
            <h2 className="display h2">Ещё по предмету</h2>
          </div>
          <TLink to={`/predmet/${topic.subject}`} className="btn btn--ghost">
            Все темы предмета <span className="arrow">→</span>
          </TLink>
        </div>
        <div className="cgrid">
          {list.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      </div>
    </section>
  );
};
