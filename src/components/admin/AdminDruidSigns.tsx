
import React from "react";
import { DRUID_SIGNS } from "@/utils/druid-signs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminDruidSigns: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Друидские знаки — справочник</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {DRUID_SIGNS.map((sign) => (
              <div key={sign.id} className="py-6 group">
                <div className="flex items-center mb-1">
                  <span className="text-2xl mr-3">{sign.emoji}</span>
                  <span className="font-semibold text-lg">{sign.name}</span>
                  <span className="ml-2 text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600">
                    {sign.ranges
                      .map((r, idx) =>
                        r.start === r.end
                          ? r.start.replace("-", ".")
                          : r.start.replace("-", ".") + "—" + r.end.replace("-", "."),
                      )
                      .join(", ")}
                  </span>
                </div>
                <div className="text-gray-700 text-sm mt-1 whitespace-pre-line">
                  {sign.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
