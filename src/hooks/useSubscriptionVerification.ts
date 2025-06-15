
import { useState, useEffect, useCallback } from 'react';
import { TelegramWebApp } from '@/types/telegram';

interface SubscriptionCheck {
  chat_id: string;
  status: string;
  channel_name?: string;
  invite_link?: string;
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
 * Хук для проверки подписок с показом только первых двух неподписанных каналов
 */
export const useSubscriptionVerification = (webApp: TelegramWebApp | null) => {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentChannel, setCurrentChannel] = useState<string>('');

  const verifySubscriptions = useCallback(async (): Promise<VerificationResult | null> => {
    if (!webApp?.initData) {
      console.warn('Нет initData для проверки подписок');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setCurrentChannel('Инициализация...');

    try {
      console.log('Начинаем проверку подписок через бэкенд...');
      
      setProgress(20);
      setCurrentChannel('Получение списка каналов...');
      
      // Вызываем edge-функцию для проверки подписок
      const response = await fetch('https://shytgcmkvycrpzhlsfbc.supabase.co/functions/v1/telegram-subscription-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoeXRnY21rdnljcnB6aGxzZmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDE0NDUsImV4cCI6MjA2NDUxNzQ0NX0.yAxuIxp9YEPRT6-iSybXev3hY6Kcmns3-cS3EWXf-X4`,
        },
        body: JSON.stringify({
          initData: webApp.initData,
          app: 'druid'
        }),
      });

      setProgress(50);
      setCurrentChannel('Проверка подписок...');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const verificationResult: VerificationResult = await response.json();
      console.log('Результат проверки подписок:', verificationResult);

      setProgress(80);
      setCurrentChannel('Обработка результатов...');

      // Фильтруем только неподписанные каналы и берём первые два
      const unsubscribedChannels = verificationResult.checks?.filter(
        c => !['member', 'administrator', 'creator'].includes(c.status)
      ) || [];

      // Берём только первые два неподписанных канала
      const limitedUnsubscribedChannels = unsubscribedChannels.slice(0, 2);

      const finalResult: VerificationResult = {
        ...verificationResult,
        checks: limitedUnsubscribedChannels,
        ok: limitedUnsubscribedChannels.length === 0 // Доступ разрешён, если нет неподписанных каналов
      };

      setProgress(100);
      setCurrentChannel('Завершение...');
      
      // Небольшая задержка для плавности анимации
      setTimeout(() => {
        setResult(finalResult);
      }, 500);

      return finalResult;

    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка проверки подписок';
      console.error('Ошибка при проверке подписок:', err);
      setError(errorMessage);
      return null;
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        setCurrentChannel('');
      }, 600);
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
    progress,
    currentChannel,
    isAllowed: result?.ok || false,
    missingChannels: result?.checks || [],
  };
};
