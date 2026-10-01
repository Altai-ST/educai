import type {Progress} from './store';
import {TASKS} from '../tasks/registry';
import {isLive, stageKey, stageVideo, type Stage, type Topic} from '../data/catalog';

export type StageState = 'soon' | 'new' | 'wip' | 'done';

export function stageProgress(p: Progress, t: Topic, s: Stage) {
  const key = stageKey(t, s);
  const tasks = TASKS[key] ?? [];
  const solved = tasks.filter((x) => x.id in (p.tasks[key] ?? {})).length;
  const watched = p.watched[key] ?? 0;
  const live = !!stageVideo(s);
  const state: StageState = !live ? 'soon' : tasks.length > 0 && solved >= tasks.length ? 'done' : solved > 0 || watched > 0.05 ? 'wip' : 'new';
  // a stage counts as done for the progress bar by tasks, with the video as a quarter of it
  const t01 = !live ? 0 : 0.25 * Math.min(1, watched / 0.9) + 0.75 * (tasks.length ? solved / tasks.length : 0);
  return {key, tasks: tasks.length, solved, watched, state, t: t01, live};
}

export function topicProgress(p: Progress, t: Topic) {
  const stages = t.stages.map((s) => stageProgress(p, t, s));
  const live = isLive(t);
  const done = stages.filter((s) => s.state === 'done').length;
  const started = stages.some((s) => s.state === 'wip' || s.state === 'done');
  const state: StageState = !live ? 'soon' : done === stages.length ? 'done' : started ? 'wip' : 'new';
  const tasks = stages.reduce((a, s) => a + s.tasks, 0);
  const solved = stages.reduce((a, s) => a + s.solved, 0);
  /** first stage that is not done — where "continue" leads */
  const current = Math.max(0, stages.findIndex((s) => s.live && s.state !== 'done'));
  return {stages, state, done, tasks, solved, current, t: stages.reduce((a, s) => a + s.t, 0) / stages.length};
}

export const STATE_LABEL: Record<StageState, string> = {soon: 'Скоро', new: 'Новое', wip: 'В процессе', done: 'Пройдено'};
