
import { useState, useEffect } from 'react';
import { TelegramWebApp, TelegramUser } from '@/types/telegram';

/**
 * Строго определяет только реального пользователя Telegram WebApp.
 * НИКОГДА не создает тестовых юзеров!
 */
export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('=== Telegram Auth: ИНИЦИАЛИЗАЦИЯ ===');

    const initTelegram = () => {
      try {
        // Telegram WebApp должен быть доступен в window
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
            console.log('Telegram пользователь инициализирован:', telegramUser);
          } else {
            setUser(null);
            console.warn('Пользователь Telegram не найден в initDataUnsafe!');
          }
        } else {
          setUser(null);
          setWebApp(null);
          console.warn('Telegram WebApp не обнаружен. Ожидается запуск только через Telegram!');
        }
      } catch (error) {
        setUser(null);
        setWebApp(null);
        console.error('Ошибка инициализации Telegram:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Запускаем инициализацию сразу
    initTelegram();

    // Нет необходимости делать таймер, т.к. тестовый режим больше не поддерживается.
  }, []);

  // Строго без тестового режима!
  // Только методы WebApp, все Dev-вставки убраны.

  // Кнопки взаимодействия с Telegram UI
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

  const showBackButton = (onClick: () => void) => {
    if (webApp?.BackButton) {
      webApp.BackButton.onClick(onClick);
      webApp.BackButton.show();
    }
  };

  const hideBackButton = () => {
    if (webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  };

  // Haptic feedback
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
    selection: () => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.selectionChanged();
      }
    },
  };

  console.log('=== useTelegram RESULT ===', { webApp, user, isLoading });

  return {
    webApp,
    user,
    isLoading,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
  };
};
