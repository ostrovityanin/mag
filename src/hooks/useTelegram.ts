
import { useEffect, useState } from 'react';
import { TelegramWebApp, TelegramUser } from '@/types/telegram';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('=== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP ===');
    console.log('window.Telegram доступен:', !!window.Telegram);
    console.log('window.Telegram.WebApp доступен:', !!window.Telegram?.WebApp);
    
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      console.log('Telegram WebApp объект:', tg);
      console.log('initData:', tg.initData);
      console.log('initDataUnsafe:', tg.initDataUnsafe);
      console.log('initDataUnsafe.user:', tg.initDataUnsafe?.user);
      
      setWebApp(tg);
      
      // Попробуем получить пользователя разными способами
      let telegramUser = null;
      
      if (tg.initDataUnsafe?.user) {
        telegramUser = tg.initDataUnsafe.user;
        console.log('Пользователь найден через initDataUnsafe.user:', telegramUser);
      } else if (tg.initData) {
        console.log('Попытка парсинга initData:', tg.initData);
        try {
          // Попробуем распарсить initData вручную
          const urlParams = new URLSearchParams(tg.initData);
          const userParam = urlParams.get('user');
          if (userParam) {
            telegramUser = JSON.parse(decodeURIComponent(userParam));
            console.log('Пользователь найден через парсинг initData:', telegramUser);
          }
        } catch (error) {
          console.error('Ошибка парсинга initData:', error);
        }
      }
      
      if (telegramUser) {
        console.log('=== УСТАНОВКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ ===');
        console.log('ID пользователя:', telegramUser.id);
        console.log('Тип ID:', typeof telegramUser.id);
        console.log('Username:', telegramUser.username);
        console.log('Имя:', telegramUser.first_name);
        setUser(telegramUser);
      } else {
        console.warn('=== ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН ===');
        console.warn('Возможные причины:');
        console.warn('1. Приложение запущено не из бота');
        console.warn('2. Бот не настроен корректно');
        console.warn('3. Пользователь не взаимодействовал с ботом');
      }
      
      // Configure the WebApp
      tg.ready();
      tg.expand();
      
      setIsLoading(false);
    } else {
      // For development/testing when not in Telegram
      console.log('Not running in Telegram WebApp environment');
      setIsLoading(false);
    }
  }, []);

  const showMainButton = (text: string, onClick: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
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

  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      webApp?.HapticFeedback.impactOccurred(style);
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      webApp?.HapticFeedback.notificationOccurred(type);
    },
    selection: () => {
      webApp?.HapticFeedback.selectionChanged();
    }
  };

  return {
    webApp,
    user,
    isLoading,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback
  };
};
