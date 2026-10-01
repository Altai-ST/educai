import type {TaskDef} from '../types';
import {pizzaCut} from './PizzaCut';
import {burgerRounds} from './BurgerRounds';
import {chocolate} from './ChocolateBreak';
import {clock} from './ClockQuarter';
import {equalPizza} from './EqualPizza';
import {order} from './OrderFractions';

export const tasks: TaskDef[] = [pizzaCut, burgerRounds, chocolate, clock, equalPizza, order];
