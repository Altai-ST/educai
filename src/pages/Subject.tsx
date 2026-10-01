import {useParams} from 'react-router-dom';
import {motion} from 'motion/react';
import {plural, subjectById, topicsOf} from '../data/catalog';
import {TopicCard} from '../ui/Cards';
import {Reveal, SplitText} from '../ui/Reveal';
import {TLink} from '../ui/TLink';
import {Icon} from '../ui/Icon';
import NotFound from './NotFound';
import {scrollToEl} from '../lib/scroll';

export default function Subject() {
  const {id} = useParams();
  const s = subjectById(id);
  if (!s) return <NotFound />;
  const topics = topicsOf(s.id).sort((a, b) => a.grade - b.grade);
  const grades = [...new Set(topics.map((t) => t.grade))];
  return (
    <div className="subjpage" style={{['--c' as string]: s.color}}>
      <section className="page-top dark subjpage__top">
        <div className="gridbg" aria-hidden />
        <div className="subjpage__glow" aria-hidden />
        <motion.span className="subjpage__glyph display" initial={{opacity: 0, scale: 0.8, rotate: -8}} animate={{opacity: 1, scale: 1, rotate: 0}} transition={{duration: 1.1, ease: [0.22, 1, 0.36, 1]}} aria-hidden>
          {s.glyph}
        </motion.span>
        <div className="wrap">
          <nav className="crumbs" aria-label="Навигация">
            <TLink to="/predmety">Предметы</TLink>
            <Icon name="chev" size={14} />
            <span>{s.title}</span>
          </nav>
          <span className="eyebrow" style={{['--eyebrow' as string]: s.color}}>{s.grades[0]}–{s.grades[1]} класс</span>
          <SplitText as="h1" className="display h1" text={s.title} />
          <p className="lead muted">{s.blurb}</p>
          <div className="subjpage__jump">
            {grades.map((g) => (
              <a key={g} href={`#k${g}`} className="pill pill--num num" onClick={(e) => { e.preventDefault(); scrollToEl(`#k${g}`); }}>
                {g} класс
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="section" style={{paddingTop: 60}}>
        <div className="wrap">
          {grades.map((g) => {
            const list = topics.filter((t) => t.grade === g);
            return (
              <div key={g} id={`k${g}`} className="gradeblock">
                <div className="gradeblock__head">
                  <span className="gradeblock__n display num">{g}</span>
                  <div>
                    <h2 className="display h3">{g} класс</h2>
                    <span className="muted">{list.length} {plural(list.length, 'тема', 'темы', 'тем')} · {[...new Set(list.map((t) => t.section))].join(', ')}</span>
                  </div>
                </div>
                <div className="cgrid">
                  {list.map((t, i) => (
                    <Reveal key={t.id} delay={i * 0.05}>
                      <TopicCard topic={t} />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
