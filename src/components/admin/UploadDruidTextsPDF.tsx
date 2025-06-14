
import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DRUID_SIGNS } from "@/utils/druid-signs";
// Импорт API pdf.js для браузера актуальной версией
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Настраиваем workerSrc строкой для браузера и Vite
GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js";

type ParsedTexts = { [signId: string]: string };

export const UploadDruidTextsPDF: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [parsedTexts, setParsedTexts] = useState<ParsedTexts>({});
  const [loading, setLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const druidTitles: { [signId: string]: { name: string } } = DRUID_SIGNS.reduce(
    (acc, sign) => {
      acc[sign.id] = { name: sign.name };
      return acc;
    },
    {} as { [signId: string]: { name: string } }
  );

  function splitBySigns(pdfText: string): ParsedTexts {
    const result: ParsedTexts = {};
    const signNames = DRUID_SIGNS.map((s) => s.name);
    const signPattern = new RegExp(
      `(${signNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})`,
      "g"
    );

    let txt = pdfText.replace(signPattern, "\n@@SIGN@@$1\n");
    let sections = txt.split("\n@@SIGN@@").filter(Boolean);

    for (let section of sections) {
      let foundSign = DRUID_SIGNS.find((s) => section.trim().startsWith(s.name));
      if (foundSign) {
        result[foundSign.id] = section.trim().slice(foundSign.name.length).trim();
      }
    }
    return result;
  }

  async function extractPDFText(file: File): Promise<string> {
    const typedarray = new Uint8Array(await file.arrayBuffer());
    // Получаем pdf-документ через getDocument
    const pdf = await getDocument({ data: typedarray }).promise as any;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true);
    setPdfError(null);
    setParsedTexts({});
    try {
      const pdfText = await extractPDFText(e.target.files[0]);
      const texts = splitBySigns(pdfText);
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
