import React from 'react';
import {GRADES, SUBJECTS} from '../data/catalog';
import {Logo} from './Logo';
import {TLink} from './TLink';

export const Footer: React.FC = () => (
  <footer className="ftr dark">
    <div className="gridbg" aria-hidden />
    <div className="wrap ftr__in">
      <div className="ftr__big display" aria-hidden>
        Понятно<span style={{color: 'var(--lime)'}}>.</span>
        <br />
        По этапам<span style={{color: 'var(--brand)'}}>.</span>
      </div>
      <div className="ftr__grid">
        <div>
          <Logo />
          <p className="muted" style={{marginTop: 16, maxWidth: 320}}>
            Короткие видео и интерактивные задания по школьной программе с 1 по 11 класс.
          </p>
        </div>
        <div>
          <h4>Предметы</h4>
          {SUBJECTS.slice(0, 6).map((s) => (
            <TLink key={s.id} to={`/predmet/${s.id}`}>{s.title}</TLink>
          ))}
          <TLink to="/predmety">Все предметы →</TLink>
        </div>
        <div>
          <h4>Классы</h4>
          <div className="ftr__grades">
            {GRADES.map((g) => (
              <TLink key={g} to={`/katalog?klass=${g}`} className="num">{g}</TLink>
            ))}
          </div>
        </div>
        <div>
          <h4>Горячие клавиши</h4>
          <span className="muted"><kbd>Ctrl K</kbd> поиск</span>
          <span className="muted"><kbd>Пробел</kbd> пауза видео</span>
          <span className="muted"><kbd>1–4</kbd> выбор ответа</span>
          <span className="muted"><kbd>Enter</kbd> проверить</span>
        </div>
      </div>
      <div className="ftr__bottom muted">
        <span>© {new Date().getFullYear()} За минуту</span>
        <span>Образовательная платформа для школьников</span>
      </div>
    </div>
  </footer>
);
