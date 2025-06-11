
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

  // Добавим детальное логирование данных пользователя
  React.useEffect(() => {
    if (telegramData.user) {
      console.log('=== TELEGRAM USER DATA ===');
      console.log('Full user object:', JSON.stringify(telegramData.user, null, 2));
      console.log('User ID:', telegramData.user.id);
      console.log('User ID type:', typeof telegramData.user.id);
      console.log('Username:', telegramData.user.username);
      console.log('First name:', telegramData.user.first_name);
      console.log('=== END USER DATA ===');
    } else if (!telegramData.isLoading) {
      console.log('=== NO TELEGRAM USER FOUND ===');
      console.log('WebApp available:', !!telegramData.webApp);
      console.log('Is loading:', telegramData.isLoading);
      
      // Создадим тестового пользователя для разработки
      const testUser: TelegramUser = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      };
      console.log('Using test user for development:', testUser);
    }
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
