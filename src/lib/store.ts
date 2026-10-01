import {useSyncExternalStore} from 'react';

/** Everything the learner has done, kept in localStorage. */
export type Progress = {
  xp: number;
  /** topic → taskId → xp earned (present = solved) */
  tasks: Record<string, Record<string, number>>;
  /** topic → furthest watched fraction 0..1 */
  watched: Record<string, number>;
  /** topic → answered the in-video question correctly? */
  predictions: Record<string, boolean>;
  /** ISO dates (yyyy-mm-dd) with any activity */
  days: string[];
  badges: string[];
  sound: boolean;
  wishes: string[];
  /** tasks solved on the first try */
  firstTry: number;
};

const KEY = 'za-minutu:v1';
const empty: Progress = {xp: 0, tasks: {}, watched: {}, predictions: {}, days: [], badges: [], sound: true, wishes: [], firstTry: 0};

let state: Progress = load();
const subs = new Set<() => void>();
type XpListener = (amount: number, at?: {x: number; y: number}) => void;
const xpSubs = new Set<XpListener>();
type BadgeListener = (id: string) => void;
const badgeSubs = new Set<BadgeListener>();

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? {...empty, ...JSON.parse(raw)} : {...empty};
  } catch {
    return {...empty};
  }
}

function set(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
  subs.forEach((f) => f());
}

const today = () => new Date().toISOString().slice(0, 10);
const touch = (p: Progress): Progress => (p.days.includes(today()) ? p : {...p, days: [...p.days, today()].slice(-120)});

export function useProgress(): Progress {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => state,
  );
}
export const getProgress = () => state;

/* ───────── levels ───────── */
export const LEVELS = [
  {xp: 0, name: 'Новичок'},
  {xp: 60, name: 'Наблюдатель'},
  {xp: 160, name: 'Исследователь'},
  {xp: 320, name: 'Аналитик'},
  {xp: 520, name: 'Эксперт'},
  {xp: 800, name: 'Магистр минуты'},
];
export function levelOf(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return {
    index: i + 1,
    name: cur.name,
    from: cur.xp,
    to: next?.xp ?? cur.xp,
    t: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1,
    nextName: next?.name,
  };
}

/* ───────── actions ───────── */
export function addXp(amount: number, at?: {x: number; y: number}) {
  if (amount <= 0) return;
  set(touch({...state, xp: state.xp + amount}));
  xpSubs.forEach((f) => f(amount, at));
}
export function onXp(f: XpListener) {
  xpSubs.add(f);
  return () => void xpSubs.delete(f);
}
export function onBadge(f: BadgeListener) {
  badgeSubs.add(f);
  return () => void badgeSubs.delete(f);
}

/** Records a solved task; returns XP actually granted (0 if it was solved before). */
export function solveTask(topic: string, taskId: string, xp: number, firstTry: boolean, at?: {x: number; y: number}) {
  const t = state.tasks[topic] ?? {};
  if (taskId in t) return 0;
  set({...state, firstTry: state.firstTry + (firstTry ? 1 : 0), tasks: {...state.tasks, [topic]: {...t, [taskId]: xp}}});
  addXp(xp, at);
  return xp;
}

export function setWatched(topic: string, frac: number) {
  const prev = state.watched[topic] ?? 0;
  if (frac <= prev + 0.01 && !(frac >= 0.97 && prev < 0.97)) return;
  const wasDone = prev >= 0.9;
  set(touch({...state, watched: {...state.watched, [topic]: Math.min(1, frac)}}));
  if (!wasDone && frac >= 0.9) addXp(15);
}

export function setPrediction(topic: string, ok: boolean) {
  if (topic in state.predictions) return;
  set({...state, predictions: {...state.predictions, [topic]: ok}});
  addXp(ok ? 10 : 5);
}

export function grantBadge(id: string) {
  if (state.badges.includes(id)) return;
  set({...state, badges: [...state.badges, id]});
  badgeSubs.forEach((f) => f(id));
}

export function toggleSound() {
  set({...state, sound: !state.sound});
}
export function toggleWish(id: string) {
  set({...state, wishes: state.wishes.includes(id) ? state.wishes.filter((w) => w !== id) : [...state.wishes, id]});
}
export function resetProgress() {
  set({...empty, sound: state.sound});
}

/** consecutive days up to today (or yesterday) */
export function streakOf(days: string[]) {
  const set_ = new Set(days);
  const d = new Date();
  if (!set_.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set_.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
