import {SUBJECTS} from '../data/catalog';
import {SubjectTile} from '../ui/Cards';
import {Reveal, SplitText} from '../ui/Reveal';

export default function Subjects() {
  return (
    <div>
      <section className="page-top dark">
        <div className="gridbg" aria-hidden />
        <div className="wrap">
          <span className="eyebrow">1–11 класс</span>
          <SplitText as="h1" className="display h1" text="Предметы" />
          <p className="lead muted">Выбери предмет — внутри темы по классам и разделам школьной программы.</p>
        </div>
      </section>
      <section className="section" style={{paddingTop: 60}}>
        <div className="wrap subj-grid">
          {SUBJECTS.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 0.06}>
              <SubjectTile subject={s} big />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
