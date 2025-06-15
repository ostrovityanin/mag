
import React, { useState } from 'react';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ChannelRequirement } from '@/components/ChannelRequirement';
import { HoroscopeCard } from '@/components/HoroscopeCard';
import { FortuneCard } from '@/components/FortuneCard';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useChannels } from '@/hooks/useChannels';
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

  const queryClient = useQueryClient();

  // Идентификатор текущей проверки (канал, по которому идет процесс)
  const [checkingChannelId, setCheckingChannelId] = useState<string | null>(null);

  const handleGetStarted = () => {
    console.log('Пользователь начал работу с приложением');
  };

  const handleCheckSubscription = async (channelId: string) => {
    if (!channelId) return;
    setCheckingChannelId(channelId);
    console.log('[ПОВТОРНАЯ ПРОВЕРКА ПОДПИСКИ] channelId:', channelId);
    // На время для отрисовки спиннера, реальный refetch и инвалидация
    try {
      await refetch();
      await queryClient.invalidateQueries({
        queryKey: ['user-subscriptions'],
        refetchType: 'active',
      });
      await new Promise(res => setTimeout(res, 350)); // небольшой mid-delay для UX
    } catch (err) {
      console.error('Ошибка рефетча:', err);
    }
    setCheckingChannelId(null);
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

  // Для неавторизованного — приветственный экран (WelcomeScreen)
  if (!isAuthenticated) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  // После авторизации, но до доступа — проверки подписок и каналов
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

  // -------- Новая логика сборки подписок по channel.id и строгому соответствию каналам ---------
  const hasUnsubscribedChannels =
    subscriptionData && typeof subscriptionData.hasUnsubscribedChannels === 'boolean'
      ? subscriptionData.hasUnsubscribedChannels
      : false;
  const missingChannels =
    subscriptionData && Array.isArray(subscriptionData.missingChannels)
      ? subscriptionData.missingChannels
      : [];

  // Собираем объект подписок: ключ — id канала, значение — true/false
  let subscriptionsById: Record<string, boolean> = {};
  if (
    subscriptionData?.debugInfo?.channels &&
    subscriptionData?.debugInfo?.checkResult?.subscriptions
  ) {
    const rawSubs = subscriptionData.debugInfo.checkResult.subscriptions;

    for (const channel of subscriptionData.debugInfo.channels) {
      // Логика: отдаем true если rawSubs содержит chat_id, username или id как ключ и там явно true
      let isTrue = false;
      if (channel.chat_id && rawSubs[channel.chat_id] === true) isTrue = true;
      if (!isTrue && channel.username && rawSubs[channel.username] === true) isTrue = true;
      if (!isTrue && rawSubs[channel.id] === true) isTrue = true;
      subscriptionsById[channel.id] = isTrue;
      console.log(`[DEBUG SUBS] channel:`, channel, 'subscribed:', isTrue);
    }
  }

  // Отфильтровываем только те каналы, которые действительно требуют подписки (is required)
  const missingChannelIds = new Set(missingChannels.map(ch => ch.id));
  const requiredChannels = channels.filter(c => c.required);

  // Показываем требование только если есть неподтвержденные — используем полный список required каналов
  if (hasUnsubscribedChannels) {
    // КАНАЛЫ ДЛЯ ПРОВЕРКИ — только required и реально пропущенные
    const missingRequiredChannels = requiredChannels.filter(c => missingChannelIds.has(c.id));

    return (
      <ChannelRequirement 
        channels={missingRequiredChannels} 
        subscriptions={subscriptionsById}
        onCheckSubscription={handleCheckSubscription}
        isChecking={checkingChannelId}
      />
    );
  }

  // --- ОСНОВНОЙ ИНТЕРФЕЙС для авторизованных ---
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
        {/* Место для карточек, гороскопов и основного контента */}
        {/* <HoroscopeCard />, <FortuneCard /> и др. можно размещать тут */}

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Powered by Telegram WebApp • Версия 2.0
          </p>
        </div>
      </div>
    </div>
  );
};
