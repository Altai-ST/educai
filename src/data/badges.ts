import type {Progress} from '../lib/store';
import {streakOf} from '../lib/store';
import {TASK_IDS} from '../tasks/registry';
import {TOPICS, stageKey} from './catalog';

export type Badge = {id: string; title: string; text: string; glyph: string; color: string; test: (p: Progress) => boolean};

const stageDone = (p: Progress, key: string) => (TASK_IDS[key]?.length ?? 0) > 0 && TASK_IDS[key].every((id) => id in (p.tasks[key] ?? {}));
const liveTopics = TOPICS.filter((t) => t.stages.some((s) => s.video));

export const BADGES: Badge[] = [
  {id: 'first', title: 'Первый шаг', text: 'Решить первое задание', glyph: '1', color: 'var(--brand)', test: (p) => Object.values(p.tasks).some((t) => Object.keys(t).length > 0)},
  {id: 'intuition', title: 'Интуиция', text: 'Угадать ответ на паузе в видео', glyph: '?', color: '#B44BE1', test: (p) => Object.values(p.predictions).some(Boolean)},
  {id: 'stage', title: 'Этап пройден', text: 'Решить все задания одного этапа', glyph: '✓', color: '#12B886', test: (p) => Object.keys(TASK_IDS).some((k) => stageDone(p, k))},
  {id: 'topic', title: 'Тема закрыта', text: 'Пройти все этапы одной темы', glyph: '★', color: '#FF5B3A', test: (p) => liveTopics.some((t) => t.stages.every((s) => stageDone(p, stageKey(t, s))))},
  {id: 'sniper', title: 'Снайпер', text: '5 заданий с первой попытки', glyph: '◎', color: '#00A6FF', test: (p) => p.firstTry >= 5},
  {id: 'cinema', title: 'Досмотрел', text: 'Досмотреть три видео до конца', glyph: '▶', color: '#F2B705', test: (p) => Object.values(p.watched).filter((w) => w >= 0.9).length >= 3},
  {id: 'streak', title: 'Три дня подряд', text: 'Заниматься три дня без пропусков', glyph: '3', color: '#FF4D8D', test: (p) => streakOf(p.days) >= 3},
  {id: 'xp300', title: '300 XP', text: 'Набрать 300 очков опыта', glyph: 'XP', color: '#6CC24A', test: (p) => p.xp >= 300},
];
export const badgeById = (id: string) => BADGES.find((b) => b.id === id);
