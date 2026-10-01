import drobiTl from './tl/drobi.json';
import desTl from './tl/desyatichnye.json';
import procTl from './tl/procenty.json';

/* ───────── timeline (word-level timings exported by the Remotion projects) ───────── */
type RawWord = {w: string; f: number; d: number};
type RawLine = {id: string; text: string; from: number; dur: number; words: RawWord[]};
type RawScene = {id: string; from: number; dur: number; lines: RawLine[]};
type RawTl = {fps: number; durationInFrames: number; scenes: RawScene[]};

export type Word = {w: string; t: number; end: number};
export type Line = {id: string; scene: string; text: string; t: number; end: number; words: Word[]};
export type Chapter = {id: string; title: string; t: number; end: number};

function parse(tl: RawTl, titles: Record<string, string>) {
  const fps = tl.fps;
  const lines: Line[] = [];
  const chapters: Chapter[] = tl.scenes.map((s) => ({
    id: s.id,
    title: titles[s.id] ?? s.id,
    t: s.from / fps,
    end: (s.from + s.dur) / fps,
  }));
  for (const s of tl.scenes) {
    for (const l of s.lines) {
      // show the words with their punctuation: map the spoken tokens back onto the script text
      const tokens: string[] = [];
      for (const tok of l.text.split(/\s+/)) {
        if (/[\p{L}\p{N}]/u.test(tok) || !tokens.length) tokens.push(tok);
        else tokens[tokens.length - 1] += ` ${tok}`;
      }
      const shown = tokens.length === l.words.length ? tokens : l.words.map((w) => w.w);
      lines.push({
        id: `${s.id}.${l.id}`,
        scene: s.id,
        text: l.text,
        t: (s.from + l.from) / fps,
        end: (s.from + l.from + l.dur) / fps,
        words: l.words.map((w, i) => ({w: shown[i], t: (s.from + w.f) / fps, end: (s.from + w.f + w.d) / fps})),
      });
    }
  }
  return {lines, chapters, duration: tl.durationInFrames / fps};
}

/* ───────── videos (one per stage) ───────── */
export type Checkpoint = {
  /** pause the video at this second */
  at: number;
  question: string;
  options: string[];
  correct: number;
  /** said after the answer, before the video goes on */
  right: string;
  wrong: string;
};

export type SummaryCard = {big: string; title: string; text: string; color: string};

/** A video with its word timings, chapter list, in-video question and summary. Used by a stage of a topic. */
export type Video = {
  slug: string;
  title: string;
  kicker: string;
  /** the question the video opens with */
  hook: string;
  blurb: string;
  accent: string;
  grade: string;
  lines: Line[];
  chapters: Chapter[];
  duration: number;
  checkpoint: Checkpoint;
  summary: SummaryCard[];
  /** [topic glyph, tiny label] for cards */
  glyph: string;
  facts: string[];
};

const drobi = parse(drobiTl as RawTl, {
  s01_hook: 'Провал бургера',
  s02_title: 'Разберёмся',
  s03_two: 'Два числа дроби',
  s04_pizza: 'Пицца на троих',
  s05_life: 'Дроби повсюду',
  s06_equal: 'Последний фокус',
  s07_outro: 'Главное',
});
const des = parse(desTl as RawTl, {
  s01_hook: 'Фотофиниш',
  s02_title: 'Что за запятой',
  s03_comma: 'Целое и части',
  s04_places: 'Десятые и сотые',
  s05_trap: 'Ловушка',
  s06_life: 'В жизни',
  s07_outro: 'Главное',
});
const proc = parse(procTl as RawTl, {
  s01_hook: 'Распродажа',
  s02_title: 'Проценты',
  s03_what: 'Что такое процент',
  s04_find: 'Считаем 1 %',
  s05_trap: 'От чего процент?',
  s06_life: 'В жизни',
  s07_outro: 'Главное',
});

export const VIDEOS: Video[] = [
  {
    slug: 'drobi',
    title: 'Дроби',
    kicker: 'Урок 1',
    hook: 'Почему бургер на ⅓ фунта провалился?',
    blurb: 'Реальная история A&W: люди решили, что ⅓ меньше ¼. Пицца, шоколадка и фокус с одинаковыми дробями.',
    accent: 'var(--red)',
    grade: '5 класс',
    ...drobi,
    glyph: '⅓',
    checkpoint: {
      at: 20.35,
      question: 'А ты как думаешь — что больше?',
      options: ['⅓ фунта', '¼ фунта', 'Одинаково'],
      correct: 0,
      right: 'Верно! Посмотрим, почему так много людей ошиблись.',
      wrong: 'Ты в большой компании — так решила половина Америки. Смотрим дальше.',
    },
    summary: [
      {big: '¾', title: 'Снизу — на сколько делим', text: 'Знаменатель показывает, на сколько равных частей разрезали целое.', color: 'var(--teal)'},
      {big: '⅓ > ¼', title: 'Больше едоков — меньше кусок', text: 'Чем больше число внизу, тем меньше каждая часть.', color: 'var(--red)'},
      {big: '½ = 2⁄4', title: 'Одна и та же дробь', text: 'Режем каждый кусок пополам: кусков вдвое больше, а пиццы столько же.', color: 'var(--mustard)'},
    ],
    facts: ['Бургер A&W «Third Pounder» в 1980-х стоил столько же, сколько «Quarter Pounder».', 'Четверть часа — это 15 минут, а три четверти — 45.'],
  },
  {
    slug: 'desyatichnye',
    title: 'Десятичные дроби',
    kicker: 'Урок 2',
    hook: 'Как Фелпс выиграл золото за 0,01 секунды?',
    blurb: 'Пекин-2008, фотофиниш. Что прячется за запятой, чем десятые отличаются от сотых и почему 0,5 больше 0,45.',
    accent: 'var(--blue)',
    grade: '5 класс',
    ...des,
    glyph: '0,01',
    checkpoint: {
      at: 50.9,
      question: 'Что больше?',
      options: ['0,5', '0,45', 'Они равны'],
      correct: 0,
      right: 'Точно! Ловушка не сработала. Сейчас разберём, почему многие попадаются.',
      wrong: 'Это и есть ловушка: «45 больше 5» — но не после запятой. Смотри!',
    },
    summary: [
      {big: '1,75', title: 'Запятая делит целое и части', text: 'Слева — целые, справа — доли целого.', color: 'var(--teal)'},
      {big: '0,01', title: 'Каждая цифра — в 10 раз мельче', text: 'Первая после запятой — десятые, вторая — сотые.', color: 'var(--red)'},
      {big: '0,50', title: 'Допиши ноль', text: 'Чтобы сравнить, уравняй количество цифр: 0,50 > 0,45.', color: 'var(--mustard)'},
    ],
    facts: ['Моргание длится около 0,3 секунды — в 30 раз дольше, чем 0,01.', 'Нормальная температура тела — 36,6 °C.'],
  },
  {
    slug: 'procenty',
    title: 'Проценты',
    kicker: 'Урок 3',
    hook: '−50 %, а потом ещё −20 %. Это −70 %?',
    blurb: 'Распродажа и двойная скидка. Что такое один процент, как его найти и главный вопрос: процент — от чего?',
    accent: 'var(--teal)',
    grade: '5 класс',
    ...proc,
    glyph: '%',
    checkpoint: {
      at: 13.05,
      question: '−50 %, а потом ещё −20 %. Какая итоговая скидка?',
      options: ['Ровно 70 %', 'Меньше 70 %', 'Больше 70 %'],
      correct: 1,
      right: 'Есть! Мозг не обманешь. Сейчас докажем на клеточках.',
      wrong: 'Мозг очень хочет сложить 50 и 20. Сейчас докажем, что так нельзя.',
    },
    summary: [
      {big: '1 %', title: 'Процент — сотая часть', text: '«Pro centum» — «на сотню». 1 % = 1⁄100 = 0,01.', color: 'var(--red)'},
      {big: ':100', title: 'Как найти 1 %', text: 'Делим число на 100. 1 % от 10 000 — это 100.', color: 'var(--teal)'},
      {big: 'от чего?', title: 'Главный вопрос', text: 'Вторая скидка считается от новой цены, а не от старой.', color: 'var(--mustard)'},
    ],
    facts: ['Слово «процент» пришло из латыни: pro centum — «на сотню».', 'Девять заданий из десяти — это 90 %.'],
  },
];

export const videoBySlug = (slug?: string) => VIDEOS.find((t) => t.slug === slug);
export const media = (slug: string) => ({
  video: `${import.meta.env.BASE_URL}media/${slug}/video.mp4`,
  poster: `${import.meta.env.BASE_URL}media/${slug}/poster.jpg`,
  preview: `${import.meta.env.BASE_URL}media/${slug}/preview.mp4`,
  sprite: `${import.meta.env.BASE_URL}media/${slug}/sprite.jpg`,
});
export const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
};
