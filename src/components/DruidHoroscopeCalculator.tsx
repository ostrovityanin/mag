
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDruidSign } from "@/utils/druid-signs";

// Вспомогательные массивы для месяцев и дней
const MONTHS = [
  { value: 1, label: "Январь" },
  { value: 2, label: "Февраль" },
  { value: 3, label: "Март" },
  { value: 4, label: "Апрель" },
  { value: 5, label: "Май" },
  { value: 6, label: "Июнь" },
  { value: 7, label: "Июль" },
  { value: 8, label: "Август" },
  { value: 9, label: "Сентябрь" },
  { value: 10, label: "Октябрь" },
  { value: 11, label: "Ноябрь" },
  { value: 12, label: "Декабрь" },
];

function daysInMonth(month: number): number {
  // используем 2024 год чтобы гарантировать 29 дней в феврале (високосный год)
  return new Date(2024, month, 0).getDate();
}

export const DruidHoroscopeCalculator: React.FC = () => {
  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");
  const [result, setResult] = useState<ReturnType<typeof getDruidSign> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Пересчитываем количество дней при смене месяца
  const days =
    month !== "" ? Array.from({ length: daysInMonth(Number(month)) }, (_, i) => i + 1) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (month === "" || day === "") {
      setError("Пожалуйста, выберите месяц и день.");
      return;
    }
    // Формируем JS Date с выбранными значениями месяца и дня. Год любой, т.к. getDruidSign использует только месяц и день.
    const inputDate = new Date(2024, Number(month) - 1, Number(day)); // 2024 год безопасен для февраля
    if (isNaN(inputDate.getTime())) {
      setError("Некорректная дата.");
      return;
    }

    // Безопасная проверка: выбранный день не больше количества дней в месяце
    if (Number(day) > daysInMonth(Number(month))) {
      setError("В выбранном месяце нет такого дня.");
      return;
    }

    const sign = getDruidSign(inputDate);
    if (!sign) setError("Не удалось определить знак. Проверьте правильность даты.");
    else setResult(sign);
  };

  return (
    <div className="w-full max-w-md mx-auto py-10 animate-fade-in">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>🌳 Друидский гороскоп-калькулятор</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Выберите вашу дату рождения:
            </label>
            <div className="flex items-center gap-2">
              {/* Выбор месяца */}
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={month}
                onChange={e => {
                  setMonth(e.target.value === "" ? "" : Number(e.target.value));
                  setDay(""); // сбрасываем день при смене месяца
                }}
                required
              >
                <option value="">Месяц</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {/* Выбор дня */}
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={day}
                onChange={e => setDay(e.target.value === "" ? "" : Number(e.target.value))}
                required
                disabled={month === ""}
              >
                <option value="">День</option>
                {days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full mt-2">
              Узнать свой знак
            </Button>
          </form>
          {error && (
            <div className="text-red-600 text-center mt-4">{error}</div>
          )}
          {result && (
            <div className="mt-8 p-4 rounded-lg bg-green-50 border border-green-200 text-center animate-fade-in">
              <div className="text-4xl mb-1">{result.emoji}</div>
              <div className="font-bold text-lg mb-2">{result.name}</div>
              <div className="text-sm text-gray-700">{result.description}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
