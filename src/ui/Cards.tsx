import React, {useRef} from 'react';
import {TLink} from './TLink';
import {Icon} from './Icon';
import {plural, subjectById, topicMinutes, topicUrl, topicsOf, type Subject, type Topic} from '../data/catalog';
import {useProgress} from '../lib/store';
import {STATE_LABEL, topicProgress} from '../lib/topicProgress';

/** pointer-following spotlight (sets --mx/--my on the element) */
export const useSpot = () => {
  const ref = useRef<HTMLElement | null>(null);
  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return {ref, onPointerMove};
};

export const TopicCard: React.FC<{topic: Topic; wide?: boolean}> = ({topic, wide}) => {
  const p = useProgress();
  const subj = subjectById(topic.subject)!;
  const tp = topicProgress(p, topic);
  const spot = useSpot();
  const n = topic.stages.length;
  return (
    <TLink
      to={topicUrl(topic)}
      ref={spot.ref as React.Ref<HTMLAnchorElement>}
      onPointerMove={spot.onPointerMove}
      className={`tcardx ${wide ? 'tcardx--wide' : ''} is-${tp.state}`}
      style={{['--c' as string]: subj.color}}
      data-cursor={tp.state === 'soon' ? 'Подробнее' : 'Открыть'}
    >
      <div className="tcardx__art" aria-hidden>
        <span className="tcardx__glyph">{subj.glyph}</span>
        <span className="tcardx__grade num">{topic.grade}</span>
      </div>
      <div className="tcardx__body">
        <div className="tcardx__meta">
          <span className="tcardx__subj">{subj.short}</span>
          <span>{topic.grade} класс</span>
          <span className={`tcardx__state s-${tp.state}`}>{topic.isNew && tp.state === 'new' ? 'Новинка' : STATE_LABEL[tp.state]}</span>
        </div>
        <h3 className="tcardx__title">{topic.title}</h3>
        <p className="tcardx__hook">{topic.hook}</p>
        <div className="tcardx__stages" aria-label={`${n} ${plural(n, 'этап', 'этапа', 'этапов')}`}>
          {tp.stages.map((s, i) => (
            <span key={i} className={`st-${s.state}`}>
              <i style={{transform: `scaleX(${s.t})`}} />
            </span>
          ))}
        </div>
        <div className="tcardx__foot">
          <span>
            <Icon name="list" size={16} /> {n} {plural(n, 'этап', 'этапа', 'этапов')}
          </span>
          <span>
            <Icon name="play" size={14} /> ~{topicMinutes(topic)} мин
          </span>
          {tp.tasks > 0 && (
            <span className="num">
              <Icon name="check" size={16} /> {tp.solved}/{tp.tasks}
            </span>
          )}
          <span className="tcardx__go">
            <Icon name="arrow" size={18} />
          </span>
        </div>
      </div>
    </TLink>
  );
};

export const SubjectTile: React.FC<{subject: Subject; big?: boolean}> = ({subject, big}) => {
  const spot = useSpot();
  const topics = topicsOf(subject.id);
  const live = topics.filter((t) => t.stages.some((s) => s.video)).length;
  return (
    <TLink
      to={`/predmet/${subject.id}`}
      ref={spot.ref as React.Ref<HTMLAnchorElement>}
      onPointerMove={spot.onPointerMove}
      className={`subj ${big ? 'subj--big' : ''}`}
      style={{['--c' as string]: subject.color}}
      data-cursor="Открыть"
    >
      <span className="subj__glyph">{subject.glyph}</span>
      <span className="subj__body">
        <b>{subject.title}</b>
        <small className="num">
          {topics.length} {plural(topics.length, 'тема', 'темы', 'тем')} · {subject.grades[0]}–{subject.grades[1]} класс
        </small>
        {big && <span className="subj__blurb">{subject.blurb}</span>}
      </span>
      {live > 0 && <span className="subj__live"><i /> есть видео</span>}
      <span className="subj__go">
        <Icon name="arrow" size={18} />
      </span>
    </TLink>
  );
};
