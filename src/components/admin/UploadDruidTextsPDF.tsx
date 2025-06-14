
import React, { useRef, useState } from "react";
import pdfParse from "pdf-parse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DRUID_SIGNS } from "@/utils/druid-signs";

type ParsedTexts = { [signId: string]: string };

export const UploadDruidTextsPDF: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [parsedTexts, setParsedTexts] = useState<ParsedTexts>({});
  const [loading, setLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Определяем ключевые слова (можно менять по структуре PDF)
  const druidTitles: { [signId: string]: { name: string } } = DRUID_SIGNS.reduce(
    (acc, sign) => {
      acc[sign.id] = { name: sign.name };
      return acc;
    },
    {} as { [signId: string]: { name: string } }
  );

  // Парсим текст по именам знаков (упрощённо - ищем заголовки)
  function splitBySigns(pdfText: string): ParsedTexts {
    const result: ParsedTexts = {};
    // Готовим массив шаблонов-для поиска
    const signNames = DRUID_SIGNS.map((s) => s.name);
    const signPattern = new RegExp(
      `(${signNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})`,
      "g"
    );

    // Добавляем спец.~~ЗАМЕНЯЕМ все вхождения имен знаков на маркер-разделитель
    let txt = pdfText.replace(signPattern, "\n@@SIGN@@$1\n");
    let sections = txt.split("\n@@SIGN@@").filter(Boolean);

    // Перебираем секции, первая не принадлежит ни одному знаку - пропускаем
    for (let section of sections) {
      let foundSign = DRUID_SIGNS.find((s) => section.trim().startsWith(s.name));
      if (foundSign) {
        result[foundSign.id] = section.trim().slice(foundSign.name.length).trim();
      }
    }
    return result;
  }

  // Обработчик файла
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true);
    setPdfError(null);
    setParsedTexts({});
    try {
      const arrayBuffer = await e.target.files[0].arrayBuffer();
      const pdfData = await pdfParse(arrayBuffer);
      const texts = splitBySigns(pdfData.text);
      setParsedTexts(texts);
      if (Object.keys(texts).length === 0) {
        setPdfError("Не удалось распознать знаки в PDF — проверьте структуру файла.");
      }
    } catch (err) {
      setPdfError("Ошибка при разборе PDF: " + (err instanceof Error ? err.message : "Неизвестная ошибка"));
    }
    setLoading(false);
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Загрузка PDF с текстами знаков</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <input
            type="file"
            accept=".pdf"
            ref={inputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Загрузка..." : "Загрузить PDF"}
          </Button>
          {pdfError && (
            <div className="text-red-500 text-sm">{pdfError}</div>
          )}
          {Object.keys(parsedTexts).length > 0 && (
            <div className="mt-4 w-full">
              <div className="text-sm text-gray-700 mb-2">
                Распознанные тексты по знакам:
              </div>
              <ul className="space-y-3">
                {DRUID_SIGNS.map((sign) => (
                  <li key={sign.id} className="border rounded p-2">
                    <b>{sign.emoji} {sign.name}</b>
                    <div className="text-xs mt-1 whitespace-pre-line">
                      {parsedTexts[sign.id]
                        ? parsedTexts[sign.id].slice(0, 300) + (parsedTexts[sign.id].length > 300 ? "..." : "")
                        : <span className="text-gray-400">Нет текста</span>
                      }
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            В PDF должны быть явно выделенные заголовки вида "Яблоня", "Пихта (ель)" и т.п.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
