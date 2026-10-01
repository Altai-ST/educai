import {getProgress} from './store';

/** The same sound effects as in the videos (public/sfx, converted from the Remotion projects). */
export type SfxName =
  | 'boing' | 'buzz' | 'cash' | 'chop' | 'click' | 'ding' | 'hit' | 'pop' | 'rise' | 'snap' | 'stamp' | 'tick' | 'whoosh' | 'win';

let ctx: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer | null>>();
const last = new Map<string, number>();

function ac() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function load(name: string) {
  if (!loading.has(name)) {
    loading.set(
      name,
      fetch(`${import.meta.env.BASE_URL}sfx/${name}.mp3`)
        .then((r) => r.arrayBuffer())
        .then((b) => ac().decodeAudioData(b))
        .then((buf) => {
          buffers.set(name, buf);
          return buf;
        })
        .catch(() => null),
    );
  }
  return loading.get(name)!;
}

/** Warm the cache after the first user gesture so the first click is not silent. */
export function primeSounds() {
  (['click', 'pop', 'tick', 'ding', 'buzz', 'snap', 'whoosh', 'win', 'chop', 'rise'] as SfxName[]).forEach(load);
}

export function sfx(name: SfxName, {vol = 0.6, rate = 1, throttle = 40}: {vol?: number; rate?: number; throttle?: number} = {}) {
  if (!getProgress().sound) return;
  if (typeof window === 'undefined') return;
  const now = performance.now();
  if (now - (last.get(name) ?? 0) < throttle) return;
  last.set(name, now);
  const play = (buf: AudioBuffer | null | undefined) => {
    if (!buf) return;
    const c = ac();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(g).connect(c.destination);
    src.start();
  };
  const buf = buffers.get(name);
  if (buf) play(buf);
  else void load(name).then(play);
}
