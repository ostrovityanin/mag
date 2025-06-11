
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useState } from 'react';

export const useUserSubscriptions = () => {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState<string | null>(null);

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
        // Получаем все каналы
        const { data: channels, error: channelsError } = await supabase
          .from('required_channels')
          .select('*')
          .eq('required', true);

        if (channelsError) {
          console.error('Ошибка получения каналов:', channelsError);
          throw channelsError;
        }

        if (!channels || channels.length === 0) {
          console.log('Нет обязательных каналов для проверки');
          return {
            subscriptions: {},
            hasUnsubscribedChannels: false
          };
        }

        // Проверяем подписки для каждого канала
        const subscriptions: Record<string, boolean> = {};
        let hasUnsubscribedChannels = false;

        for (const channel of channels) {
          try {
            const { data, error } = await supabase.functions.invoke('check-telegram-subscription', {
              body: {
                userId: authenticatedUser.telegram_id.toString(),
                channelId: channel.id,
                username: authenticatedUser.username || '',
              },
            });

            if (error) {
              console.error(`Ошибка проверки канала ${channel.id}:`, error);
              subscriptions[channel.id] = false;
              hasUnsubscribedChannels = true;
            } else {
              subscriptions[channel.id] = data?.isSubscribed || false;
              if (!data?.isSubscribed) {
                hasUnsubscribedChannels = true;
              }
            }
          } catch (error) {
            console.error(`Ошибка при проверке канала ${channel.id}:`, error);
            subscriptions[channel.id] = false;
            hasUnsubscribedChannels = true;
          }
        }

        console.log('Результат проверки подписок:', { subscriptions, hasUnsubscribedChannels });
        return { subscriptions, hasUnsubscribedChannels };
      } catch (error) {
        console.error('Ошибка при проверке подписок:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!authenticatedUser,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchInterval: 10 * 60 * 1000, // 10 минут
  });

  const checkSubscription = async (channelId: string, username: string) => {
    console.log('=== НАЧАЛО ФУНКЦИИ checkSubscription ===');
    console.log('Параметры:', { channelId, username });
    console.log('authenticatedUser:', authenticatedUser);
    
    if (!authenticatedUser) {
      console.error('Пользователь не аутентифицирован для проверки подписки');
      return;
    }
    
    setIsChecking(channelId);
    
    try {
      console.log('Вызов edge function с параметрами:', {
        userId: authenticatedUser.telegram_id.toString(),
        channelId: channelId,
        username: authenticatedUser.username || '',
      });
      
      const { data, error } = await supabase.functions.invoke('check-telegram-subscription', {
        body: {
          userId: authenticatedUser.telegram_id.toString(),
          channelId: channelId,
          username: authenticatedUser.username || '',
        },
      });

      console.log('Ответ от edge function:', { data, error });

      if (error) {
        console.error('Ошибка проверки канала:', error);
      } else {
        console.log('Результат проверки канала:', data);
      }

      // Обновляем кэш
      await queryClient.invalidateQueries({
        queryKey: ['user-subscriptions', authenticatedUser.id]
      });
      
      console.log('Кэш обновлен');
    } catch (error) {
      console.error('Ошибка при проверке канала:', error);
    } finally {
      setIsChecking(null);
      console.log('=== КОНЕЦ ПРОВЕРКИ ОТДЕЛЬНОГО КАНАЛА ===');
    }
  };

  // Создаем объект subscriptions из данных ответа
  const subscriptions: Record<string, boolean> = {};
  if (subscriptionQuery.data?.subscriptions) {
    Object.keys(subscriptionQuery.data.subscriptions).forEach(channelId => {
      subscriptions[channelId] = subscriptionQuery.data.subscriptions[channelId];
    });
  }

  console.log('=== useUserSubscriptions РЕЗУЛЬТАТ ===');
  console.log('subscriptions:', subscriptions);
  console.log('isChecking:', isChecking);
  console.log('checkSubscription функция:', typeof checkSubscription);

  return {
    ...subscriptionQuery,
    subscriptions,
    isChecking,
    checkSubscription,
  };
};
