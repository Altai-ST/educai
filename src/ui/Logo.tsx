import React from 'react';
import {BRAND} from '../data/catalog';

/** A clock face with one quarter filled — a minute hand and a fraction at once. */
export const LogoMark: React.FC<{size?: number}> = ({size = 32}) => (
  <svg className="logo-mark" width={size} height={size} viewBox="-20 -20 40 40" aria-hidden>
    <circle r="19" fill="#fff" />
    <g className="logo-mark__hand">
      <path d="M0 0 L0 -19 A19 19 0 0 1 19 0 Z" fill="var(--brand)" />
    </g>
    <circle r="3.4" fill="var(--fg)" />
  </svg>
);

export const Logo: React.FC = () => (
  <span className="logo">
    <LogoMark />
    <span className="logo__word">{BRAND.toLowerCase()}</span>
  </span>
);
