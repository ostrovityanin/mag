import React from 'react';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ChannelRequirement } from '@/components/ChannelRequirement';
import { HoroscopeCard } from '@/components/HoroscopeCard';
import { FortuneCard } from '@/components/FortuneCard';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useChannels } from '@/hooks/useChannels';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SimpleTelegramAuth from '@/components/SimpleTelegramAuth';

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
    error: subscriptionsError,
    refetch
  } = useUserSubscriptions();

  const { data: channels = [], isLoading: channelsLoading } = useChannels();

  const handleGetStarted = () => {
    // Логика начала работы с приложением
    console.log('Пользователь начал работу с приложением');
  };

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
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  // Показываем загрузку при проверке подписок
  if (subscriptionsLoading || channelsLoading) {
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

  // Дефолтные значения, чтобы не было ошибок типов
  const hasUnsubscribedChannels =
    subscriptionData && typeof subscriptionData.hasUnsubscribedChannels === 'boolean'
      ? subscriptionData.hasUnsubscribedChannels
      : false;
  const missingChannels =
    subscriptionData && Array.isArray(subscriptionData.missingChannels)
      ? subscriptionData.missingChannels
      : [];

  // Если есть неподтвержденные каналы, показываем требования
  if (hasUnsubscribedChannels) {
    return (
      <ChannelRequirement 
        channels={channels.filter(c => missingChannels.some(mc => mc.id === c.id))} 
        subscriptions={{}}
        onCheckSubscription={() => refetch()}
        isChecking={null}
      />
    );
  }

  // Основной интерфейс приложения
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔮 Астро Печенье
          </h1>
          <p className="text-lg text-gray-600">
            Персональные гороскопы и предсказания для вас
          </p>
        </div>

        <SimpleTelegramAuth />
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Powered by Telegram WebApp • Версия 2.0
          </p>
        </div>
      </div>
    </div>
  );
};
