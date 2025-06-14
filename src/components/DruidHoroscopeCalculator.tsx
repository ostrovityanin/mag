
import React, { useState, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDruidSign } from "@/utils/druid-signs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TreePine, Calendar, Star, ChevronDown } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// Массив месяцев для Select
const MONTHS = [
  { label: "Январь", value: 1 },
  { label: "Февраль", value: 2 },
  { label: "Март", value: 3 },
  { label: "Апрель", value: 4 },
  { label: "Май", value: 5 },
  { label: "Июнь", value: 6 },
  { label: "Июль", value: 7 },
  { label: "Август", value: 8 },
  { label: "Сентябрь", value: 9 },
  { label: "Октябрь", value: 10 },
  { label: "Ноябрь", value: 11 },
  { label: "Декабрь", value: 12 },
];

function daysInMonth(month: number, year = 2024) {
  return new Date(year, month, 0).getDate();
}

export const DruidHoroscopeCalculator: React.FC = () => {
  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");
  const [result, setResult] = useState<ReturnType<typeof getDruidSign> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const [desc, setDesc] = useState<string | null>(null);

  const descCache = useRef<{ [signId: string]: string }>({});
  const days =
    month !== ""
      ? Array.from({ length: daysInMonth(Number(month)) }, (_, i) => i + 1)
      : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setDesc(null);
    if (month === "" || day === "") {
      setError("Пожалуйста, выберите месяц и день.");
      return;
    }
    const inputDate = new Date(2024, Number(month) - 1, Number(day));
    if (isNaN(inputDate.getTime())) {
      setError("Некорректная дата.");
      return;
    }
    if (Number(day) > daysInMonth(Number(month))) {
      setError("В выбранном месяце нет такого дня.");
      return;
    }
    const sign = getDruidSign(inputDate);
    if (!sign) {
      setError("Не удалось определить знак. Проверьте правильность даты.");
      return;
    }
    setResult(sign);

    // --- Получение описания знака из Supabase (кеширование) ---
    if (sign.id in descCache.current) {
      setDesc(descCache.current[sign.id]);
      return;
    }
    setDescLoading(true);
    const { data, error } = await supabase
      .from("druid_sign_texts")
      .select("text")
      .eq("sign_id", sign.id)
      .maybeSingle();

    if (error) {
      setDesc(null);
      setDescLoading(false);
      return;
    }
    if (data && data.text) {
      descCache.current[sign.id] = data.text;
      setDesc(data.text);
    } else {
      setDesc(null);
    }
    setDescLoading(false);
  };

  return (
    <div className="w-full min-h-screen py-10 flex justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Шапка: сокращаем и убираем дубль */}
      <div className="w-full max-w-lg px-2 flex flex-col gap-8">
        <header className="flex flex-col items-center mb-2 animate-fade-in">
          <div className="flex items-center gap-2 text-green-800 text-xl sm:text-2xl font-extrabold mb-1 tracking-tight">
            <TreePine className="w-7 h-7 text-green-700 inline-block" />
            <span className="drop-shadow text-3xl font-playfair select-none">
              Кельтский гороскоп деревьев
            </span>
          </div>
          <p className="text-green-700 mt-2 text-sm font-medium opacity-80 italic">
            Определите свой знак по дате рождения
          </p>
        </header>

        <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-tl from-white to-green-50/60 backdrop-blur rounded-2xl transition-all">
          {/* Внутри карточки убираем основной заголовок, оставляем понятную инструкцию */}
          {/* <CardHeader /> больше не нужен */}
          <CardContent className="pt-6 pb-2 px-2 sm:px-6">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center gap-4"
            >
              <label
                className="flex gap-2 items-center text-sm font-medium text-green-900 mb-0"
                htmlFor="druid-date-selectors"
              >
                <Star className="w-4 h-4 text-green-500" />
                Ваша дата рождения:
              </label>
              <div
                id="druid-date-selectors"
                className="flex w-full justify-center gap-3"
              >
                <Select
                  value={month === "" ? "" : String(month)}
                  onValueChange={v => {
                    setMonth(v === "" ? "" : Number(v));
                    setDay("");
                  }}
                >
                  <SelectTrigger className="w-32 shadow border-green-300 focus:ring-2 focus:ring-green-400/60">
                    <SelectValue placeholder="Месяц" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem value={String(m.value)} key={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={day === "" ? "" : String(day)}
                  onValueChange={v => setDay(v === "" ? "" : Number(v))}
                  disabled={month === ""}
                >
                  <SelectTrigger className="w-24 shadow border-green-300 focus:ring-2 focus:ring-green-400/60">
                    <SelectValue placeholder="День" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(d => (
                      <SelectItem value={String(d)} key={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full mt-2 bg-green-700 hover:bg-green-800 text-white font-bold py-2 rounded-xl shadow transition-all text-base tracking-wide"
                size="lg"
              >
                Узнать свой знак
              </Button>
            </form>
            {error && (
              <div className="text-red-600 text-center mt-3 font-semibold">
                {error}
              </div>
            )}
            {result && (
              <div className="mt-8 p-5 bg-green-50/80 border border-green-200 rounded-2xl animate-fade-in shadow-inner drop-shadow flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none select-none">
                  <TreePine className="w-24 h-24 text-green-400" />
                </div>
                <div className="text-5xl mb-2 drop-shadow font-extrabold text-green-800 animate-fade-in-slow select-none">
                  {result.emoji}
                </div>
                <div className="font-extrabold text-2xl text-green-900 mb-2 drop-shadow-sm">
                  {result.name}
                </div>
                {descLoading ? (
                  <div className="flex justify-center items-center gap-1 text-gray-500 mt-4">
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span>Загрузка описания...</span>
                  </div>
                ) : desc ? (
                  <div
                    className="prose prose-sm sm:prose-base max-w-none text-gray-800 text-left mt-2 animate-fade-in"
                    dangerouslySetInnerHTML={{ __html: desc }}
                  />
                ) : (
                  <div className="text-sm text-gray-700 text-center mt-2">
                    {result.description}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Друидский декоративный низ */}
        <div className="flex justify-center mt-3 animate-fade-in">
          <div className="flex gap-1">
            <span className="inline-block text-green-800/70 text-2xl">🌱</span>
            <span className="inline-block text-green-800/70 text-xl">🍃</span>
            <span className="inline-block text-green-800/70 text-2xl">🌿</span>
            <span className="inline-block text-green-800/70 text-xl">🌳</span>
            <span className="inline-block text-green-800/70 text-2xl">🌲</span>
          </div>
        </div>
      </div>
      {/* Фоновый анимированный орнамент — опционально */}
      <div className="fixed left-0 right-0 bottom-0 opacity-30 pointer-events-none z-0">
        <div className="flex justify-center animate-fade-in-slow">
          <span className="text-6xl sm:text-8xl select-none text-emerald-100">🌿</span>
          <span className="text-5xl sm:text-8xl select-none text-emerald-200 -ml-6">🌳</span>
          <span className="text-7xl sm:text-8xl select-none text-emerald-100 -ml-4">🍀</span>
        </div>
      </div>
    </div>
  );
};
