
import React, { useState } from "react";
import { DRUID_SIGNS } from "@/utils/druid-signs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export const ManualDruidSignsEditor: React.FC = () => {
  // состояния: отдельное поле для каждого знака
  const [texts, setTexts] = useState<{ [id: string]: string }>(() =>
    Object.fromEntries(DRUID_SIGNS.map(sign => [sign.id, ""]))
  );

  const handleChange = (id: string, value: string) => {
    setTexts(prev => ({ ...prev, [id]: value }));
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Ручной ввод/редактирование описаний знаков</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {DRUID_SIGNS.map(sign => (
            <div key={sign.id}>
              <label className="font-semibold text-base mb-1 flex items-center gap-2" htmlFor={`text-${sign.id}`}>
                <span className="text-2xl">{sign.emoji}</span>
                {sign.name}
              </label>
              <Textarea
                id={`text-${sign.id}`}
                className="w-full bg-gray-50"
                placeholder="Вставьте/напишите полный текст описания с нужной разметкой для этого знака"
                style={{ minHeight: 120 }}
                value={texts[sign.id]}
                onChange={e => handleChange(sign.id, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-6">
          Вы можете спокойно вставлять <b>очень длинные</b> тексты с разметкой (html, теги, переносы и т.п.) для каждого знака.
        </div>
      </CardContent>
    </Card>
  );
};
