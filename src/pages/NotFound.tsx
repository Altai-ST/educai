import {TLink} from '../ui/TLink';
import {Dec} from '../ui/Frac';

export default function NotFound() {
  return (
    <section className="nf dark">
      <div className="sunburst" aria-hidden />
      <div className="nf__in">
        <div className="nf__big display">
          <Dec v="4,04" />
        </div>
        <h1 className="display h3">Такой страницы нет. Даже после запятой.</h1>
        <TLink to="/" className="btn btn--mustard">
          На главную <span className="arrow">→</span>
        </TLink>
      </div>
    </section>
  );
}
