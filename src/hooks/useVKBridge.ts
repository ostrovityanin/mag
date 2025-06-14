
import { useCallback, useEffect, useState } from "react";

// Правильное объявление VK Bridge API
declare global {
  interface Window {
    vkBridge?: {
      send: (method: string, params?: any) => Promise<any>;
      subscribe: (callback: (event: any) => void) => void;
      unsubscribe: (callback: (event: any) => void) => void;
      supports: (method: string) => boolean;
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
const isVKBridgeAvailable = (): boolean => {
  if (typeof window === "undefined") return false;
  
  // Проверяем различные способы определения VK среды
  const hasVKBridge = !!(window.vkBridge);
  const hasLegacyVK = !!(window.VKWebAppInit);
  const isVKUserAgent = /VKMA/.test(navigator.userAgent) || /VKApp/.test(navigator.userAgent);
  const hasVKParams = window.location.search.includes('vk_') || window.location.hash.includes('vk_');
  
  console.log('VK Environment check:', {
    hasVKBridge,
    hasLegacyVK,
    isVKUserAgent,
    hasVKParams,
    userAgent: navigator.userAgent,
    location: window.location.href
  });
  
  return hasVKBridge || hasLegacyVK || isVKUserAgent;
};

interface VKUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
}

interface VKDiagnostics {
  userAgent: string;
  url: string;
  hasVKBridge: boolean;
  hasLegacyVK: boolean;
  isVKUserAgent: boolean;
  hasVKParams: boolean;
  vkBridgeMethods: string[];
  errors: string[];
}

function useVKBridge() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [user, setUser] = useState<VKUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<VKDiagnostics | null>(null);

  const getDiagnostics = useCallback((): VKDiagnostics => {
    const userAgent = navigator.userAgent;
    const url = window.location.href;
    const hasVKBridge = !!(window.vkBridge);
    const hasLegacyVK = !!(window.VKWebAppInit);
    const isVKUserAgent = /VKMA/.test(userAgent) || /VKApp/.test(userAgent);
    const hasVKParams = url.includes('vk_') || window.location.hash.includes('vk_');
    
    let vkBridgeMethods: string[] = [];
    let errors: string[] = [];
    
    if (hasVKBridge && window.vkBridge) {
      try {
        // Проверяем доступные методы
        const commonMethods = ['VKWebAppInit', 'VKWebAppGetUserInfo', 'VKWebAppSetViewSettings'];
        vkBridgeMethods = commonMethods.filter(method => 
          window.vkBridge?.supports ? window.vkBridge.supports(method) : true
        );
      } catch (e) {
        errors.push(`VK Bridge methods check failed: ${e}`);
      }
    }
    
    return {
      userAgent,
      url,
      hasVKBridge,
      hasLegacyVK,
      isVKUserAgent,
      hasVKParams,
      vkBridgeMethods,
      errors
    };
  }, []);

  const authorize = useCallback(() => {
    setError(null);
    setLoading(true);
    
    console.log('VK Bridge authorization attempt...');
    const diag = getDiagnostics();
    setDiagnostics(diag);
    
    if (!isVKBridgeAvailable()) {
      setIsAvailable(false);
      setLoading(false);
      setError("VK Bridge недоступен. Откройте приложение во ВКонтакте.");
      console.error('VK Bridge not available', diag);
      return;
    }

    try {
      // Попробуем использовать vkBridge API
      if (window.vkBridge) {
        console.log('Using vkBridge API');
        
        // Инициализация VK Bridge
        window.vkBridge.send('VKWebAppInit')
          .then(() => {
            console.log('VK Bridge initialized successfully');
            // Устанавливаем настройки приложения
            return window.vkBridge!.send('VKWebAppSetViewSettings', {
              status_bar_style: 'light',
              action_bar_color: '#f0f9ff'
            });
          })
          .then(() => {
            console.log('VK Bridge view settings applied');
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
            setError("Ошибка получения данных пользователя: " + (err.error_data?.error_reason || JSON.stringify(err)));
            setLoading(false);
          });
      } 
      // Fallback на старый API
      else if (window.VKWebAppInit && window.VKWebAppGetUserInfo) {
        console.log('Using legacy VK API');
        window.VKWebAppInit();
        
        setTimeout(() => {
          window.VKWebAppGetUserInfo!()
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
              setError("Не удалось получить данные пользователя через VK API: " + JSON.stringify(err));
              setLoading(false);
            });
        }, 100); // Небольшая задержка для инициализации
      }
    } catch (error) {
      console.error('VK Bridge initialization error:', error);
      setError("Ошибка инициализации VK Bridge: " + error);
      setLoading(false);
    }
  }, [getDiagnostics]);

  useEffect(() => {
    const available = isVKBridgeAvailable();
    setIsAvailable(available);
    const diag = getDiagnostics();
    setDiagnostics(diag);
    
    console.log('VK Bridge availability check:', available);
    console.log('Full diagnostics:', diag);
  }, [getDiagnostics]);

  return { isAvailable, user, loading, error, authorize, diagnostics };
}

export default useVKBridge;
