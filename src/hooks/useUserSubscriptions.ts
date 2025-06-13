
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { useState } from 'react';

export const useUserSubscriptions = () => {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();
  const queryClient = useQueryClient();
  const { logAdminAction } = useAdminLogs();
  const [isChecking, setIsChecking] = useState<string | null>(null);

  const subscriptionQuery = useQuery({
    queryKey: ['user-subscriptions', authenticatedUser?.id],
    queryFn: async () => {
      if (!isAuthenticated || !authenticatedUser) {
        console.log('=== USER SUBSCRIPTIONS: НЕ АУТЕНТИФИЦИРОВАН ===');
        throw new Error('Пользователь не аутентифицирован');
      }

      const startTime = Date.now();
      console.log('=== ПРОВЕРКА ПОДПИСОК ===');
      console.log('Аутентифицированный пользователь:', authenticatedUser);
      console.log('Telegram ID пользователя:', authenticatedUser.telegram_id);

      try {
        // Получаем каналы для приложения druid через новую структуру
        const { data: appChannels, error: channelsError } = await supabase
          .from('app_channels')
          .select(`
            required,
            channels (
              id,
              username,
              name,
              chat_id
            )
          `)
          .eq('app', 'druid')
          .eq('required', true);

        if (channelsError) {
          console.error('Ошибка получения каналов:', channelsError);
          throw channelsError;
        }

        if (!appChannels || appChannels.length === 0) {
          console.log('Нет обязательных каналов для проверки');
          
          logAdminAction({
            log_type: 'data_query',
            operation: 'check_user_subscriptions',
            details: { 
              channels_found: 0,
              user_id: authenticatedUser.telegram_id,
            },
            user_count: 0,
            telegram_user_id: authenticatedUser.telegram_id,
            execution_time_ms: Date.now() - startTime,
            success: true,
          });
          
          return {
            subscriptions: {},
            hasUnsubscribedChannels: false
          };
        }

        // Проверяем подписки для каждого канала
        const subscriptions: Record<string, boolean> = {};
        let hasUnsubscribedChannels = false;

        for (const appChannel of appChannels) {
          const channel = appChannel.channels;
          if (!channel) continue;
          
          try {
            console.log('Проверяем канал:', channel.username);
            
            const { data, error } = await supabase.functions.invoke('simple-check-subscription', {
              body: {
                userId: authenticatedUser.telegram_id.toString(),
                channelId: channel.username, // Используем username как channelId
              },
            });

            if (error) {
              console.error(`Ошибка проверки канала ${channel.username}:`, error);
              subscriptions[channel.username] = false;
              hasUnsubscribedChannels = true;
            } else {
              const isSubscribed = data?.isSubscribed || false;
              subscriptions[channel.username] = isSubscribed;
              if (!isSubscribed) {
                hasUnsubscribedChannels = true;
              }
              console.log(`Канал ${channel.username}: подписка ${isSubscribed ? 'есть' : 'отсутствует'}`);
            }
          } catch (error) {
            console.error(`Ошибка при проверке канала ${channel.username}:`, error);
            subscriptions[channel.username] = false;
            hasUnsubscribedChannels = true;
          }
        }

        console.log('Результат проверки подписок:', { subscriptions, hasUnsubscribedChannels });
        
        // Логируем проверку подписок
        logAdminAction({
          log_type: 'data_query',
          operation: 'check_user_subscriptions',
          details: { 
            channels_checked: appChannels.length,
            subscriptions_result: subscriptions,
            has_unsubscribed: hasUnsubscribedChannels,
            user_id: authenticatedUser.telegram_id,
          },
          user_count: appChannels.length,
          filtered_count: Object.values(subscriptions).filter(Boolean).length,
          telegram_user_id: authenticatedUser.telegram_id,
          execution_time_ms: Date.now() - startTime,
          success: true,
        });
        
        return { subscriptions, hasUnsubscribedChannels };
      } catch (error) {
        console.error('Ошибка при проверке подписок:', error);
        
        // Логируем ошибку
        logAdminAction({
          log_type: 'data_query',
          operation: 'check_user_subscriptions_failed',
          details: { 
            error_message: error instanceof Error ? error.message : 'Unknown error',
            user_id: authenticatedUser.telegram_id,
          },
          telegram_user_id: authenticatedUser.telegram_id,
          execution_time_ms: Date.now() - startTime,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
        
        throw error;
      }
    },
    enabled: isAuthenticated && !!authenticatedUser,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchInterval: 10 * 60 * 1000, // 10 минут
  });

  const checkSubscription = async (channelId: string) => {
    console.log('=== НАЧАЛО ФУНКЦИИ checkSubscription ===');
    console.log('Параметры:', { channelId });
    console.log('authenticatedUser:', authenticatedUser);
    
    if (!authenticatedUser) {
      console.error('Пользователь не аутентифицирован для проверки подписки');
      return;
    }
    
    setIsChecking(channelId);
    const startTime = Date.now();
    
    try {
      console.log('Вызов edge function с параметрами:', {
        userId: authenticatedUser.telegram_id.toString(),
        channelId: channelId,
      });
      
      const { data, error } = await supabase.functions.invoke('simple-check-subscription', {
        body: {
          userId: authenticatedUser.telegram_id.toString(),
          channelId: channelId,
        },
      });

      console.log('Ответ от edge function:', { data, error });

      // Логируем проверку отдельного канала
      logAdminAction({
        log_type: 'data_query',
        operation: 'check_single_subscription',
        details: {
          channel_id: channelId,
          user_id: authenticatedUser.telegram_id,
          subscription_result: data?.isSubscribed || false,
          has_error: !!error,
        },
        telegram_user_id: authenticatedUser.telegram_id,
        execution_time_ms: Date.now() - startTime,
        success: !error,
        error_message: error ? JSON.stringify(error) : undefined,
      });

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
      
      // Логируем ошибку проверки
      logAdminAction({
        log_type: 'data_query',
        operation: 'check_single_subscription_failed',
        details: {
          channel_id: channelId,
          user_id: authenticatedUser.telegram_id,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
        telegram_user_id: authenticatedUser.telegram_id,
        execution_time_ms: Date.now() - startTime,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(null);
      console.log('=== КОНЕЦ ПРОВЕРКИ ОТДЕЛЬНОГО КАНАЛА ===');
    }
  };

  console.log('=== useUserSubscriptions РЕЗУЛЬТАТ ===');
  console.log('subscriptions:', subscriptionQuery.data?.subscriptions || {});
  console.log('hasUnsubscribedChannels:', subscriptionQuery.data?.hasUnsubscribedChannels || false);
  console.log('isChecking:', isChecking);

  return {
    ...subscriptionQuery,
    subscriptions: subscriptionQuery.data?.subscriptions || {},
    hasUnsubscribedChannels: subscriptionQuery.data?.hasUnsubscribedChannels || false,
    isChecking,
    checkSubscription,
  };
};
