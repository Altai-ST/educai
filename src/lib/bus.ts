import {useSyncExternalStore} from 'react';

/** Tiny value emitter so 60 fps video time only re-renders the components that read it. */
export type Bus<T> = {get: () => T; set: (v: T) => void; sub: (f: () => void) => () => void};
export function createBus<T>(initial: T): Bus<T> {
  let v = initial;
  const subs = new Set<() => void>();
  return {
    get: () => v,
    set: (n) => {
      if (n === v) return;
      v = n;
      subs.forEach((f) => f());
    },
    sub: (f) => {
      subs.add(f);
      return () => void subs.delete(f);
    },
  };
}
export const useBus = <T,>(b: Bus<T>) => useSyncExternalStore(b.sub, b.get, b.get);
