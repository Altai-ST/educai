import React from 'react';

/** Small progress ring. */
export const Ring: React.FC<{t: number; color: string; size?: number}> = ({t, color, size = 22}) => {
  const r = size / 2 - 2.5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} aria-hidden style={{flex: 'none'}}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3.5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, t))} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{transition: 'stroke-dashoffset .8s'}} />
    </svg>
  );
};
