
export type DruidSign = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // Каждый знак может содержать два или три диапазона дат (например, Яблоня)
  ranges: { start: string; end: string }[];
};

// Пример данных для 5 знаков (добавите остальные по аналогии):
export const DRUID_SIGNS: DruidSign[] = [
  {
    id: "beech",
    name: "Бук",
    emoji: "❄️",
    description: `Бук (21 декабря – День зимнего солнцестояния). Символ мудрости, стойкости и зимней созерцательности. Олицетворяет величие, рассудительность и связь с древними знаниями.`,
    ranges: [{ start: "12-21", end: "12-21" }],
  },
  {
    id: "apple",
    name: "Яблоня",
    emoji: "🍎",
    description: `Яблоня (22 декабря – 1 января и 22 июня – 4 июля). Символ любви, изобилия и обновления. Люди этого знака — душевные, гармоничные и заботливые.`,
    ranges: [
      { start: "12-22", end: "01-01" },
      { start: "06-22", end: "07-04" },
    ],
  },
  {
    id: "fir",
    name: "Пихта (ель)",
    emoji: "🎄",
    description: `Пихта (2 – 11 января и 5 – 14 июля). Символ света, вечной жизни и надежды. Отличаются амбициозностью, самоотверженностью и проницательностью.`,
    ranges: [
      { start: "01-02", end: "01-11" },
      { start: "07-05", end: "07-14" },
    ],
  },
  {
    id: "elm",
    name: "Вяз",
    emoji: "⚖️",
    description: `Вяз (12 – 24 января и 15 – 25 июля). Символ справедливости, уверенности, надежности.`,
    ranges: [
      { start: "01-12", end: "01-24" },
      { start: "07-15", end: "07-25" },
    ],
  },
  {
    id: "cypress",
    name: "Кипарис",
    emoji: "🤝",
    description: `Кипарис (25 января – 3 февраля и 26 июля – 4 августа). Символ верности, умения приспосабливаться, смелости.`,
    ranges: [
      { start: "01-25", end: "02-03" },
      { start: "07-26", end: "08-04" },
    ],
  },
  // ... Добавьте остальные 16 знаков по вашему тексту!
];


/**
 * Проверяет входит ли дата (месяц-день) между start и end (start и end могут быть в разных годах)
 */
function isInRange(date: string, start: string, end: string): boolean {
  // date, start, end формата MM-DD или DD-MM, здесь приведём всё к MM-DD.
  // Если период не пересекает смену года:
  if (start <= end) {
    return date >= start && date <= end;
  }
  // Пересечение через Новый год, например: 12-22 - 01-01
  return date >= start || date <= end;
}

/**
 * Находит знак друидского гороскопа по дате
 * @param birth - дата JS Date
 * @returns DruidSign | null
 */
export function getDruidSign(birth: Date): DruidSign | null {
  const m = birth.getMonth() + 1;
  const d = birth.getDate();
  // Формат MM-DD с ведущим 0
  const md = `${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  for (const sign of DRUID_SIGNS) {
    for (const { start, end } of sign.ranges) {
      // Проверка (например, 12-22 - 01-01 или 07-05 - 07-14)
      if (isInRange(md, start, end)) return sign;
    }
  }
  return null;
}
