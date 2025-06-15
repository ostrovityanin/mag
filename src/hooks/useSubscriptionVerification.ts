
import { useState, useEffect, useCallback } from 'react';
import { TelegramWebApp } from '@/types/telegram';

interface SubscriptionCheck {
  chat_id: string;
  status: string;
  channel_name?: string;
}

interface VerificationResult {
  ok: boolean;
  checks: SubscriptionCheck[];
  user: {
    id: number;
    first_name?: string;
    username?: string;
  };
  error?: string;
}

/**
 * Хук для проверки подписок через бэкенд и Bot API
 */
export const useSubscriptionVerification = (webApp: TelegramWebApp | null) => {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifySubscriptions = useCallback(async (): Promise<VerificationResult | null> => {
    if (!webApp?.initData) {
      console.warn('Нет initData для проверки подписок');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Начинаем проверку подписок через бэкенд...');
      
      // Вызываем edge-функцию для проверки подписок
      const response = await fetch('https://shytgcmkvycrpzhlsfbc.supabase.co/functions/v1/telegram-subscription-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoeXRnY21rdnljcnB6aGxzZmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDE0NDUsImV4cCI6MjA2NDUxNzQ0NX0.yAxuIxp9YEPRT6-iSybXev3hY6Kcmns3-cS3EWXf-X4`,
        },
        body: JSON.stringify({
          initData: webApp.initData,
          app: 'druid' // указываем, для какого приложения проверяем
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const verificationResult: VerificationResult = await response.json();
      console.log('Результат проверки подписок:', verificationResult);

      setResult(verificationResult);
      return verificationResult;

    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка проверки подписок';
      console.error('Ошибка при проверке подписок:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [webApp]);

  // Автоматическая проверка при монтировании
  useEffect(() => {
    if (webApp?.initData) {
      verifySubscriptions();
    }
  }, [webApp, verifySubscriptions]);

  // Слушаем событие изменения видимости для перепроверки
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('Видимость изменилась, перепроверяем подписки');
      verifySubscriptions();
    };

    window.addEventListener('telegram_visibility_changed', handleVisibilityChange);
    return () => {
      window.removeEventListener('telegram_visibility_changed', handleVisibilityChange);
    };
  }, [verifySubscriptions]);

  const refresh = useCallback(() => {
    return verifySubscriptions();
  }, [verifySubscriptions]);

  return {
    result,
    isLoading,
    error,
    refresh,
    isAllowed: result?.ok || false,
    missingChannels: result?.checks?.filter(c => !['member', 'administrator', 'creator'].includes(c.status)) || [],
  };
};
