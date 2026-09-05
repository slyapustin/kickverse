export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Rarity = 'bronze' | 'silver' | 'gold';

export interface Country { code: string; name: string; flag: string; }
export interface Club { id: string; name: string; color: string; color2: string; }
export interface PlayerDef {
  id: string;
  name: string;      // full name
  short: string;     // surname for commentary / cards
  country: string;   // Country.code
  club: string;      // Club.id
  pos: Position;
  rating: number;    // 50..99
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  face: string;      // emoji face
}

export const COUNTRIES: Record<string, Country> = {
  BR: { code: 'BR', name: 'Бразилия', flag: '🇧🇷' },
  AR: { code: 'AR', name: 'Аргентина', flag: '🇦🇷' },
  FR: { code: 'FR', name: 'Франция', flag: '🇫🇷' },
  ES: { code: 'ES', name: 'Испания', flag: '🇪🇸' },
  DE: { code: 'DE', name: 'Германия', flag: '🇩🇪' },
  IT: { code: 'IT', name: 'Италия', flag: '🇮🇹' },
  PT: { code: 'PT', name: 'Португалия', flag: '🇵🇹' },
  GB: { code: 'GB', name: 'Англия', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  NL: { code: 'NL', name: 'Нидерланды', flag: '🇳🇱' },
  BE: { code: 'BE', name: 'Бельгия', flag: '🇧🇪' },
  RU: { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  HR: { code: 'HR', name: 'Хорватия', flag: '🇭🇷' },
  NO: { code: 'NO', name: 'Норвегия', flag: '🇳🇴' },
  JP: { code: 'JP', name: 'Япония', flag: '🇯🇵' },
  KR: { code: 'KR', name: 'Корея', flag: '🇰🇷' },
  US: { code: 'US', name: 'США', flag: '🇺🇸' },
  MX: { code: 'MX', name: 'Мексика', flag: '🇲🇽' },
  NG: { code: 'NG', name: 'Нигерия', flag: '🇳🇬' },
  SN: { code: 'SN', name: 'Сенегал', flag: '🇸🇳' },
  MA: { code: 'MA', name: 'Марокко', flag: '🇲🇦' },
  EG: { code: 'EG', name: 'Египет', flag: '🇪🇬' },
  UY: { code: 'UY', name: 'Уругвай', flag: '🇺🇾' },
  CO: { code: 'CO', name: 'Колумбия', flag: '🇨🇴' },
  TR: { code: 'TR', name: 'Турция', flag: '🇹🇷' },
  PL: { code: 'PL', name: 'Польша', flag: '🇵🇱' },
  SE: { code: 'SE', name: 'Швеция', flag: '🇸🇪' },
  DK: { code: 'DK', name: 'Дания', flag: '🇩🇰' },
  CH: { code: 'CH', name: 'Швейцария', flag: '🇨🇭' },
  AU: { code: 'AU', name: 'Австралия', flag: '🇦🇺' },
  CA: { code: 'CA', name: 'Канада', flag: '🇨🇦' },
};

export const CLUBS: Record<string, Club> = {
  royal:   { id: 'royal',   name: 'Роял Мадрид',     color: '#ffffff', color2: '#7a5cff' },
  barca:   { id: 'barca',   name: 'Барселона Стар',  color: '#a50044', color2: '#004d98' },
  redman:  { id: 'redman',  name: 'Манчестер Ред',   color: '#da291c', color2: '#fbe122' },
  skyblue: { id: 'skyblue', name: 'Сити Блю',        color: '#6cabdd', color2: '#1c2c5b' },
  liver:   { id: 'liver',   name: 'Ливер Рэд',       color: '#c8102e', color2: '#00b2a9' },
  bayern:  { id: 'bayern',  name: 'Бавария Ройял',   color: '#dc052d', color2: '#0066b2' },
  psg:     { id: 'psg',     name: 'Париж Эйфель',    color: '#004170', color2: '#da291c' },
  juve:    { id: 'juve',    name: 'Турин Зебра',     color: '#000000', color2: '#ffffff' },
  milan:   { id: 'milan',   name: 'Милан Россо',     color: '#fb090b', color2: '#000000' },
  inter:   { id: 'inter',   name: 'Интер Неро',      color: '#010e80', color2: '#000000' },
  ajax:    { id: 'ajax',    name: 'Амстердам Аякс',  color: '#d2122e', color2: '#ffffff' },
  dortmund:{ id: 'dortmund',name: 'Дортмунд Гелб',   color: '#fde100', color2: '#000000' },
  atleti:  { id: 'atleti',  name: 'Атлетико Рохо',   color: '#cb3524', color2: '#272e61' },
  chelsea: { id: 'chelsea', name: 'Лондон Блюз',     color: '#034694', color2: '#ffffff' },
  arsenal: { id: 'arsenal', name: 'Арсенал Ганнерс', color: '#ef0107', color2: '#ffffff' },
  benfica: { id: 'benfica', name: 'Лиссабон Иглз',   color: '#e83030', color2: '#ffffff' },
  zenit:   { id: 'zenit',   name: 'Зенит Невский',   color: '#0090d0', color2: '#ffffff' },
  spartak: { id: 'spartak', name: 'Спартак Ромб',    color: '#d30000', color2: '#ffffff' },
  galata:  { id: 'galata',  name: 'Галата Лайонс',   color: '#a90432', color2: '#fdb912' },
  miami:   { id: 'miami',   name: 'Майами Пинк',     color: '#f7b5cd', color2: '#231f20' },
};

const FACES = ['🧑', '👨', '👦', '🧔', '👨‍🦱', '👨‍🦰', '👨‍🦳', '🧑‍🦱', '🧑‍🦰', '👱', '👨🏾', '👨🏿', '🧑🏾', '👨🏽', '🧑🏽', '👨🏻'];

type Row = [name: string, country: string, club: string, pos: Position, rating: number];

// Fictional players (surname first token of `short` comes from the last word).
const ROWS: Row[] = [
  // GOLD (85+)
  ['Лео Мартинес', 'AR', 'miami', 'FWD', 93],
  ['Кристиан Рональдес', 'PT', 'royal', 'FWD', 91],
  ['Килиан Мбаппо', 'FR', 'royal', 'FWD', 92],
  ['Эрлинг Холандсен', 'NO', 'skyblue', 'FWD', 91],
  ['Винисиус Жуниор', 'BR', 'royal', 'FWD', 90],
  ['Кевин Де Брюйс', 'BE', 'skyblue', 'MID', 90],
  ['Лука Модрич', 'HR', 'royal', 'MID', 88],
  ['Джуд Беллинген', 'GB', 'royal', 'MID', 89],
  ['Родри Эрнандо', 'ES', 'skyblue', 'MID', 89],
  ['Мохамед Салахи', 'EG', 'liver', 'FWD', 89],
  ['Гарри Кейнс', 'GB', 'bayern', 'FWD', 89],
  ['Роберт Левандо', 'PL', 'barca', 'FWD', 88],
  ['Вирджил ван Дейкс', 'NL', 'liver', 'DEF', 89],
  ['Рубен Диаш', 'PT', 'skyblue', 'DEF', 88],
  ['Тибо Куртуа', 'BE', 'royal', 'GK', 89],
  ['Алисон Бекер', 'BR', 'liver', 'GK', 89],
  ['Марк-Андре тер Штеген', 'DE', 'barca', 'GK', 88],
  ['Ламин Ямаль', 'ES', 'barca', 'FWD', 87],
  ['Педри Гонсалес', 'ES', 'barca', 'MID', 87],
  ['Букайо Сака', 'GB', 'arsenal', 'FWD', 87],
  ['Мартин Эдегор', 'NO', 'arsenal', 'MID', 87],
  ['Антуан Гризман', 'FR', 'atleti', 'FWD', 86],
  ['Джошуа Киммих', 'DE', 'bayern', 'MID', 86],
  ['Ашраф Хакими', 'MA', 'psg', 'DEF', 86],
  ['Уильям Салиба', 'FR', 'arsenal', 'DEF', 86],
  ['Виктор Осимхен', 'NG', 'galata', 'FWD', 86],
  ['Лаутаро Мартинес', 'AR', 'inter', 'FWD', 86],
  ['Федерико Вальверде', 'UY', 'royal', 'MID', 87],
  ['Рафаэль Леао', 'PT', 'milan', 'FWD', 85],
  ['Садио Мане', 'SN', 'benfica', 'FWD', 85],
  // SILVER (72..84)
  ['Артём Дзюбин', 'RU', 'zenit', 'FWD', 80],
  ['Александр Головкин', 'RU', 'spartak', 'MID', 79],
  ['Матвей Сафонов', 'RU', 'psg', 'GK', 80],
  ['Такефуса Кубо', 'JP', 'royal', 'FWD', 81],
  ['Сон Хын Мин', 'KR', 'chelsea', 'FWD', 84],
  ['Кристиан Пулишич', 'US', 'milan', 'FWD', 82],
  ['Сантьяго Хименес', 'MX', 'milan', 'FWD', 80],
  ['Луис Диас', 'CO', 'liver', 'FWD', 83],
  ['Хакан Чалханоглу', 'TR', 'inter', 'MID', 83],
  ['Александер Исак', 'SE', 'liver', 'FWD', 84],
  ['Расмус Хойлунд', 'DK', 'redman', 'FWD', 78],
  ['Гранит Джака', 'CH', 'arsenal', 'MID', 82],
  ['Матс Раймерс', 'AU', 'dortmund', 'GK', 76],
  ['Альфонсо Дэвис', 'CA', 'bayern', 'DEF', 83],
  ['Николо Барелла', 'IT', 'inter', 'MID', 84],
  ['Алессандро Бастони', 'IT', 'inter', 'DEF', 83],
  ['Джанлуиджи Доннарумма', 'IT', 'skyblue', 'GK', 84],
  ['Френки де Йонг', 'NL', 'barca', 'MID', 83],
  ['Коди Гакпо', 'NL', 'liver', 'FWD', 82],
  ['Юлиан Брандт', 'DE', 'dortmund', 'MID', 80],
  ['Флориан Виртц', 'DE', 'liver', 'MID', 84],
  ['Уго Экитике', 'FR', 'liver', 'FWD', 79],
  ['Бруну Фернандеш', 'PT', 'redman', 'MID', 84],
  ['Диогу Кошта', 'PT', 'benfica', 'GK', 82],
  ['Эмилиано Мартинес', 'AR', 'atleti', 'GK', 84],
  ['Хулиан Альварес', 'AR', 'atleti', 'FWD', 84],
  ['Родриго Гоэс', 'BR', 'royal', 'FWD', 84],
  ['Маркиньос Силва', 'BR', 'psg', 'DEF', 83],
  ['Уэсли Фофана', 'FR', 'chelsea', 'DEF', 78],
  ['Деклан Райс', 'GB', 'arsenal', 'MID', 83],
  ['Коул Палмер', 'GB', 'chelsea', 'MID', 84],
  ['Микки ван де Вен', 'NL', 'ajax', 'DEF', 80],
  ['Йоско Гвардиол', 'HR', 'skyblue', 'DEF', 84],
  ['Дани Ольмо', 'ES', 'barca', 'MID', 82],
  ['Дани Карвахаль', 'ES', 'royal', 'DEF', 82],
  ['Юнус Муса', 'US', 'milan', 'MID', 76],
  ['Кенан Йылдыз', 'TR', 'juve', 'FWD', 79],
  ['Пьер Хойбьерг', 'DK', 'atleti', 'MID', 78],
  ['Виктор Линделёф', 'SE', 'redman', 'DEF', 76],
  ['Мохаммед Кудус', 'NG', 'chelsea', 'FWD', 77],
  // BRONZE (55..71)
  ['Иван Петровский', 'RU', 'zenit', 'DEF', 66],
  ['Даниил Волков', 'RU', 'spartak', 'MID', 64],
  ['Никита Соколов', 'RU', 'zenit', 'GK', 65],
  ['Пабло Ортега', 'ES', 'atleti', 'DEF', 68],
  ['Марко Росси', 'IT', 'juve', 'DEF', 67],
  ['Луис Феррейра', 'BR', 'benfica', 'MID', 69],
  ['Томас Мюллерс', 'DE', 'dortmund', 'FWD', 70],
  ['Джек Тейлор', 'GB', 'chelsea', 'DEF', 63],
  ['Хироси Танака', 'JP', 'ajax', 'MID', 65],
  ['Кофи Менса', 'NG', 'galata', 'FWD', 68],
  ['Оливье Дюпон', 'FR', 'psg', 'GK', 66],
  ['Сем де Вриз', 'NL', 'ajax', 'FWD', 67],
  ['Матео Диас', 'AR', 'miami', 'MID', 66],
  ['Диего Рамирес', 'MX', 'miami', 'DEF', 62],
  ['Юсуф Кая', 'TR', 'galata', 'DEF', 64],
  ['Йонас Хансен', 'DK', 'ajax', 'GK', 62],
  ['Лукас Новак', 'PL', 'dortmund', 'DEF', 63],
  ['Эрик Бергстрём', 'SE', 'juve', 'MID', 65],
  ['Ноа Уилсон', 'US', 'miami', 'GK', 61],
  ['Лиам Оконкво', 'CA', 'skyblue', 'FWD', 64],
  ['Бабакар Ндиай', 'SN', 'redman', 'DEF', 66],
  ['Амин Беназзи', 'MA', 'psg', 'MID', 68],
  ['Омар Хасан', 'EG', 'galata', 'FWD', 63],
  ['Матиас Перейра', 'UY', 'inter', 'DEF', 67],
  ['Хуан Кастро', 'CO', 'benfica', 'MID', 66],
  ['Ким Мин Су', 'KR', 'bayern', 'DEF', 69],
  ['Марко Хубер', 'CH', 'bayern', 'GK', 64],
  ['Пётр Ковальчик', 'PL', 'spartak', 'MID', 62],
  ['Райан Смит', 'AU', 'liver', 'DEF', 60],
  ['Оле Йохансен', 'NO', 'zenit', 'FWD', 61],
  ['Иво Ковачевич', 'HR', 'milan', 'MID', 66],
  ['Ремко Виссер', 'NL', 'redman', 'GK', 63],
];

function seeded(str: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

function buildStats(pos: Position, rating: number, rnd: () => number) {
  const j = () => Math.round((rnd() - 0.5) * 10);
  const clamp = (v: number) => Math.max(30, Math.min(99, v));
  const base = { pace: rating, shooting: rating, passing: rating, dribbling: rating, defending: rating };
  switch (pos) {
    case 'GK': base.shooting -= 40; base.dribbling -= 30; base.pace -= 15; base.defending += 4; break;
    case 'DEF': base.defending += 6; base.shooting -= 20; base.dribbling -= 8; break;
    case 'MID': base.passing += 6; base.defending -= 6; base.shooting -= 5; break;
    case 'FWD': base.shooting += 6; base.pace += 4; base.defending -= 25; break;
  }
  return {
    pace: clamp(base.pace + j()), shooting: clamp(base.shooting + j()), passing: clamp(base.passing + j()),
    dribbling: clamp(base.dribbling + j()), defending: clamp(base.defending + j()),
  };
}

export const PLAYERS: PlayerDef[] = ROWS.map(([name, country, club, pos, rating], i) => {
  const rnd = seeded(name);
  const parts = name.split(' ');
  return {
    id: `p${i}`, name, short: parts[parts.length - 1], country, club, pos, rating,
    ...buildStats(pos, rating, rnd),
    face: FACES[Math.floor(rnd() * FACES.length)],
  };
});

export const PLAYER_BY_ID: Record<string, PlayerDef> = Object.fromEntries(PLAYERS.map(p => [p.id, p]));

export function rarityOf(rating: number): Rarity {
  return rating >= 85 ? 'gold' : rating >= 72 ? 'silver' : 'bronze';
}

export const POS_NAME: Record<Position, string> = { GK: 'Вратарь', DEF: 'Защитник', MID: 'Полузащитник', FWD: 'Нападающий' };
export const POS_SHORT: Record<Position, string> = { GK: 'ВР', DEF: 'ЗЩ', MID: 'ПЗ', FWD: 'НП' };
