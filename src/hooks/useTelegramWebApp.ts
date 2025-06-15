
import { useState, useEffect } from 'react';
import { TelegramWebApp, TelegramUser } from '@/types/telegram';

/**
 * Простой хук для работы с Telegram WebApp без сложной авторизации
 */
export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== Telegram WebApp: ИНИЦИАЛИЗАЦИЯ ===');

    const initTelegram = () => {
      try {
        if (
          typeof window !== 'undefined' &&
          window.Telegram?.WebApp &&
          window.Telegram?.WebApp.initDataUnsafe?.user
        ) {
          const tg = window.Telegram.WebApp;
          setWebApp(tg);

          // Инициализация WebApp
          tg.ready();
          tg.expand();

          const telegramUser = tg.initDataUnsafe.user;
          if (telegramUser && telegramUser.id) {
            setUser(telegramUser);
            console.log('Telegram пользователь найден:', telegramUser);

            // Обработка смены аккаунта
            const prevUserId = localStorage.getItem('telegram_user_id');
            const currentUserId = telegramUser.id.toString();
            
            if (prevUserId && prevUserId !== currentUserId) {
              console.log('Обнаружена смена аккаунта, очищаем данные');
              localStorage.clear();
            }
            
            localStorage.setItem('telegram_user_id', currentUserId);

            // Слушаем событие изменения видимости
            const handleVisibilityChange = () => {
              console.log('WebApp стал видимым, запускаем перепроверку');
              // Запускаем событие для перепроверки подписок
              window.dispatchEvent(new CustomEvent('telegram_visibility_changed'));
            };

            try {
              const onEvent = (tg as any)?.onEvent;
              if (typeof onEvent === 'function') {
                onEvent.call(tg, 'visibility_changed', handleVisibilityChange);
              }
            } catch (e) {
              console.warn('Не удалось подписаться на visibility_changed:', e);
            }

          } else {
            setUser(null);
            setError('Пользователь Telegram не найден в initDataUnsafe');
          }
        } else {
          setUser(null);
          setWebApp(null);
          setError('Telegram WebApp не обнаружен. Откройте приложение через Telegram');
        }
      } catch (error) {
        setUser(null);
        setWebApp(null);
        setError(`Ошибка инициализации Telegram: ${error}`);
        console.error('Ошибка инициализации Telegram:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initTelegram();
  }, []);

  // Утилиты для работы с UI
  const showMainButton = (text: string, onClick: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.text = text;
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  };

  const openTelegramLink = (url: string) => {
    if (webApp) {
      window.open(url, '_blank');
    }
  };

  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred(style);
      }
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred(type);
      }
    },
  };

  return {
    webApp,
    user,
    isLoading,
    error,
    showMainButton,
    hideMainButton,
    openTelegramLink,
    hapticFeedback,
  };
};
