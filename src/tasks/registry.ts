import type {TaskDef} from './types';
import {tasks as drobi} from './drobi';
import {tasks as desyatichnye} from './desyatichnye';
import {tasks as procenty} from './procenty';

export const TASKS: Record<string, TaskDef[]> = {drobi, desyatichnye, procenty};
export const TASK_IDS: Record<string, string[]> = Object.fromEntries(Object.entries(TASKS).map(([k, v]) => [k, v.map((t) => t.id)]));
export const maxXp = (slug: string) => (TASKS[slug] ?? []).reduce((a, t) => a + t.xp, 0);
