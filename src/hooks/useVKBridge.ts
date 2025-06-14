
import { useCallback, useEffect, useState } from "react";

// --- Добавляем объявление методов VK Bridge для TypeScript ---
declare global {
  interface Window {
    VKWebAppInit?: () => void;
    VKWebAppGetUserInfo?: () => Promise<{
      id: number;
      first_name: string;
      last_name: string;
      photo_200?: string;
    }>;
  }
}

// Проверка на доступность VK Bridge (Mini Apps)
const isVKBridgeAvailable = () => {
  return typeof window !== "undefined" && typeof window.VKWebAppInit !== "undefined";
};

interface VKUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
}

function useVKBridge() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [user, setUser] = useState<VKUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Для настоящих мини-аппов рекомендуем импортировать vk-bridge, но тут покажем на window
  const authorize = useCallback(() => {
    setError(null);
    setLoading(true);
    // Проверяем есть ли vk-bridge
    if (!isVKBridgeAvailable()) {
      setIsAvailable(false);
      setLoading(false);
      setError("VK Bridge недоступен. Откройте приложение во ВКонтакте.");
      return;
    }
    // Инициируем Mini App (VKWebAppInit) и просим данные пользователя
    window.VKWebAppInit?.();
    window.VKWebAppGetUserInfo?.()
      .then((userInfo: any) => {
        setUser({
          id: userInfo.id,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          photo_200: userInfo.photo_200
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Не удалось получить данные пользователя через VK Bridge.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setIsAvailable(isVKBridgeAvailable());
    // Можно автоматически авторизовать пользователя при заходе
    // Но для MVP — только по кнопке
  }, []);

  return { isAvailable, user, loading, error, authorize };
}

export default useVKBridge;
