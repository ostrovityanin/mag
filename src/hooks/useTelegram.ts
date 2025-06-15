
import { useState, useEffect } from 'react';
import { TelegramWebApp, TelegramUser } from '@/types/telegram';
import { forceLogoutAndReload } from './useTelegramAuth';

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

            // Слушаем событие смены видимости (visibility_changed) — может указывать на смену аккаунта
            try {
              tg.onEvent?.('visibility_changed', () => {
                // Когда возвращаемся в приложение — сверяем telegram_id из user и сессии
                if (
                  typeof window !== 'undefined' &&
                  window.Telegram?.WebApp?.initDataUnsafe?.user?.id
                ) {
                  // Проверим — если не совпадает сессия/аккаунт, форсим логаут
                  const sessionToken = localStorage.getItem('telegram_session_token');
                  if (sessionToken) {
                    // Просто сбрасываем токен — обработка будет дальше в хуке useTelegramAuth
                    localStorage.removeItem('telegram_session_token');
                    // Форсируем перезагрузку чтобы юзер увидел экран логина (или просто обновим, если sessionToken и telegram_id были НЕ валидны)
                    forceLogoutAndReload();
                  }
                }
              });
            } catch (e) {
              // Defensive: игнорируем event если не поддерживается
            }

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

