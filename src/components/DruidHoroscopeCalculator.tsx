
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDruidSign } from "@/utils/druid-signs";

/**
 * Калькулятор друидского гороскопа:
 * - Позволяет ввести дату рождения
 * - Показывает знак и его описание из druids-signs.ts
 */
export const DruidHoroscopeCalculator: React.FC = () => {
  const [birth, setBirth] = useState<string>("");
  const [result, setResult] = useState<ReturnType<typeof getDruidSign> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!birth) {
      setError("Пожалуйста, выберите дату рождения.");
      return;
    }
    const date = new Date(birth);
    if (isNaN(date.getTime())) {
      setError("Некорректная дата.");
      return;
    }
    const sign = getDruidSign(date);
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
              Введите вашу дату рождения:
            </label>
            <Input
              type="date"
              value={birth}
              onChange={e => setBirth(e.target.value)}
              required
              max={new Date().toISOString().slice(0, 10)}
            />
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
