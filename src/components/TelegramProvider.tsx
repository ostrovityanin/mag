
import React, { createContext, useContext, ReactNode } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { TelegramUser, TelegramWebApp } from '@/types/telegram';

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isLoading: boolean;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  hapticFeedback: {
    impact: (style?: 'light' | 'medium' | 'heavy') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export const TelegramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const telegramData = useTelegram();

  // Детальное логирование только реальных данных пользователя
  React.useEffect(() => {
    console.log('=== TELEGRAM WEBAPP СОСТОЯНИЕ ===');
    console.log('WebApp доступен:', !!telegramData.webApp);
    console.log('Загрузка:', telegramData.isLoading);
    
    if (telegramData.user) {
      console.log('=== РЕАЛЬНЫЙ ПОЛЬЗОВАТЕЛЬ TELEGRAM ===');
      console.log('Полный объект пользователя:', JSON.stringify(telegramData.user, null, 2));
      console.log('ID пользователя:', telegramData.user.id);
      console.log('Тип ID пользователя:', typeof telegramData.user.id);
      console.log('Username:', telegramData.user.username);
      console.log('Имя:', telegramData.user.first_name);
      console.log('Фамилия:', telegramData.user.last_name);
    } else if (!telegramData.isLoading) {
      console.log('=== ПОЛЬЗОВАТЕЛЬ TELEGRAM НЕ НАЙДЕН ===');
      console.log('WebApp инициализирован:', !!telegramData.webApp);
      console.log('Причина: Приложение запущено вне Telegram WebApp или пользователь не авторизован');
    }
    console.log('=== КОНЕЦ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ===');
  }, [telegramData.user, telegramData.isLoading, telegramData.webApp]);

  return (
    <TelegramContext.Provider value={telegramData}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegramContext = (): TelegramContextType => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegramContext must be used within a TelegramProvider');
  }
  return context;
};
