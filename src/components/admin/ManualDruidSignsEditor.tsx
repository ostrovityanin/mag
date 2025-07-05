import React, { useState, useEffect } from "react";
import { DRUID_SIGNS } from "@/utils/druid-signs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { PostgrestError } from '@supabase/supabase-js';
import { QuillEditor } from "./QuillEditor";

// Типизация по схеме Supabase
type DruidSignTextRow = Database["public"]["Tables"]["druid_sign_texts"]["Row"];
type DruidSignTextInsert = Database["public"]["Tables"]["druid_sign_texts"]["Insert"];

export const ManualDruidSignsEditor: React.FC = () => {
  // локальное состояние для текстов и статусов загрузки отдельно для каждого знака
  const [texts, setTexts] = useState<{ [id: string]: string }>(() =>
    Object.fromEntries(DRUID_SIGNS.map(sign => [sign.id, ""]))
  );
  const [loadingIds, setLoadingIds] = useState<{ [id: string]: boolean }>(() =>
    Object.fromEntries(DRUID_SIGNS.map(sign => [sign.id, false]))
  );

  // При монтировании - подгружаем то, что есть в базе для каждого знака
  useEffect(() => {
    const fetchTexts = async () => {
      const { data, error } = await supabase
        .from("druid_sign_texts")
        .select("sign_id,text") as {
          data: Array<Pick<DruidSignTextRow, "sign_id" | "text">> | null;
          error: PostgrestError | null;
        };
      if (error) {
        toast({
          title: "Ошибка загрузки описаний",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      if (data) {
        const upd: { [id: string]: string } = { ...texts };
        data.forEach(rec => {
          upd[rec.sign_id] = rec.text;
        });
        setTexts(upd);
      }
    };
    fetchTexts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обработка изменения текста
  const handleChange = (id: string, value: string) => {
    setTexts(prev => ({ ...prev, [id]: value }));
  };

  // Сохранение по конкретному знаку
  const handleSaveSingle = async (sign_id: string) => {
    setLoadingIds(prev => ({ ...prev, [sign_id]: true }));
    try {
      const payload: DruidSignTextInsert = { sign_id, text: texts[sign_id] };
      // upsert по sign_id (обновить или создать новую строку)
      const { error } = await supabase
        .from("druid_sign_texts")
        .upsert([payload], { onConflict: "sign_id" });

      if (error) {
        toast({
          title: `Ошибка сохранения`,
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успешно сохранено!",
          description: `Описание для "${DRUID_SIGNS.find(s => s.id === sign_id)?.name || sign_id}" сохранено.`,
        });
      }
    } catch (e: unknown) {
      toast({
        title: `Ошибка сохранения`,
        description: String(e),
        variant: "destructive",
      });
    }
    setLoadingIds(prev => ({ ...prev, [sign_id]: false }));
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Описание знаков (редактирование)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8">
          {DRUID_SIGNS.map(sign => (
            <div key={sign.id} className="p-4 rounded border border-gray-200 bg-white shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{sign.emoji}</span>
                <span className="font-semibold">{sign.name}</span>
              </div>
              <QuillEditor
                value={texts[sign.id]}
                onChange={(val) => handleChange(sign.id, val)}
                placeholder="Введите/отформатируйте текст описания для этого знака"
                minHeight={120}
                disabled={loadingIds[sign.id]}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSaveSingle(sign.id)}
                  disabled={loadingIds[sign.id]}
                >
                  {loadingIds[sign.id] ? (
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  ) : null}
                  Сохранить
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-8">
          Теперь можно использовать форматирование (жирный, курсив, списки, цитаты) и сохранять красиво размеченный текст прямо в базу.<br />
          При копировании из Word/Google Docs советую очищать форматирование (иконка "ластик" на панели Quill).
        </div>
      </CardContent>
    </Card>
  );
};
