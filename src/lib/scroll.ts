import Lenis from 'lenis';

let lenis: Lenis | null = null;

export function startLenis() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  lenis = new Lenis({lerp: 0.11, wheelMultiplier: 1, smoothWheel: true});
  const raf = (t: number) => {
    lenis?.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

export function scrollToEl(target: string | HTMLElement, offset = -90) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, {offset, duration: 1.2});
  else window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth'});
}

export function scrollTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, {immediate});
  else window.scrollTo(0, 0);
}

/** stop smooth scroll while a modal is open */
export function lockScroll(lock: boolean) {
  if (!lenis) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    return;
  }
  if (lock) lenis.stop();
  else lenis.start();
}
