export type DruidSign = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  ranges: { start: string; end: string }[];
};

// Новый массив знаков без описаний, с вашими диапазонами дат
export const DRUID_SIGNS: DruidSign[] = [
  {
    id: "apple",
    name: "Яблоня",
    emoji: "🍎",
    description: "",
    ranges: [
      { start: "12-23", end: "01-01" },
      { start: "06-25", end: "07-04" }
    ]
  },
  {
    id: "fir",
    name: "Пихта",
    emoji: "🎄",
    description: "",
    ranges: [
      { start: "01-02", end: "01-11" },
      { start: "07-05", end: "07-14" }
    ]
  },
  {
    id: "elm",
    name: "Вяз",
    emoji: "🌳",
    description: "",
    ranges: [
      { start: "01-12", end: "01-24" },
      { start: "07-15", end: "07-25" }
    ]
  },
  {
    id: "cypress",
    name: "Кипарис",
    emoji: "🌲",
    description: "",
    ranges: [
      { start: "01-25", end: "02-03" },
      { start: "07-26", end: "08-04" }
    ]
  },
  {
    id: "poplar",
    name: "Тополь",
    emoji: "🌳",
    description: "",
    ranges: [
      { start: "02-04", end: "02-08" },
      { start: "05-01", end: "05-14" },
      { start: "08-05", end: "08-13" },
      { start: "11-03", end: "11-11" }
    ]
  },
  {
    id: "larch",
    name: "Лиственница",
    emoji: "🌲",
    description: "",
    ranges: [
      { start: "02-09", end: "02-18" },
      { start: "08-14", end: "08-23" }
    ]
  },
  {
    id: "pine",
    name: "Сосна",
    emoji: "🌲",
    description: "",
    ranges: [
      { start: "02-19", end: "02-29" },
      { start: "08-24", end: "09-02" }
    ]
  },
  {
    id: "willow",
    name: "Ива",
    emoji: "🌿",
    description: "",
    ranges: [
      { start: "03-01", end: "03-10" },
      { start: "09-03", end: "09-12" }
    ]
  },
  {
    id: "lime",
    name: "Липа",
    emoji: "🍋",
    description: "",
    ranges: [
      { start: "03-11", end: "03-20" },
      { start: "09-13", end: "09-22" }
    ]
  },
  {
    id: "oak",
    name: "Дуб",
    emoji: "🌳",
    description: "",
    ranges: [
      { start: "03-21", end: "03-21" }
    ]
  },
  {
    id: "alder",
    name: "Ольха",
    emoji: "🌱",
    description: "",
    ranges: [
      { start: "09-23", end: "09-23" }
    ]
  },
  {
    id: "hazelnut",
    name: "Орешник",
    emoji: "🌰",
    description: "",
    ranges: [
      { start: "03-22", end: "03-31" },
      { start: "09-24", end: "10-03" }
    ]
  },
  {
    id: "rowan",
    name: "Рябина",
    emoji: "🍒",
    description: "",
    ranges: [
      { start: "04-01", end: "04-10" },
      { start: "10-04", end: "10-13" }
    ]
  },
  {
    id: "maple",
    name: "Клён",
    emoji: "🍁",
    description: "",
    ranges: [
      { start: "04-11", end: "04-20" },
      { start: "10-14", end: "10-23" }
    ]
  },
  {
    id: "walnut",
    name: "Грецкий орех",
    emoji: "🥜",
    description: "",
    ranges: [
      { start: "04-21", end: "04-30" },
      { start: "10-24", end: "11-02" }
    ]
  },
  {
    id: "chestnut",
    name: "Каштан",
    emoji: "🌰",
    description: "",
    ranges: [
      { start: "05-15", end: "05-24" },
      { start: "11-12", end: "11-21" }
    ]
  },
  {
    id: "ash",
    name: "Ясень",
    emoji: "🍃",
    description: "",
    ranges: [
      { start: "05-25", end: "06-03" },
      { start: "11-22", end: "12-01" }
    ]
  },
  {
    id: "hornbeam",
    name: "Граб",
    emoji: "🌿",
    description: "",
    ranges: [
      { start: "06-04", end: "06-13" },
      { start: "12-02", end: "12-11" }
    ]
  },
  {
    id: "aspen",
    name: "Осина",
    emoji: "🌳",
    description: "",
    ranges: [
      { start: "06-14", end: "06-23" },
      { start: "12-12", end: "12-21" }
    ]
  },
  {
    id: "birch",
    name: "Берёза",
    emoji: "🌱",
    description: "",
    ranges: [
      { start: "06-24", end: "06-24" }
    ]
  },
  {
    id: "beech",
    name: "Бук",
    emoji: "❄️",
    description: "",
    ranges: [
      { start: "12-21", end: "12-22" }
    ]
  },
];

// Остальные функции и экспорт — без изменений!
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
