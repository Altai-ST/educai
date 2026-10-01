/** Palette + geometry helpers shared with the Remotion videos (same values as projects/<topic>/src/lib.tsx). */
export const C = {
  paper: '#F3EBDD',
  paper2: '#E9DEC9',
  ink: '#1D1A2B',
  ink2: '#2C2840',
  red: '#E5533C',
  mustard: '#F4B23E',
  teal: '#2B8C82',
  blue: '#3A5BA0',
  plum: '#7A4E8C',
  white: '#FFFDF8',
  green: '#4BAE6A',
};
export const FONT = 'Rubik, system-ui, sans-serif';

export const deg = (a: number) => (a * Math.PI) / 180;
/** point on circle, angle in degrees, 0 = up, clockwise */
export const pol = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.sin(deg(a)), cy - r * Math.cos(deg(a))] as const;
export const sectorPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  if (a1 - a0 >= 359.99) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  const [x0, y0] = pol(cx, cy, r, a0);
  const [x1, y1] = pol(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
};
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
