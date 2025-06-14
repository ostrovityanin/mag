
import { useCallback, useEffect, useState } from "react";

// Правильное объявление VK Bridge API
declare global {
  interface Window {
    vkBridge?: {
      send: (method: string, params?: any) => Promise<any>;
      subscribe: (callback: (event: any) => void) => void;
      unsubscribe: (callback: (event: any) => void) => void;
    };
    VKWebAppInit?: () => void;
    VKWebAppGetUserInfo?: () => Promise<{
      id: number;
      first_name: string;
      last_name: string;
      photo_200?: string;
    }>;
  }
}

// Проверка на доступность VK Bridge
const isVKBridgeAvailable = () => {
  return (
    typeof window !== "undefined" && 
    (window.vkBridge || window.VKWebAppInit)
  );
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

  const authorize = useCallback(() => {
    setError(null);
    setLoading(true);
    
    console.log('VK Bridge authorization attempt...');
    
    if (!isVKBridgeAvailable()) {
      setIsAvailable(false);
      setLoading(false);
      setError("VK Bridge недоступен. Откройте приложение во ВКонтакте.");
      console.error('VK Bridge not available');
      return;
    }

    try {
      // Попробуем использовать vkBridge API
      if (window.vkBridge) {
        console.log('Using vkBridge API');
        window.vkBridge.send('VKWebAppInit')
          .then(() => {
            return window.vkBridge!.send('VKWebAppGetUserInfo');
          })
          .then((userInfo: any) => {
            console.log('VK User info received:', userInfo);
            setUser({
              id: userInfo.id,
              first_name: userInfo.first_name,
              last_name: userInfo.last_name,
              photo_200: userInfo.photo_200
            });
            setLoading(false);
          })
          .catch((err: any) => {
            console.error('VK Bridge error:', err);
            setError("Ошибка получения данных пользователя: " + (err.error_data?.error_reason || 'неизвестная ошибка'));
            setLoading(false);
          });
      } 
      // Fallback на старый API
      else if (window.VKWebAppInit && window.VKWebAppGetUserInfo) {
        console.log('Using legacy VK API');
        window.VKWebAppInit();
        window.VKWebAppGetUserInfo()
          .then((userInfo: any) => {
            console.log('VK User info received (legacy):', userInfo);
            setUser({
              id: userInfo.id,
              first_name: userInfo.first_name,
              last_name: userInfo.last_name,
              photo_200: userInfo.photo_200
            });
            setLoading(false);
          })
          .catch((err: any) => {
            console.error('VK Legacy API error:', err);
            setError("Не удалось получить данные пользователя через VK API.");
            setLoading(false);
          });
      }
    } catch (error) {
      console.error('VK Bridge initialization error:', error);
      setError("Ошибка инициализации VK Bridge.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const available = isVKBridgeAvailable();
    setIsAvailable(available);
    console.log('VK Bridge availability check:', available);
    
    // Логируем доступные VK объекты
    console.log('Available VK objects:', {
      vkBridge: !!window.vkBridge,
      VKWebAppInit: !!window.VKWebAppInit,
      VKWebAppGetUserInfo: !!window.VKWebAppGetUserInfo,
      userAgent: navigator.userAgent
    });
  }, []);

  return { isAvailable, user, loading, error, authorize };
}

export default useVKBridge;
