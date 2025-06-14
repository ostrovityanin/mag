
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

// Максимально детальная проверка VK окружения
const isVKBridgeAvailable = (): boolean => {
  console.log("=== ПРОВЕРКА VK BRIDGE ДОСТУПНОСТИ ===");
  
  if (typeof window === "undefined") {
    console.log("❌ Window объект недоступен (SSR)");
    return false;
  }
  
  // Все возможные проверки VK окружения
  const checks = {
    hasVKBridge: !!(window.vkBridge),
    hasLegacyVK: !!(window.VKWebAppInit),
    hasVKWebApp: !!((window as any).VKWebApp),
    hasVKObject: !!((window as any).VK),
    
    // User Agent проверки
    isVKMAUserAgent: /VKMA/.test(navigator.userAgent),
    isVKAppUserAgent: /VKApp/.test(navigator.userAgent),
    isVKUserAgent: /VK\//.test(navigator.userAgent),
    isMobileUserAgent: /Mobile/.test(navigator.userAgent),
    
    // URL проверки
    hasVKParams: window.location.search.includes('vk_') || window.location.hash.includes('vk_'),
    
    // Iframe проверки
    isInIframe: window !== window.top,
    hasParent: !!window.parent,
    
    // Referrer проверки
    hasVKReferrer: document.referrer.includes('vk.com') || document.referrer.includes('vk.me'),
  };
  
  console.log("VK окружение - детальные проверки:", checks);
  
  // Логируем все VK-связанные свойства в window
  const vkProperties = Object.keys(window).filter(key => 
    key.toLowerCase().includes('vk')
  );
  console.log("VK свойства в window:", vkProperties);
  
  // Проверяем URL и referrer
  console.log("URL полный:", window.location.href);
  console.log("Referrer:", document.referrer);
  console.log("User Agent полный:", navigator.userAgent);
  
  // Результат проверки
  const isAvailable = checks.hasVKBridge || checks.hasLegacyVK || checks.isVKMAUserAgent || checks.isVKAppUserAgent;
  
  console.log(`VK Bridge доступность: ${isAvailable ? '✅ ДОСТУПЕН' : '❌ НЕДОСТУПЕН'}`);
  
  return isAvailable;
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
    console.log("=== СБОР ДИАГНОСТИКИ VK ===");
    
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
        const commonMethods = ['VKWebAppInit', 'VKWebAppGetUserInfo', 'VKWebAppSetViewSettings'];
        vkBridgeMethods = commonMethods.filter(method => 
          window.vkBridge?.supports ? window.vkBridge.supports(method) : true
        );
        console.log("VK Bridge методы:", vkBridgeMethods);
      } catch (e) {
        const errorMsg = `VK Bridge methods check failed: ${e}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    const diagnostics = {
      userAgent,
      url,
      hasVKBridge,
      hasLegacyVK,
      isVKUserAgent,
      hasVKParams,
      vkBridgeMethods,
      errors
    };
    
    console.log("Полная диагностика VK:", diagnostics);
    return diagnostics;
  }, []);

  const authorize = useCallback(() => {
    console.log("=== НАЧАЛО АВТОРИЗАЦИИ VK ===");
    setError(null);
    setLoading(true);
    
    const diag = getDiagnostics();
    setDiagnostics(diag);
    
    if (!isVKBridgeAvailable()) {
      const errorMsg = "VK Bridge недоступен в текущем окружении";
      setIsAvailable(false);
      setLoading(false);
      setError(errorMsg);
      console.error("❌", errorMsg);
      return;
    }

    try {
      // Попробуем использовать vkBridge API
      if (window.vkBridge) {
        console.log("🔄 Используем vkBridge API");
        
        console.log("1. Инициализация VK Bridge...");
        window.vkBridge.send('VKWebAppInit')
          .then(() => {
            console.log("✅ VK Bridge инициализирован");
            console.log("2. Настройка внешнего вида...");
            return window.vkBridge!.send('VKWebAppSetViewSettings', {
              status_bar_style: 'light',
              action_bar_color: '#f0f9ff'
            });
          })
          .then(() => {
            console.log("✅ Настройки внешнего вида применены");
            console.log("3. Получение информации о пользователе...");
            return window.vkBridge!.send('VKWebAppGetUserInfo');
          })
          .then((userInfo: any) => {
            console.log("✅ Информация о пользователе получена:", userInfo);
            setUser({
              id: userInfo.id,
              first_name: userInfo.first_name,
              last_name: userInfo.last_name,
              photo_200: userInfo.photo_200
            });
            setLoading(false);
          })
          .catch((err: any) => {
            console.error("❌ Ошибка VK Bridge:", err);
            setError("Ошибка VK Bridge: " + (err.error_data?.error_reason || JSON.stringify(err)));
            setLoading(false);
          });
      } 
      // Fallback на старый API
      else if (window.VKWebAppInit && window.VKWebAppGetUserInfo) {
        console.log("🔄 Используем legacy VK API");
        window.VKWebAppInit();
        
        setTimeout(() => {
          console.log("Получение информации пользователя (legacy)...");
          window.VKWebAppGetUserInfo!()
            .then((userInfo: any) => {
              console.log("✅ Информация о пользователе получена (legacy):", userInfo);
              setUser({
                id: userInfo.id,
                first_name: userInfo.first_name,
                last_name: userInfo.last_name,
                photo_200: userInfo.photo_200
              });
              setLoading(false);
            })
            .catch((err: any) => {
              console.error("❌ Ошибка legacy VK API:", err);
              setError("Ошибка legacy VK API: " + JSON.stringify(err));
              setLoading(false);
            });
        }, 100);
      }
    } catch (error) {
      console.error("❌ Критическая ошибка авторизации VK:", error);
      setError("Критическая ошибка VK: " + error);
      setLoading(false);
    }
  }, [getDiagnostics]);

  useEffect(() => {
    console.log("=== ИНИЦИАЛИЗАЦИЯ useVKBridge ===");
    const available = isVKBridgeAvailable();
    setIsAvailable(available);
    const diag = getDiagnostics();
    setDiagnostics(diag);
    
    console.log(`Hook инициализирован. VK доступен: ${available}`);
  }, [getDiagnostics]);

  return { isAvailable, user, loading, error, authorize, diagnostics };
}

export default useVKBridge;
