import type {TaskDef} from '../types';
import {paint} from './Paint';
import {trap} from './Trap';
import {height} from './Height';
import {photoFinish} from './PhotoFinish';
import {build} from './Build';
import {numberLine} from './NumberLine';

export const tasks: TaskDef[] = [paint, trap, height, photoFinish, build, numberLine];
