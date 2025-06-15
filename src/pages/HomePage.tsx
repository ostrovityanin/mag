
import React from 'react';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { useTelegramContext } from '@/components/TelegramProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { UserInfoHeader } from '@/components/UserInfoHeader';

export const HomePage: React.FC = () => {
  const { 
    user,
    isLoading: isAppLoading,
    error: webAppError
  } = useTelegramContext();

  const handleGetStarted = () => {
    console.log('Пользователь начал работу с приложением');
  };

  // Экран загрузки при инициализации
  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white text-lg">Инициализация приложения...</p>
        </div>
      </div>
    );
  }

  // Экран ошибки или отсутствия WebApp
  if (webAppError || !user) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  // Основной интерфейс приложения - без проверок подписки
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <UserInfoHeader />
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔮 Астро Печенье
          </h1>
          <p className="text-lg text-gray-600">
            Персональные гороскопы и предсказания для вас
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Powered by Telegram WebApp • Версия 2.0
          </p>
        </div>
      </div>
    </div>
  );
};
