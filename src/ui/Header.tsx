import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {AnimatePresence, motion} from 'motion/react';
import {levelOf, toggleSound, useProgress} from '../lib/store';
import {sfx} from '../lib/sound';
import {Icon} from './Icon';
import {Logo} from './Logo';
import {TLink} from './TLink';
import {openPalette} from './CommandPalette';

export const XpRing: React.FC<{t: number; size?: number; level: number}> = ({t, size = 38, level}) => {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="xpring" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--lime)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - t)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)'}}
      />
      <text x="50%" y="50%" dy="0.36em" textAnchor="middle" fontSize={size * 0.36} fontWeight={900} fill="currentColor" fontFamily="Onest Variable">
        {level}
      </text>
    </svg>
  );
};

const NAV = [
  {to: '/predmety', label: 'Предметы', match: ['/predmety', '/predmet/']},
  {to: '/katalog', label: 'Каталог', match: ['/katalog', '/tema/']},
  {to: '/progress', label: 'Прогресс', match: ['/progress']},
];

export const Header: React.FC = () => {
  const p = useProgress();
  const lv = levelOf(p.xp);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => setMenu(false), [loc.pathname]);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 40);
    on();
    addEventListener('scroll', on, {passive: true});
    return () => removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`hdr ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="hdr__in">
        <TLink to="/" className="hdr__logo" aria-label="На главную">
          <Logo />
        </TLink>
        <nav className="hdr__nav" aria-label="Основное меню">
          {NAV.map((n) => (
            <TLink key={n.to} to={n.to} className={`hdr__link ${n.match.some((m) => loc.pathname.startsWith(m)) ? 'is-active' : ''}`}>
              {n.label}
            </TLink>
          ))}
        </nav>
        <div className="hdr__tools">
          <button className="hdr__search" onClick={openPalette} aria-label="Поиск">
            <Icon name="search" size={18} />
            <span>Найти</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button
            className="hdr__icon"
            onClick={() => {
              toggleSound();
              setTimeout(() => sfx('pop', {vol: 0.5}), 20);
            }}
            aria-label={p.sound ? 'Выключить звук' : 'Включить звук'}
            title={p.sound ? 'Звук включён' : 'Звук выключен'}
          >
            <Icon name={p.sound ? 'sound' : 'mute'} size={20} />
          </button>
          <TLink to="/progress" className="hdr__xp" id="xp-target" aria-label={`Уровень ${lv.index}, ${p.xp} XP`}>
            <XpRing t={lv.t} level={lv.index} />
            <span className="hdr__xpv">
              <span><b className="num">{p.xp}</b> XP</span>
              <small>{lv.name}</small>
            </span>
          </TLink>
          <button className="hdr__icon hdr__burger" onClick={() => setMenu((m) => !m)} aria-label="Меню" aria-expanded={menu}>
            <Icon name={menu ? 'x' : 'menu'} size={22} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <motion.nav className="hdr__mobile" initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}}>
            {NAV.map((n) => (
              <TLink key={n.to} to={n.to} className="hdr__mlink">
                {n.label} <Icon name="arrow" />
              </TLink>
            ))}
            <button className="hdr__mlink" onClick={openPalette}>
              Поиск <Icon name="search" />
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
