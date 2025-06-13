
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
    console.log('=== ПРОВЕРКА АВТОМАТИЧЕСКОЙ АУТЕНТИФИКАЦИИ ===');
    console.log('telegramData.isLoading:', telegramData.isLoading);
    console.log('telegramData.user:', telegramData.user);
    console.log('authLoading:', authLoading);
    console.log('authenticatedUser:', authenticatedUser);
    
    if (!telegramData.isLoading && telegramData.user && !authLoading && !authenticatedUser) {
      console.log('=== ЗАПУСК АВТОМАТИЧЕСКОЙ АУТЕНТИФИКАЦИИ ===');
      console.log('Telegram пользователь найден, начинаем аутентификацию:', telegramData.user);
      
      authenticateUser(telegramData.user).then((success) => {
        console.log('Результат аутентификации:', success);
      }).catch((error) => {
        console.error('Ошибка аутентификации:', error);
      });
    }
  }, [telegramData.user, telegramData.isLoading, authLoading, authenticatedUser, authenticateUser]);

  // Детальное логирование состояния каждые 2 секунды для отладки
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('=== TELEGRAM PROVIDER СОСТОЯНИЕ (периодический лог) ===');
      console.log('WebApp доступен:', !!telegramData.webApp);
      console.log('Telegram загрузка завершена:', !telegramData.isLoading);
      console.log('Telegram пользователь:', telegramData.user);
      console.log('Аутентифицированный пользователь:', authenticatedUser);
      console.log('Загрузка аутентификации:', authLoading);
      console.log('Ошибка аутентификации:', authError);
      console.log('URL:', window.location.href);
      console.log('User Agent:', navigator.userAgent);
      console.log('=== КОНЕЦ ПЕРИОДИЧЕСКОГО ЛОГА ===');
    }, 2000);

    return () => clearInterval(interval);
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
