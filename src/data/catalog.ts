/**
 * The portal's content map: subjects → grades → topics → stages.
 * A stage is one video plus the tasks made for it. A topic can have one stage or several.
 * Only stages with `video` are live; the rest are announced as «скоро».
 */
import {videoBySlug, type Video} from './videos';

export const BRAND = 'За минуту';

export type Subject = {
  id: string;
  title: string;
  short: string;
  /** accent colour of the subject */
  color: string;
  /** big glyph for tiles */
  glyph: string;
  grades: [number, number];
  blurb: string;
};

export const SUBJECTS: Subject[] = [
  {id: 'matematika', title: 'Математика', short: 'Математика', color: '#FF5B3A', glyph: 'π', grades: [1, 11], blurb: 'От счёта до производной: числа, уравнения, функции и геометрия.'},
  {id: 'russkiy', title: 'Русский язык', short: 'Русский', color: '#3D6BFF', glyph: 'Аа', grades: [1, 11], blurb: 'Правила, которые объясняют, а не заставляют зубрить.'},
  {id: 'literatura', title: 'Литература', short: 'Литература', color: '#B44BE1', glyph: '«»', grades: [5, 11], blurb: 'Книги как сериалы: герои, конфликты, развязки.'},
  {id: 'okruzhayushchiy', title: 'Окружающий мир', short: 'Окр. мир', color: '#F2B705', glyph: '☀', grades: [1, 4], blurb: 'Почему идёт дождь и куда девается вода из лужи.'},
  {id: 'fizika', title: 'Физика', short: 'Физика', color: '#00A6FF', glyph: 'F', grades: [7, 11], blurb: 'Законы, которые можно увидеть в обычной кухне.'},
  {id: 'khimiya', title: 'Химия', short: 'Химия', color: '#12B886', glyph: 'H₂O', grades: [8, 11], blurb: 'Реакции без скучных таблиц — с цветом, дымом и смыслом.'},
  {id: 'biologiya', title: 'Биология', short: 'Биология', color: '#6CC24A', glyph: 'DNA', grades: [5, 11], blurb: 'Клетки, гены и эволюция — как самая длинная история на Земле.'},
  {id: 'geografiya', title: 'География', short: 'География', color: '#16A5A5', glyph: '°N', grades: [5, 10], blurb: 'Карта мира, климат и часовые пояса без зубрёжки.'},
  {id: 'istoriya', title: 'История', short: 'История', color: '#D08A2E', glyph: 'XV', grades: [5, 11], blurb: 'Причины и следствия: почему всё случилось именно так.'},
  {id: 'angliyskiy', title: 'Английский язык', short: 'Английский', color: '#FF4D8D', glyph: 'Ab', grades: [2, 11], blurb: 'Грамматика на живых примерах из фильмов и песен.'},
  {id: 'informatika', title: 'Информатика', short: 'Информатика', color: '#7C5CFF', glyph: '</>', grades: [5, 11], blurb: 'Алгоритмы, данные и первый код.'},
];
export const subjectById = (id?: string) => SUBJECTS.find((s) => s.id === id);

export type Stage = {
  id: string;
  title: string;
  /** slug of a video in VIDEOS; without it the stage is «скоро» */
  video?: string;
  /** planned length in minutes, for stages without a video */
  minutes?: number;
};

export type Topic = {
  id: string;
  subject: string;
  grade: number;
  /** section of the school programme */
  section: string;
  title: string;
  hook: string;
  blurb: string;
  stages: Stage[];
  isNew?: boolean;
};

const soon = (titles: string[], minutes = 2): Stage[] => titles.map((t, i) => ({id: `e${i + 1}`, title: t, minutes}));

export const TOPICS: Topic[] = [
  {
    id: 'drobi-i-procenty',
    subject: 'matematika',
    grade: 5,
    section: 'Дроби',
    title: 'Дроби, десятичные и проценты',
    hook: 'Почему бургер на ⅓ фунта провалился, а −50 % и −20 % — это не −70 %?',
    blurb: 'Три этапа: обыкновенные дроби, десятичные дроби и проценты. Каждый — короткий ролик с реальной историей и шесть заданий в его мире.',
    isNew: true,
    stages: [
      {id: 'drobi', title: 'Обыкновенные дроби', video: 'drobi'},
      {id: 'desyatichnye', title: 'Десятичные дроби', video: 'desyatichnye'},
      {id: 'procenty', title: 'Проценты', video: 'procenty'},
    ],
  },
  // ── математика
  {id: 'slozhenie-10', subject: 'matematika', grade: 1, section: 'Числа и счёт', title: 'Сложение и вычитание до 10', hook: 'Как пальцы помогают считать — и когда перестают?', blurb: 'Состав числа, «соседи» и счёт без пальцев.', stages: soon(['Состав числа', 'Сложение', 'Вычитание'])},
  {id: 'tablica-umnozheniya', subject: 'matematika', grade: 2, section: 'Умножение', title: 'Таблица умножения', hook: 'Почему 7 × 8 — самый трудный пример?', blurb: 'Умножение как прямоугольник из клеточек и хитрости, которые делают таблицу короче вдвое.', stages: soon(['Что такое умножение', 'Хитрости таблицы'])},
  {id: 'ploshchad-perimetr', subject: 'matematika', grade: 4, section: 'Геометрия', title: 'Площадь и периметр', hook: 'Сколько плиток нужно на пол — и сколько плинтуса?', blurb: 'Две величины, которые все путают, на одном плане комнаты.', stages: soon(['Периметр', 'Площадь'])},
  {id: 'otricatelnye', subject: 'matematika', grade: 6, section: 'Рациональные числа', title: 'Отрицательные числа', hook: 'Что значит −20 °C и почему минус на минус — плюс?', blurb: 'Термометр, лифт и банковский счёт.', stages: soon(['Числовая прямая', 'Сложение', 'Умножение'])},
  {id: 'linejnaya-funkciya', subject: 'matematika', grade: 7, section: 'Функции', title: 'Линейная функция', hook: 'Как тариф такси превращается в прямую линию?', blurb: 'Графики, наклон и точка пересечения.', stages: soon(['Что такое функция', 'График y = kx + b'])},
  {id: 'kvadratnye-uravneniya', subject: 'matematika', grade: 8, section: 'Уравнения', title: 'Квадратные уравнения', hook: 'Почему у мяча, брошенного вверх, два момента на одной высоте?', blurb: 'Парабола, дискриминант и теорема Виета.', stages: soon(['Парабола', 'Дискриминант', 'Теорема Виета'])},
  {id: 'proizvodnaya', subject: 'matematika', grade: 11, section: 'Начала анализа', title: 'Производная', hook: 'Что показывает спидометр в каждую секунду?', blurb: 'Скорость изменения — от машины до курса валют.', stages: soon(['Мгновенная скорость', 'Правила', 'Экстремумы'])},
  // ── русский
  {id: 'zvuki-bukvy', subject: 'russkiy', grade: 2, section: 'Фонетика', title: 'Звуки и буквы', hook: 'Почему в слове «ёж» две буквы, а звуков три?', blurb: 'Слышим и видим: гласные, согласные, мягкий знак.', stages: soon(['Гласные и согласные', 'Мягкость'])},
  {id: 'padezhi', subject: 'russkiy', grade: 4, section: 'Морфология', title: 'Падежи', hook: 'Как один вопрос спасает от ошибки в окончании?', blurb: 'Шесть падежей как шесть ролей в предложении.', stages: soon(['Вопросы падежей', 'Окончания'])},
  {id: 'prichastie', subject: 'russkiy', grade: 7, section: 'Морфология', title: 'Причастие и деепричастие', hook: '«Подъезжая к станции, слетела шляпа» — что не так?', blurb: 'Добавочные действия и запятые вокруг них.', stages: soon(['Причастие', 'Деепричастие', 'Обороты и запятые'])},
  {id: 'spp', subject: 'russkiy', grade: 9, section: 'Синтаксис', title: 'Сложноподчинённые предложения', hook: 'Где ставить запятую перед «что» — и где не нужно?', blurb: 'Главная и придаточная части, союзы и знаки.', stages: soon(['Строение', 'Виды придаточных'])},
  // ── литература
  {id: 'mify', subject: 'literatura', grade: 5, section: 'Мифы и сказки', title: 'Мифы Древней Греции', hook: 'Почему мы до сих пор говорим «ахиллесова пята»?', blurb: 'Боги, герои и выражения, которые живут три тысячи лет.', stages: soon(['Олимп', 'Подвиги Геракла'])},
  {id: 'geroj-vremeni', subject: 'literatura', grade: 9, section: 'XIX век', title: '«Герой нашего времени»', hook: 'Почему главы романа перепутаны — и это гениально?', blurb: 'Композиция, Печорин и лишний человек.', stages: soon(['Композиция', 'Печорин'])},
  // ── окружающий мир
  {id: 'krugovorot', subject: 'okruzhayushchiy', grade: 2, section: 'Природа', title: 'Круговорот воды', hook: 'Куда исчезает лужа после дождя?', blurb: 'Испарение, облака, дождь — и снова лужа.', stages: soon(['Испарение', 'Облака и осадки'])},
  {id: 'solnechnaya', subject: 'okruzhayushchiy', grade: 4, section: 'Земля и космос', title: 'Солнечная система', hook: 'Почему на Венере жарче, чем на Меркурии?', blurb: 'Восемь планет, их размеры и расстояния.', stages: soon(['Планеты', 'Масштабы'])},
  // ── физика
  {id: 'plotnost', subject: 'fizika', grade: 7, section: 'Вещество', title: 'Плотность', hook: 'Почему огромный корабль плавает, а гвоздь тонет?', blurb: 'Масса, объём и закон Архимеда.', stages: soon(['Масса и объём', 'Сила Архимеда']), isNew: true},
  {id: 'zakony-nyutona', subject: 'fizika', grade: 9, section: 'Механика', title: 'Законы Ньютона', hook: 'Почему в автобусе вас бросает вперёд при торможении?', blurb: 'Инерция, сила и действие-противодействие.', stages: soon(['Инерция', 'F = ma', 'Третий закон'])},
  {id: 'tok', subject: 'fizika', grade: 8, section: 'Электричество', title: 'Электрический ток', hook: 'Почему птицы сидят на проводах и им ничего не делается?', blurb: 'Напряжение, сила тока и закон Ома.', stages: soon(['Цепь', 'Закон Ома'])},
  // ── химия
  {id: 'atom', subject: 'khimiya', grade: 8, section: 'Строение вещества', title: 'Строение атома', hook: 'Если атом — стадион, то где ядро?', blurb: 'Протоны, нейтроны, электроны и пустота.', stages: soon(['Ядро и оболочка', 'Изотопы'])},
  {id: 'mendeleev', subject: 'khimiya', grade: 8, section: 'Строение вещества', title: 'Периодическая таблица', hook: 'Как Менделеев предсказал элементы, которых никто не видел?', blurb: 'Периоды, группы и закономерности.', stages: soon(['Как устроена таблица', 'Свойства по группам'])},
  {id: 'kisloty', subject: 'khimiya', grade: 9, section: 'Реакции', title: 'Кислоты и основания', hook: 'Почему лимон кислый, а мыло — скользкое?', blurb: 'Индикаторы, pH и нейтрализация.', stages: soon(['pH', 'Нейтрализация'])},
  // ── биология
  {id: 'kletka', subject: 'biologiya', grade: 5, section: 'Клетка', title: 'Клетка', hook: 'Сколько клеток в вашем теле — и что каждая из них делает?', blurb: 'Мембрана, ядро и органоиды как город в миниатюре.', stages: soon(['Строение', 'Растительная и животная'])},
  {id: 'fotosintez', subject: 'biologiya', grade: 6, section: 'Растения', title: 'Фотосинтез', hook: 'Откуда дерево берёт тонны древесины — из почвы?', blurb: 'Свет, вода и углекислый газ превращаются в сахар.', stages: soon(['Хлоропласты', 'Уравнение фотосинтеза']), isNew: true},
  {id: 'dnk', subject: 'biologiya', grade: 10, section: 'Генетика', title: 'ДНК и наследственность', hook: 'Почему у кареглазых родителей бывает голубоглазый ребёнок?', blurb: 'Гены, аллели и законы Менделя.', stages: soon(['ДНК', 'Законы Менделя', 'Задачи'])},
  // ── география
  {id: 'chasovye-poyasa', subject: 'geografiya', grade: 6, section: 'Земля', title: 'Часовые пояса', hook: 'Как встретить Новый год дважды за одну ночь?', blurb: 'Вращение Земли, меридианы и линия перемены дат.', stages: soon(['Вращение Земли', 'Пояса и даты'])},
  {id: 'klimat', subject: 'geografiya', grade: 7, section: 'Атмосфера', title: 'Климатические пояса', hook: 'Почему в Лондоне теплее, чем в Москве, хотя он севернее Киева?', blurb: 'Солнце, океаны и ветра.', stages: soon(['Солнце и широта', 'Течения и ветра'])},
  // ── история
  {id: 'egipet', subject: 'istoriya', grade: 5, section: 'Древний мир', title: 'Древний Египет', hook: 'Как построили пирамиды без кранов?', blurb: 'Нил, фараоны и иероглифы.', stages: soon(['Нил', 'Пирамиды', 'Письменность'])},
  {id: 'otkrytiya', subject: 'istoriya', grade: 7, section: 'Новое время', title: 'Великие географические открытия', hook: 'Зачем Колумб плыл в Индию на запад?', blurb: 'Пряности, каравеллы и новая карта мира.', stages: soon(['Причины', 'Колумб и Магеллан'])},
  {id: 'promyshlennaya', subject: 'istoriya', grade: 8, section: 'Новое время', title: 'Промышленная революция', hook: 'Как паровая машина изменила, во сколько вы просыпаетесь?', blurb: 'Фабрики, города и новое время.', stages: soon(['Паровая машина', 'Фабрики и города'])},
  // ── английский
  {id: 'present-simple', subject: 'angliyskiy', grade: 3, section: 'Грамматика', title: 'Present Simple', hook: 'Почему «he play» режет слух носителю?', blurb: 'Привычки, расписания и окончание -s.', stages: soon(['Утверждение', 'Вопросы и отрицания'])},
  {id: 'past-simple', subject: 'angliyskiy', grade: 5, section: 'Грамматика', title: 'Past Simple', hook: 'Почему «go» в прошлом превращается в «went»?', blurb: 'Правильные и неправильные глаголы.', stages: soon(['-ed', 'Неправильные глаголы'])},
  {id: 'conditionals', subject: 'angliyskiy', grade: 9, section: 'Грамматика', title: 'Conditionals', hook: '«If I were you» — почему were, а не was?', blurb: 'Четыре типа условных предложений.', stages: soon(['Zero и First', 'Second и Third'])},
  // ── информатика
  {id: 'dvoichnaya', subject: 'informatika', grade: 7, section: 'Информация', title: 'Двоичная система', hook: 'Как компьютер записывает всё на свете двумя цифрами?', blurb: 'Биты, байты и перевод чисел.', stages: soon(['Биты', 'Перевод чисел'])},
  {id: 'algoritmy', subject: 'informatika', grade: 6, section: 'Алгоритмы', title: 'Алгоритмы', hook: 'Чем рецепт борща похож на программу?', blurb: 'Последовательность, ветвление и цикл.', stages: soon(['Что такое алгоритм', 'Ветвления и циклы'])},
  {id: 'python-cikly', subject: 'informatika', grade: 8, section: 'Программирование', title: 'Python: циклы', hook: 'Как написать «спасибо» тысячу раз одной строкой?', blurb: 'for, while и range.', stages: soon(['for и range', 'while'])},
];

export const topicById = (id?: string) => TOPICS.find((t) => t.id === id);
export const isLive = (t: Topic) => t.stages.some((s) => s.video);
export const stageVideo = (s: Stage): Video | undefined => videoBySlug(s.video);
/** progress key of a stage (its video slug, or topic/stage) */
export const stageKey = (t: Topic, s: Stage) => s.video ?? `${t.id}/${s.id}`;
export const topicMinutes = (t: Topic) =>
  Math.round(t.stages.reduce((a, s) => a + (stageVideo(s)?.duration ?? (s.minutes ?? 2) * 60), 0) / 60);
export const topicsOf = (subject: string) => TOPICS.filter((t) => t.subject === subject);
export const GRADES = Array.from({length: 11}, (_, i) => i + 1);
export const topicUrl = (t: Topic, stage?: string) => `/tema/${t.id}${stage ? `/${stage}` : ''}`;
export const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};
