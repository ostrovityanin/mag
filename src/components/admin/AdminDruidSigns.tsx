
import React, { useEffect, useState } from "react";
import { DRUID_SIGNS } from "@/utils/druid-signs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type SignText = { sign_id: string; text: string };

export const AdminDruidSigns: React.FC = () => {
  const [signTexts, setSignTexts] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDescriptions = async () => {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from("druid_sign_texts")
        .select("sign_id,text");
      if (error) {
        setLoadError("Ошибка загрузки описаний: " + error.message);
        setLoading(false);
        return;
      }
      const map: { [id: string]: string } = {};
      if (data) {
        data.forEach((row: SignText) => {
          map[row.sign_id] = row.text;
        });
      }
      setSignTexts(map);
      setLoading(false);
    };
    fetchDescriptions();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Друидские знаки — справочник</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center text-gray-500 py-10">
              <Loader2 className="animate-spin mr-3" />
              Загрузка описаний...
            </div>
          ) : loadError ? (
            <div className="text-center text-red-600 py-6">{loadError}</div>
          ) : (
            <div className="divide-y">
              {DRUID_SIGNS.map((sign) => (
                <div key={sign.id} className="py-6 group">
                  <div className="flex items-center mb-1">
                    <span className="text-2xl mr-3">{sign.emoji}</span>
                    <span className="font-semibold text-lg">{sign.name}</span>
                    <span className="ml-2 text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600">
                      {sign.ranges
                        .map((r) =>
                          r.start === r.end
                            ? r.start.replace("-", ".")
                            : r.start.replace("-", ".") +
                              "—" +
                              r.end.replace("-", ".")
                        )
                        .join(", ")}
                    </span>
                  </div>
                  <div className="text-gray-700 text-sm mt-1 whitespace-pre-line">
                    {/* Для поддержки форматирования используем разметку из базы (Quill/HTML): */}
                    {signTexts[sign.id] ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: signTexts[sign.id] }}
                      />
                    ) : (
                      <span className="italic text-gray-400">
                        Нет описания
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
