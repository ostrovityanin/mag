import React, { useState } from 'react';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ChannelRequirement } from '@/components/ChannelRequirement';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserInfoHeader } from '@/components/UserInfoHeader';
import { useQueryClient } from '@tanstack/react-query';

export const HomePage: React.FC = () => {
  const { 
    isAuthenticated, 
    authenticatedUser, 
    authError, 
    isLoading: isAppLoading 
  } = useTelegramContext();
  
  const { 
    data: subscriptionData, 
    isLoading: subscriptionsLoading, 
    error: subscriptionsError,
    refetch
  } = useUserSubscriptions();

  const queryClient = useQueryClient();
  const [checkingChannelId, setCheckingChannelId] = useState<string | null>(null);

  const handleGetStarted = () => {
    console.log('Пользователь начал работу с приложением');
  };

  const handleCheckSubscription = async (channelId: string) => {
    if (!channelId) return;
    setCheckingChannelId(channelId);
    console.log('[ПОВТОРНАЯ ПРОВЕРКА ПОДПИСКИ] channelId:', channelId);
    
    try {
      await refetch();
      await queryClient.invalidateQueries({
        queryKey: ['user-subscriptions'],
        refetchType: 'active',
      });
      await new Promise(res => setTimeout(res, 350));
    } catch (err) {
      console.error('Ошибка рефетча:', err);
    }
    setCheckingChannelId(null);
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

  // Экран ошибки аутентификации
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Ошибка авторизации</h2>
            <p className="text-gray-600 mb-4">{authError}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Приветственный экран для неавторизованных пользователей
  if (!isAuthenticated) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  // Загрузка данных подписок
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

  // Ошибка при загрузке подписок
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

  // Логика проверки подписок
  const hasUnsubscribedChannels = subscriptionData?.hasUnsubscribedChannels ?? false;
  const missingChannels = subscriptionData?.missingChannels ?? [];
  const subscriptionsById = subscriptionData?.subscriptionsById ?? {};

  // Показываем требования подписки, если есть неподтвержденные каналы
  if (hasUnsubscribedChannels) {
    return (
      <ChannelRequirement 
        channels={missingChannels} 
        subscriptions={subscriptionsById}
        onCheckSubscription={handleCheckSubscription}
        isChecking={checkingChannelId}
      />
    );
  }

  // Основной интерфейс приложения
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
