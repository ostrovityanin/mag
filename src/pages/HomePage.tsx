
import React from 'react';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ChannelRequirement } from '@/components/ChannelRequirement';
import { HoroscopeCard } from '@/components/HoroscopeCard';
import { FortuneCard } from '@/components/FortuneCard';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HomePage: React.FC = () => {
  const { 
    isAuthenticated, 
    authenticatedUser, 
    authError, 
    isLoading: telegramLoading,
    logout 
  } = useTelegramContext();
  
  const { 
    data: subscriptionData, 
    isLoading: subscriptionsLoading, 
    error: subscriptionsError 
  } = useUserSubscriptions();

  // Показываем загрузку, пока инициализируется Telegram или проходит аутентификация
  if (telegramLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white text-lg">Инициализация Telegram WebApp...</p>
        </div>
      </div>
    );
  }

  // Показываем ошибку аутентификации
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Ошибка авторизации</h2>
            <p className="text-gray-600 mb-4">{authError}</p>
            <p className="text-sm text-gray-500">
              Запустите приложение в Telegram для проверки подписок
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Показываем приветственный экран, если пользователь не аутентифицирован
  if (!isAuthenticated) {
    return <WelcomeScreen />;
  }

  // Показываем загрузку при проверке подписок
  if (subscriptionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white text-lg">Проверяем ваши подписки...</p>
        </div>
      </div>
    );
  }

  // Показываем ошибку подписок
  if (subscriptionsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Ошибка проверки подписок</h2>
            <p className="text-gray-600 mb-4">
              {subscriptionsError instanceof Error ? subscriptionsError.message : 'Неизвестная ошибка'}
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если есть неподтвержденные каналы, показываем требования
  if (subscriptionData?.hasUnsubscribedChannels) {
    return <ChannelRequirement />;
  }

  // Основной интерфейс приложения
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Заголовок с информацией о пользователе */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-white" />
              <div className="text-white">
                <p className="font-medium">
                  {authenticatedUser?.first_name || authenticatedUser?.username || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-300">
                  @{authenticatedUser?.username || 'нет username'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔮 Друид Гороскопов
          </h1>
          <p className="text-xl text-purple-200">
            Ваш мистический путь к познанию судьбы
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto">
          <HoroscopeCard />
          <FortuneCard />
        </div>
      </div>
    </div>
  );
};
