
import React, { createContext, useContext, ReactNode } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { TelegramUser, TelegramWebApp } from '@/types/telegram';

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isLoading: boolean;
  error: string | null;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  openTelegramLink: (url: string) => void;
  hapticFeedback: {
    impact: (style?: 'light' | 'medium' | 'heavy') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
  };
  // Добавляем совместимые свойства для компонентов
  authenticatedUser: TelegramUser | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export const TelegramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const telegramData = useTelegramWebApp();

  // Простая функция logout для совместимости
  const logout = async () => {
    // В текущей архитектуре просто очищаем localStorage
    localStorage.clear();
    // Перезагружаем страницу для полного сброса состояния
    window.location.reload();
  };

  const contextValue: TelegramContextType = {
    ...telegramData,
    // Добавляем совместимые свойства
    authenticatedUser: telegramData.user,
    isAuthenticated: !!telegramData.user,
    logout,
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
