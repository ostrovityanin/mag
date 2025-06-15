
import React, { createContext, useContext, ReactNode } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { TelegramUser, TelegramWebApp } from '@/types/telegram';

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  authenticatedUser: any | null;
  isLoading: boolean; // For initial Telegram WebApp loading
  isAuthLoading: boolean; // For authentication process loading
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
  authenticateUser: (initData: string) => Promise<boolean>;
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

  const contextValue: TelegramContextType = {
    ...telegramData,
    authenticatedUser,
    isLoading: telegramData.isLoading,
    isAuthLoading: authLoading,
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
