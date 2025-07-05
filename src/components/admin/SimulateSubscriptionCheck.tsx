
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChannels } from "@/hooks/useChannels";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export const SimulateSubscriptionCheck: React.FC = () => {
  const [userInput, setUserInput] = useState("");
  const [appCode, setAppCode] = useState("druid");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: channels, isLoading: channelsLoading } = useChannels(appCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    setResult(null);
    try {
      if (!userInput.trim()) {
        setErrorMsg("Введите username или telegram_id для имитации.");
        setLoading(false);
        return;
      }
      // найдем канал идентификаторы (как в useUserSubscriptions)
      // Формируем массив идентификаторов для передачи
      const requiredChannels =
        channels?.filter((ch) => ch.required) || [];
      const channelIdentifiers: string[] = requiredChannels.map(
        (c) => c.chat_id || c.username
      );
      // Вызовем функцию "simple-check-subscription" прямо через fetch (как это делают обычные пользователи)
      const body = {
        userId: userInput.trim(),
        channelIds: channelIdentifiers,
        appCode,
        // username для логов можно пробросить, если явно введён username (санитизируем @)
        username:
          userInput.match(/^[a-zA-Z0-9_]+$/)
            ? userInput
            : undefined,
      };

      const resp = await fetch(
        "https://shytgcmkvycrpzhlsfbc.supabase.co/functions/v1/simple-check-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey":
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoeXRnY21rdnljcnB6aGxzZmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDE0NDUsImV4cCI6MjA2NDUxNzQ0NX0.yAxuIxp9YEPRT6-iSybXev3hY6Kcmns3-cS3EWXf-X4",
          },
          body: JSON.stringify(body),
        }
      );
      const data = await resp.json();
      setResult({
        ...data,
        status: resp.status,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      setErrorMsg(msg);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Имитация проверки подписки пользователя</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">
              Telegram username или ID пользователя
            </label>
            <Input
              placeholder="username или telegram_id"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">
              Приложение (appCode)
            </label>
            <select
              className="border px-2 py-1 rounded w-full"
              value={appCode}
              onChange={(e) => setAppCode(e.target.value)}
              disabled={loading}
            >
              <option value="druid">druid</option>
              <option value="cookie">cookie</option>
            </select>
          </div>
          <Button type="submit" disabled={loading || channelsLoading}>
            {loading || channelsLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" /> Проверяем...
              </>
            ) : (
              "Имитировать проверку"
            )}
          </Button>
        </form>
        {errorMsg && (
          <div className="mt-3 text-red-600 font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {result && (
          <div className="mt-4 text-sm">
            <div>
              <strong>HTTP статус:</strong> {result.status}
            </div>
            {typeof result.error === "string" && (
              <div className="text-red-600 mt-1">Ошибка: {result.error}</div>
            )}
            <div className="mt-2">
              <strong>Результаты подписки:</strong>
              <ul className="list-disc ml-6">
                {channels &&
                  channels.map((ch) => (
                    <li key={ch.id}>
                      <span className="font-medium">{ch.name}</span>{" "}
                      ({ch.chat_id || ch.username}) —{" "}
                      {result.subscriptions && ch.chat_id && result.subscriptions[ch.chat_id] === true
                        ? (
                          <span className="text-green-600 font-semibold">ПОДПИСАН</span>
                        )
                        : result.subscriptions && ch.username && result.subscriptions[ch.username] === true
                          ? (
                            <span className="text-green-600 font-semibold">ПОДПИСАН</span>
                          )
                          : (
                            <span className="text-red-600 font-semibold">НЕ подписан</span>
                          )}
                    </li>
                  ))}
              </ul>
            </div>
            <details className="mt-4 cursor-pointer">
              <summary className="font-semibold text-gray-700 underline">Отладочная информация (debug)</summary>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
