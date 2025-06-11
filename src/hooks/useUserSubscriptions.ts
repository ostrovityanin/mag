
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useState } from 'react';

export const useUserSubscriptions = () => {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();
  const queryClient = useQueryClient();
  const [checkingChannel, setCheckingChannel] = useState<string | null>(null);

  const subscriptionQuery = useQuery({
    queryKey: ['user-subscriptions', authenticatedUser?.id],
    queryFn: async () => {
      if (!isAuthenticated || !authenticatedUser) {
        console.log('=== USER SUBSCRIPTIONS: НЕ АУТЕНТИФИЦИРОВАН ===');
        throw new Error('Пользователь не аутентифицирован');
      }

      console.log('=== ПРОВЕРКА ПОДПИСОК ===');
      console.log('Аутентифицированный пользователь:', authenticatedUser);
      console.log('Telegram ID пользователя:', authenticatedUser.telegram_id);

      try {
        // Вызываем функцию проверки подписок
        const { data, error } = await supabase.functions.invoke('check-telegram-subscription', {
          body: {
            userId: authenticatedUser.telegram_id.toString(),
            username: authenticatedUser.username || '',
          },
        });

        if (error) {
          console.error('Ошибка функции проверки подписок:', error);
          throw error;
        }

        console.log('Результат проверки подписок:', data);
        return data;
      } catch (error) {
        console.error('Ошибка при проверке подписок:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!authenticatedUser,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchInterval: 10 * 60 * 1000, // 10 минут
  });

  const checkSubscription = async (channelId: string) => {
    if (!authenticatedUser) return;
    
    setCheckingChannel(channelId);
    try {
      // Повторная проверка конкретного канала
      await queryClient.invalidateQueries({
        queryKey: ['user-subscriptions', authenticatedUser.id]
      });
    } finally {
      setCheckingChannel(null);
    }
  };

  // Создаем объект subscriptions из данных ответа
  const subscriptions: Record<string, boolean> = {};
  if (subscriptionQuery.data?.subscriptions) {
    Object.keys(subscriptionQuery.data.subscriptions).forEach(channelId => {
      subscriptions[channelId] = subscriptionQuery.data.subscriptions[channelId];
    });
  }

  return {
    ...subscriptionQuery,
    subscriptions,
    checkingChannel,
    checkSubscription,
  };
};
