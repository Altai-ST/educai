import {useState} from 'react';
import {motion} from 'motion/react';
import {TOPICS, isLive, subjectById, topicUrl, plural} from '../data/catalog';
import {VIDEOS} from '../data/videos';
import {TASKS} from '../tasks/registry';
import {topicProgress, STATE_LABEL} from '../lib/topicProgress';
import {BADGES} from '../data/badges';
import {LEVELS, levelOf, resetProgress, streakOf, useProgress} from '../lib/store';
import {SplitText, Reveal} from '../ui/Reveal';
import {TLink} from '../ui/TLink';
import {Icon} from '../ui/Icon';
import {Ring} from '../ui/Ring';
import {sfx} from '../lib/sound';

export default function ProgressPage() {
  const p = useProgress();
  const lv = levelOf(p.xp);
  const streak = streakOf(p.days);
  const solved = Object.values(p.tasks).reduce((a, t) => a + Object.keys(t).length, 0);
  const totalTasks = Object.values(TASKS).reduce((a, t) => a + t.length, 0);
  const videos = VIDEOS.filter((v) => (p.watched[v.slug] ?? 0) >= 0.9).length;
  const started = TOPICS.filter(isLive);
  const [confirm, setConfirm] = useState(false);
  const R = 120;
  const C = 2 * Math.PI * R;
  const days = Array.from({length: 28}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const iso = d.toISOString().slice(0, 10);
    return {iso, on: p.days.includes(iso), today: i === 27, wd: d.getDay()};
  });

  return (
    <div className="prog">
      <section className="page-top dark prog__top">
        <div className="sunburst" aria-hidden />
        <div className="wrap prog__hero">
          <div>
            <span className="eyebrow">Мой прогресс</span>
            <SplitText as="h1" className="display h1" text={lv.name} />
            <p className="lead muted">
              {lv.nextName ? (
                <>До уровня «{lv.nextName}» — <b className="num" style={{color: 'var(--mustard)'}}>{lv.to - p.xp} XP</b>. Задание с первой попытки и без подсказки даёт полный опыт.</>
              ) : (
                <>Максимальный уровень. Ты прошёл всё, что у нас есть, — новые уроки уже в работе.</>
              )}
            </p>
          </div>
          <motion.div className="prog__ring" initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{type: 'spring', stiffness: 120, damping: 16, delay: 0.2}}>
            <svg viewBox="0 0 300 300">
              <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(243,235,221,.1)" strokeWidth="22" />
              <motion.circle cx="150" cy="150" r={R} fill="none" stroke="var(--lime)" strokeWidth="22" strokeLinecap="round" strokeDasharray={C} initial={{strokeDashoffset: C}} animate={{strokeDashoffset: C * (1 - lv.t)}} transition={{duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.4}} transform="rotate(-90 150 150)" />
            </svg>
            <div className="prog__ring-in">
              <small>уровень</small>
              <b className="num">{lv.index}</b>
              <span className="num">{p.xp} XP</span>
            </div>
          </motion.div>
        </div>
        <div className="wrap">
          <div className="prog__levels">
            {LEVELS.map((l, i) => (
              <div key={l.name} className={`prog__lvl ${i + 1 <= lv.index ? 'is-on' : ''} ${i + 1 === lv.index ? 'is-cur' : ''}`}>
                <span className="num">{i + 1}</span>
                <b>{l.name}</b>
                <small className="num">{l.xp} XP</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop: 70}}>
        <div className="wrap">
          <div className="prog__stats">
            {[
              {v: p.xp, l: 'опыта набрано', icon: 'bolt', c: '#F2B705'},
              {v: streak, l: plural(streak, 'день подряд', 'дня подряд', 'дней подряд'), icon: 'flame', c: '#FF5B3A'},
              {v: `${solved}/${totalTasks}`, l: 'заданий решено', icon: 'check', c: '#12B886'},
              {v: `${videos}/${VIDEOS.length}`, l: 'видео досмотрено', icon: 'play', c: '#00A6FF'},
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="pstat">
                  <span className="pstat__ic" style={{background: s.c}}><Icon name={s.icon} size={20} /></span>
                  <b className="num">{s.v}</b>
                  <span className="muted">{s.l}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="prog__cols">
            <div>
              <h2 className="display h3 prog__h">Мои темы</h2>
              <div className="prog__topics">
                {started.map((t) => {
                  const tp = topicProgress(p, t);
                  const subj = subjectById(t.subject)!;
                  return (
                    <TLink key={t.id} to={topicUrl(t)} className="ptopic" style={{['--c' as string]: subj.color}}>
                      <span className="ptopic__g">{subj.glyph}</span>
                      <span className="ptopic__t">
                        <b>{t.title}</b>
                        <span className="muted num">{subj.title}, {t.grade} класс · {tp.done}/{t.stages.length} {plural(t.stages.length, 'этап', 'этапа', 'этапов')} · {tp.solved}/{tp.tasks} заданий · {STATE_LABEL[tp.state]}</span>
                        <span className="ptopic__stages">
                          {tp.stages.map((st, k) => (
                            <span key={k} title={t.stages[k].title}>
                              <motion.i initial={{scaleX: 0}} whileInView={{scaleX: st.t}} viewport={{once: true}} transition={{duration: 1, delay: k * 0.1, ease: [0.22, 1, 0.36, 1]}} />
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="ptopic__r"><Ring t={tp.t} color="var(--c)" size={40} /><small className="num">{Math.round(tp.t * 100)}%</small></span>
                    </TLink>
                  );
                })}
              </div>

              <h2 className="display h3 prog__h" style={{marginTop: 56}}>Активность</h2>
              <div className="cal">
                {days.map((d) => (
                  <span key={d.iso} className={`cal__d ${d.on ? 'is-on' : ''} ${d.today ? 'is-today' : ''}`} title={d.iso} />
                ))}
              </div>
              <p className="muted" style={{marginTop: 12, fontSize: 14}}>Последние 4 недели. Каждый день с уроком — закрашенная клетка, как в сетке из ста.</p>
            </div>

            <div>
              <h2 className="display h3 prog__h">Награды <span className="muted num" style={{fontSize: '0.6em'}}>{p.badges.length}/{BADGES.length}</span></h2>
              <div className="badges">
                {BADGES.map((b, i) => {
                  const on = p.badges.includes(b.id);
                  return (
                    <Reveal key={b.id} delay={i * 0.04}>
                      <div className={`badge ${on ? 'is-on' : ''}`}>
                        <span className="badge__g num" style={{background: on ? b.color : undefined}}>{on ? b.glyph : <Icon name="lock" size={20} />}</span>
                        <b>{b.title}</b>
                        <small className="muted">{b.text}</small>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="prog__reset">
            {confirm ? (
              <>
                <span>Стереть весь прогресс на этом устройстве?</span>
                <button className="btn btn--sm" style={{['--bg' as string]: 'var(--red)'}} onClick={() => { resetProgress(); setConfirm(false); sfx('hit', {vol: 0.5}); }}>Да, стереть</button>
                <button className="btn btn--sm btn--ghost" onClick={() => setConfirm(false)}>Отмена</button>
              </>
            ) : (
              <button className="prog__reset-b muted" onClick={() => setConfirm(true)}>
                <Icon name="undo" size={16} /> Сбросить прогресс
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
