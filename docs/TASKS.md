# Как делать задания (Stage) для «За минуту»

Сайт — портал с короткими роликами по математике (5 класс) и интерактивными заданиями «из ролика».
Ролики лежат в `../projects/<тема>/` (Remotion, SVG). Задание принадлежит этапу темы и должно выглядеть **как кадр из видео этого этапа**,
который можно потрогать: та же палитра, те же предметы (пицца, бургер, шоколадка, сетка 10×10, куртка
с ценником, пловцы…), шрифт Rubik жирный, числитель красный, знаменатель бирюзовый, запятая красная.
Аудитория — школьники, но стиль взрослый, «как у профессиональной студии», без детских мультяшек.

Посмотреть кадры роликов: `/tmp/sheet_drobi.jpg`, `/tmp/sheet_desyatichnye.jpg`, `/tmp/sheet_procenty.jpg`.

## Файлы
- Твоя папка: `src/tasks/<slug видео этапа>/` (например `drobi`). Один файл = одно задание, экспорт `TaskDef`. Порядок — в `src/tasks/<тема>/index.ts`.
- **Не меняй общие файлы** (`src/tasks/kit.tsx`, `engine.tsx`, `types.ts`, `src/art/*`, стили, страницы).
  Нужна своя графика (часы, градусник, линейка…) — клади в `src/tasks/<тема>/art.tsx`.
  Нужен свой CSS — `src/tasks/<тема>/<тема>.css`, импортируй его из своего файла; классы с префиксом темы (`.drobi-…`).
- Эталон: `src/tasks/drobi/PizzaCut.tsx` — прочитай его первым.

## API
```ts
export const myTask: TaskDef = {
  id: 'kebab-id', kind: 'Сравни', title: 'Инструкция одним предложением',
  hint: 'Наводка, не ответ', explain: 'Почему правильный ответ правильный (1–2 предложения)',
  xp: 10..30, replay: 's04_pizza',   // id сцены ролика, к которой отсылает «Момент из ролика»
  selfCheck?: true,                  // если Stage сам решает, когда всё (быстрые раунды)
  Stage,
};
```
Внутри Stage: `const api = useTask()` (`../engine`).
- `api.useCheck(ready, () => boolean)` — вызывать **на каждом рендере, безусловно**. ready=false → кнопка «Проверить» неактивна.
- `api.status`: `'answering' | 'right' | 'wrong' | 'revealed'`. При не-`answering` интерактив заблокирован.
  При `'revealed'` Stage **обязан показать правильный ответ** (как в PizzaCut: подставить правильные значения).
  При `'wrong'` можно подсветить ошибку; после «Ещё раз» статус снова `answering`, `api.attempt` +1, состояние ученика сохраняется.
- `api.finish(ok)` — только для `selfCheck`.
- Шапку, номер, XP, подсказку, кнопки, баннер «Верно/Почти», конфетти и звуки верного/неверного ответа рисует движок. Не дублируй.

## Кирпичики (`../kit`)
- `StageSvg` (`w`,`h`, по умолчанию 1000×560, ref на svg), `svgPoint`, `useSvgDrag(svgRef, onMove, {onStart,onEnd,disabled})` — перетаскивание в координатах viewBox.
- `Split ratio="1.2fr 1fr"` — картинка слева, панель справа (на мобиле в столбик). Панель: `<div className="stage-panel">`. Центр: `stage-center`.
- `Readout label=… tone='ink'|'right'|'wrong'` — крупное живое значение.
- `Choice options value onChange status correct columns size` — большие плитки ответа (клавиши 1…n).
- `NumPad value onChange status comma suffix label compact active` — ввод числа. `parseNum`, `fmtNum`.
- `GridPainter cells onChange status svgRef color ghost x y size` — сетка 10×10, рисование протягиванием; `emptyCells`, `countCells`. Клетки по столбцам: index = col*10+row.
- `SortRow items onChange render status axis correctOrder` — перетаскивание порядка.
- `Matcher left right pairs onChange status answer` — соединить пары линиями.
- `useRounds(n, api.finish, need)` + `RoundDots` — для быстрых раундов (`selfCheck`).
- CSS-классы: `target-chip` (тёмная «цель» сверху), `sticker` (наклейка «ЛОВУШКА»), `stage-note`, `stage-big`, `stepper`.
- `Frac n d` и `Dec v="0,45"` из `../../ui/Frac` — дроби/десятичные в HTML в цветах роликов.
- Иконки: `Icon name="check|x|bulb|play|arrow|undo|…"` из `../../ui/Icon`.

## Графика (`../../art/art`, палитра `C` в `../../art/kit`)
`Pizza` (angles, explode, lift, dim, ring, ringColor), `Slice`, `Burger` (patty = толщина котлеты), `Person`,
`Chocolate`, `Check`, `Cross`, `Dec` (svg-десятичная), `Grid` (svg 10×10), `Swimmer`, `Medal`, `Star`,
`Jacket`, `PriceTag`, `Sticker`, `Terminal`, `Brain`, `Cloud`, `Umbrella`.
Помощники: `pol(cx,cy,r,angleDeg)` (0° = вверх, по часовой), `sectorPath`.
Палитра: paper #F3EBDD, ink #1D1A2B, red #E5533C, mustard #F4B23E, teal #2B8C82, blue #3A5BA0, plum #7A4E8C, green #4BAE6A, white #FFFDF8.
Тени предметов — эллипс/смещённая копия ink с opacity .12–.15, как в роликах. Обводки ink 5–8px.

## Звуки
`sfx(name, {vol, rate})` из `../../lib/sound` — те же звуки, что в роликах:
`click pop tick snap chop whoosh ding buzz win cash stamp rise boing hit`. Используй для действий внутри
сцены (`chop` — разрез, `snap` — щелчок на место, `tick` — шаг ползунка, `cash` — касса). Громкость 0.3–0.6.
Не играй `ding`/`buzz` на проверке — это делает движок (в быстрых раундах звук уже в `useRounds`).

## Качество
- Анимации — `motion/react` (spring), всё плавно: появление, перестройка, подсветка ответа.
- Интерактив очевиден без текста; одна строка-подсказка `stage-note` допустима.
- Должно работать мышью, пальцем (pointer events, `touch-action:none` на перетаскиваемом) и, где разумно, клавиатурой.
- Мобильная ширина 390px: ничего не вылезает, тап-зоны ≥ 44px.
- Никаких `alert`, `console.log`, внешних картинок и шрифтов.
- Тексты по-русски, коротко, без сюсюканья. Числа: пробел-разделитель тысяч («8 000»), десятичная запятая.

## Проверка
- Дев-сервер уже запущен на `http://localhost:5173` (HMR). **Не перезапускай его** (`scripts/dev.sh` не трогай).
- Одно задание отдельно: `http://localhost:5173/lab/<видео>/<id>`, все задания этапа: `/lab/<видео>`.
- Скриншот: `node scripts/shot.mjs /lab/drobi/pizza-cut /tmp/x.png 1440 1000 '--click=<css/playwright selector>' …`
  (`--mobile` + ширина 390 для телефона; клики выполняются по очереди; выводит ошибки консоли). Смотри PNG через Read.
- Типы: `npx tsc --noEmit -p . 2>&1 | grep 'src/tasks/<тема>'` — должно быть пусто (ошибки в чужих папках игнорируй).
- Прогресс хранится в localStorage; в Playwright каждый запуск — чистый профиль.
