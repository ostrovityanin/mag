
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { TelegramUser, TelegramWebApp } from '@/types/telegram';

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  authenticatedUser: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  hapticFeedback: {
    impact: (style?: 'light' | 'medium' | 'heavy') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
  logout: () => Promise<void>;
  authenticateUser: (user: TelegramUser) => Promise<boolean>;
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export const TelegramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const telegramData = useTelegram();
  const { 
    currentUser: authenticatedUser, 
    isLoading: authLoading, 
    error: authError, 
    authenticateUser, 
    logout 
  } = useTelegramAuth();

  // Автоматически аутентифицируем пользователя, когда данные Telegram загружены
  useEffect(() => {
    if (!telegramData.isLoading && telegramData.user && !authLoading && !authenticatedUser) {
      console.log('=== АВТОМАТИЧЕСКАЯ АУТЕНТИФИКАЦИЯ ===');
      console.log('Telegram пользователь найден, начинаем аутентификацию:', telegramData.user);
      
      authenticateUser(telegramData.user);
    }
  }, [telegramData.user, telegramData.isLoading, authLoading, authenticatedUser, authenticateUser]);

  // Логирование состояния
  useEffect(() => {
    console.log('=== TELEGRAM PROVIDER СОСТОЯНИЕ ===');
    console.log('WebApp доступен:', !!telegramData.webApp);
    console.log('Telegram загрузка завершена:', !telegramData.isLoading);
    console.log('Telegram пользователь:', telegramData.user);
    console.log('Аутентифицированный пользователь:', authenticatedUser);
    console.log('Загрузка аутентификации:', authLoading);
    console.log('Ошибка аутентификации:', authError);
    console.log('=== КОНЕЦ PROVIDER ЛОГОВ ===');
  }, [telegramData, authenticatedUser, authLoading, authError]);

  const contextValue: TelegramContextType = {
    ...telegramData,
    authenticatedUser,
    isAuthenticated: !!authenticatedUser,
    authError,
    logout,
    authenticateUser,
  };

  return (
    <TelegramContext.Provider value={contextValue}>
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
