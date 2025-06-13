
import { useState, useEffect } from 'react';
import { TelegramWebApp, TelegramUser } from '@/types/telegram';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('=== ИНИЦИАЛИЗАЦИЯ TELEGRAM HOOK ===');
    
    const initTelegram = () => {
      try {
        // Проверяем доступность Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          console.log('Telegram WebApp найден:', tg);
          console.log('initData:', tg.initData);
          console.log('initDataUnsafe:', tg.initDataUnsafe);
          
          setWebApp(tg);
          
          // Инициализируем WebApp
          tg.ready();
          tg.expand();
          
          // Извлекаем пользователя
          const telegramUser = tg.initDataUnsafe?.user;
          console.log('Данные пользователя из initDataUnsafe:', telegramUser);
          
          if (telegramUser && telegramUser.id) {
            console.log('Пользователь успешно получен:', telegramUser);
            setUser(telegramUser);
          } else {
            console.warn('Пользователь не найден в initDataUnsafe');
            
            // Попробуем альтернативный способ для тестирования
            if (tg.initData && tg.initData.includes('user=')) {
              try {
                // Парсим initData вручную для отладки
                const urlParams = new URLSearchParams(tg.initData);
                const userParam = urlParams.get('user');
                if (userParam) {
                  const parsedUser = JSON.parse(decodeURIComponent(userParam));
                  console.log('Пользователь из initData:', parsedUser);
                  setUser(parsedUser);
                } else {
                  console.log('Параметр user не найден в initData');
                }
              } catch (parseError) {
                console.error('Ошибка парсинга данных пользователя:', parseError);
              }
            }
            
            // Для разработки/тестирования можем создать тестового пользователя
            // ТОЛЬКО если мы в среде разработки
            if (process.env.NODE_ENV === 'development' && !telegramUser) {
              console.log('РЕЖИМ РАЗРАБОТКИ: Создаем тестового пользователя');
              const testUser: TelegramUser = {
                id: 1450383115, // Реальный ID из логов Edge Function
                first_name: 'Test',
                last_name: 'User',
                username: 'testuser',
                language_code: 'ru',
                is_bot: false,
              };
              setUser(testUser);
            }
          }
        } else {
          console.warn('Telegram WebApp не доступен');
          
          // Для разработки/тестирования
          if (process.env.NODE_ENV === 'development') {
            console.log('РЕЖИМ РАЗРАБОТКИ: Эмулируем Telegram WebApp');
            const testUser: TelegramUser = {
              id: 1450383115,
              first_name: 'Test',
              last_name: 'User', 
              username: 'testuser',
              language_code: 'ru',
              is_bot: false,
            };
            setUser(testUser);
          }
        }
      } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Небольшая задержка для загрузки Telegram WebApp
    const timer = setTimeout(initTelegram, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Функции для работы с WebApp
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

  console.log('=== useTelegram РЕЗУЛЬТАТ ===');
  console.log('WebApp:', webApp);
  console.log('User:', user);
  console.log('IsLoading:', isLoading);

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
