import type {TaskDef} from '../types';
import {paint} from './Paint';
import {onePercent} from './OnePercent';
import {till} from './Till';
import {match} from './Match';
import {howMuch} from './HowMuch';
import {upDown} from './UpDown';

export const tasks: TaskDef[] = [paint, onePercent, till, match, howMuch, upDown];
