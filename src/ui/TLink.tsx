import React from 'react';
import {flushSync} from 'react-dom';
import {Link, useLocation, useNavigate, type LinkProps} from 'react-router-dom';
import {sfx} from '../lib/sound';

type VT = {startViewTransition?: (cb: () => void) => unknown};

/** Navigate with the circular "scene wipe" from the click point (View Transitions API), like the scene changes in the videos. */
export function useWipeNavigate() {
  const navigate = useNavigate();
  return (to: string, e?: {clientX: number; clientY: number}) => {
    const root = document.documentElement;
    root.style.setProperty('--vt-x', `${e?.clientX ?? innerWidth / 2}px`);
    root.style.setProperty('--vt-y', `${e?.clientY ?? innerHeight / 2}px`);
    sfx('whoosh', {vol: 0.35});
    const d = document as unknown as VT;
    if (!d.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return navigate(to);
    d.startViewTransition(() => flushSync(() => navigate(to)));
  };
}

export const TLink: React.FC<LinkProps & {ref?: React.Ref<HTMLAnchorElement>}> = ({onClick, to, ...rest}) => {
  const go = useWipeNavigate();
  const loc = useLocation();
  return (
    <Link
      to={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        const href = typeof to === 'string' ? to : `${to.pathname ?? ''}${to.search ?? ''}`;
        if (href === loc.pathname + loc.search) return;
        e.preventDefault();
        go(href, e);
      }}
      {...rest}
    />
  );
};
