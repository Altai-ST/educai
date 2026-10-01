import React from 'react';

/** Stacked fraction in HTML — numerator red, denominator teal, like in the videos. */
export const Frac: React.FC<{n: React.ReactNode; d: React.ReactNode; plain?: boolean; style?: React.CSSProperties; className?: string}> = ({n, d, plain, style, className = ''}) => (
  <span className={`frac ${plain ? 'frac--plain' : ''} ${className}`} style={style} aria-label={`${n}/${d}`}>
    <span className="n">{n}</span>
    <span className="bar" />
    <span className="d">{d}</span>
  </span>
);

/** Decimal number with a red comma. */
export const Dec: React.FC<{v: string; style?: React.CSSProperties; className?: string}> = ({v, style, className}) => {
  const [a, b] = v.split(',');
  return (
    <span className={`num ${className ?? ''}`} style={style}>
      {a}
      {b !== undefined && (
        <>
          <span className="comma">,</span>
          {b}
        </>
      )}
    </span>
  );
};
