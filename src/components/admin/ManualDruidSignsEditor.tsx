
import React, { useState } from "react";
import { DRUID_SIGNS } from "@/utils/druid-signs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SignTextRecord {
  sign_id: string;
  text: string;
  id?: string;
  updated_at?: string;
}

export const ManualDruidSignsEditor: React.FC = () => {
  const [texts, setTexts] = useState<{ [id: string]: string }>(() =>
    Object.fromEntries(DRUID_SIGNS.map(sign => [sign.id, ""]))
  );
  const [loading, setLoading] = useState(false);

  // Обновляем state для одного знака
  const handleChange = (id: string, value: string) => {
    setTexts(prev => ({ ...prev, [id]: value }));
  };

  // Загружаем тексты из базы по sign_id
  const handleLoadFromDb = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from<SignTextRecord>("druid_sign_texts")
        .select("sign_id,text");

      if (error) {
        toast({
          title: "Ошибка загрузки из базы",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        // Обновим state, если описание есть для знака
        const loaded: { [id: string]: string } = { ...texts };
        data.forEach(record => {
          loaded[record.sign_id] = record.text;
        });
        setTexts(loaded);
        toast({
          title: "Данные загружены",
          description: "Все описания успешно загружены из базы.",
        });
      }
    } catch (e: any) {
      toast({
        title: "Неизвестная ошибка загрузки",
        description: String(e),
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Сохраняем все значения в Supabase (upsert по sign_id)
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Преобразуем в массив {sign_id, text}
      const records: SignTextRecord[] = Object.entries(texts).map(
        ([sign_id, text]) => ({
          sign_id,
          text,
        })
      );
      // upsert по sign_id (повторно создаём или обновляем)
      const { error } = await supabase
        .from<SignTextRecord>("druid_sign_texts")
        .upsert(records, { onConflict: "sign_id" });

      if (error) {
        toast({
          title: "Ошибка сохранения",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Сохранено",
          description: "Все описания успешно сохранены в базе.",
        });
      }
    } catch (e: any) {
      toast({
        title: "Ошибка сохранения",
        description: String(e),
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Ручной ввод/редактирование описаний знаков</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4 gap-4">
          <Button onClick={handleLoadFromDb} disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Загрузить из базы
          </Button>
          <Button onClick={handleSaveAll} disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Сохранить всё в базу
          </Button>
        </div>
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
                disabled={loading}
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
