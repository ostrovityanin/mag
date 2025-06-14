
import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDruidSign } from "@/utils/druid-signs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// ... MONTHS и daysInMonth без изменений ...

export const DruidHoroscopeCalculator: React.FC = () => {
  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");
  const [result, setResult] = useState<ReturnType<typeof getDruidSign> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const [desc, setDesc] = useState<string | null>(null);

  // Кеш описаний по id знака
  const descCache = useRef<{ [signId: string]: string }>({});

  // ... вычисление days для dropdown ...

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

    // Пытаемся загрузить описание из Supabase
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
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={month}
                onChange={e => {
                  setMonth(e.target.value === "" ? "" : Number(e.target.value));
                  setDay("");
                }}
                required
              >
                <option value="">Месяц</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
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
              {descLoading ? (
                <div className="flex justify-center items-center gap-1 text-gray-500">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Загрузка описания...</span>
                </div>
              ) : desc ? (
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none mx-auto"
                  dangerouslySetInnerHTML={{ __html: desc }}
                />
              ) : (
                <div className="text-sm text-gray-700">{result.description}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
