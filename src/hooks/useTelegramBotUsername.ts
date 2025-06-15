
import { useState, useEffect } from "react";

/**
 * Хук для получения TELEGRAM_BOT_USERNAME через edge function
 */
export function useTelegramBotUsername() {
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchUsername = async () => {
      try {
        const url = "https://shytgcmkvycrpzhlsfbc.functions.supabase.co/get-telegram-bot-username";
        const res = await fetch(url, { method: "GET" });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Не удалось получить username бота");
        }
        if (isMounted) {
          setBotUsername(data.botUsername);
        }
      } catch (e: any) {
        setError(e.message || "Не удалось получить username бота");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUsername();
    return () => { isMounted = false; };
  }, []);

  return { botUsername, isLoading, error };
}
