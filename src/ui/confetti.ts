/**
 * Brand confetti: fractions, commas, percent signs and pizza-coloured shapes.
 * One shared full-screen canvas; call burst(x, y) from anywhere.
 */
const COLORS = ['#E5533C', '#F4B23E', '#2B8C82', '#3A5BA0', '#7A4E8C', '#4BAE6A', '#FFFDF8'];
const GLYPHS = ['½', '¼', '%', ',', '¾', '+', '0,1', '⅓', '1'];

type P = {x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number; c: string; g?: string; shape: number; life: number};
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let parts: P[] = [];
let raf = 0;

function ensure() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  Object.assign(canvas.style, {position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '8500'});
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas!.width = innerWidth * dpr;
    canvas!.height = innerHeight * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);
}

function tick() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 60);
  for (const p of parts) {
    p.vy += 0.32;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    p.life -= 1;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life / 30);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.fillStyle = p.c;
    if (p.g) {
      ctx.font = `900 ${p.s * 2.2}px Rubik, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.g, 0, 0);
    } else if (p.shape === 0) {
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    } else if (p.shape === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, p.s / 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // pizza-slice wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, p.s, -0.5, 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  if (parts.length) raf = requestAnimationFrame(tick);
  else {
    cancelAnimationFrame(raf);
    raf = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
}

export function burst(x = innerWidth / 2, y = innerHeight / 2, n = 70, spread = 1) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ensure();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (4 + Math.random() * 11) * spread;
    parts.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 6 * spread,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
      s: 8 + Math.random() * 10,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      g: Math.random() < 0.28 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : undefined,
      shape: (Math.random() * 3) | 0,
      life: 90 + Math.random() * 60,
    });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}

/** big celebration: two side cannons */
export function celebrate() {
  burst(innerWidth * 0.15, innerHeight * 0.75, 90, 1.25);
  setTimeout(() => burst(innerWidth * 0.85, innerHeight * 0.75, 90, 1.25), 140);
  setTimeout(() => burst(innerWidth * 0.5, innerHeight * 0.35, 60, 1), 320);
}
