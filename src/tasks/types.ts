import type React from 'react';

/**
 * One interactive exercise. The shell (TaskRunner) draws the frame: number, title, hint, XP,
 * the «Проверить» button and the feedback banner. The Stage draws only the interactive picture.
 */
export type TaskDef = {
  /** unique inside the topic, kebab-case */
  id: string;
  /** one-word verb for the eyebrow: «Разрежь», «Сравни», «Закрась» … */
  kind: string;
  /** the instruction, one sentence */
  title: string;
  /** a nudge, not the answer */
  hint: string;
  /** why the right answer is right — shown after the check */
  explain: string;
  /** 10 – 30 */
  xp: number;
  /** chapter (scene id) of the video to rewatch, e.g. 's04_pizza' */
  replay?: string;
  /**
   * true → the Stage decides by itself when it is over (quick rounds) and calls api.finish(ok);
   * the shell then hides the «Проверить» button.
   */
  selfCheck?: boolean;
  Stage: React.FC;
};

export type TaskStatus = 'answering' | 'right' | 'wrong' | 'revealed';

export type TaskApi = {
  status: TaskStatus;
  /** 0 on the first try, +1 after every «Ещё раз» */
  attempt: number;
  /**
   * Register readiness + the check. Call it on every render:
   *   api.useCheck(value !== null, () => value === 8)
   * ready=false keeps «Проверить» disabled.
   */
  useCheck: (ready: boolean, check: () => boolean) => void;
  /** for selfCheck stages: report the final result */
  finish: (ok: boolean) => void;
};
