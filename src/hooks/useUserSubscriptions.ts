
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { useState } from 'react';

export const useUserSubscriptions = (appCode: 'druid' | 'cookie' = 'druid') => {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();
  const queryClient = useQueryClient();
  const { logAdminAction } = useAdminLogs();
  const [isChecking, setIsChecking] = useState<string | null>(null);

  const subscriptionQuery = useQuery({
    queryKey: ['user-subscriptions', authenticatedUser?.id, appCode],
    queryFn: async () => {
      if (!isAuthenticated || !authenticatedUser) {
        console.log('=== USER SUBSCRIPTIONS: НЕ АУТЕНТИФИЦИРОВАН ===');
        throw new Error('Пользователь не аутентифицирован');
      }

      const startTime = Date.now();
      console.log('=== ПРОВЕРКА ПОДПИСОК ===');
      console.log('Аутентифицированный пользователь:', authenticatedUser);
      console.log('Код приложения:', appCode);
      console.log('Telegram ID пользователя:', authenticatedUser.telegram_id);

      try {
        // Получаем каналы для указанного приложения через новую структуру
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
          .eq('app', appCode)
          .eq('required', true);

        if (channelsError) {
          console.error('Ошибка получения каналов:', channelsError);
          throw channelsError;
        }

        if (!appChannels || appChannels.length === 0) {
          console.log(`Нет обязательных каналов для приложения ${appCode}`);
          
          logAdminAction({
            log_type: 'data_query',
            operation: 'check_user_subscriptions',
            details: { 
              channels_found: 0,
              user_id: authenticatedUser.telegram_id,
              app_code: appCode,
            },
            user_count: 0,
            telegram_user_id: authenticatedUser.telegram_id,
            execution_time_ms: Date.now() - startTime,
            success: true,
          });
          
          return {
            subscriptions: {},
            hasUnsubscribedChannels: false,
            missingChannels: []
          };
        }

        // Извлекаем каналы и формируем массив для проверки
        const channels = appChannels.map(ac => ac.channels).filter(Boolean);
        const channelUsernames = channels.map(ch => ch.username);

        console.log('Каналы для проверки:', channelUsernames);

        // Вызываем Edge Function для массовой проверки подписок
        const { data, error } = await supabase.functions.invoke('simple-check-subscription', {
          body: {
            userId: authenticatedUser.telegram_id.toString(),
            channelIds: channelUsernames, // Передаем массив юзернеймов
          },
        });

        if (error) {
          console.error('Ошибка проверки подписок через Edge Function:', error);
          throw error;
        }

        console.log('Результат проверки от Edge Function:', data);

        // Обрабатываем результат проверки
        const subscriptions: Record<string, boolean> = data?.subscriptions || {};
        const missingChannels = channels.filter(ch => !subscriptions[ch.username]);
        const hasUnsubscribedChannels = missingChannels.length > 0;

        console.log('Обработанный результат:', { 
          subscriptions, 
          hasUnsubscribedChannels, 
          missingChannels 
        });
        
        // Логируем проверку подписок
        logAdminAction({
          log_type: 'data_query',
          operation: 'check_user_subscriptions',
          details: { 
            channels_checked: channels.length,
            subscriptions_result: subscriptions,
            has_unsubscribed: hasUnsubscribedChannels,
            user_id: authenticatedUser.telegram_id,
            app_code: appCode,
            missing_channels: missingChannels.map(ch => ch.username),
          },
          user_count: channels.length,
          filtered_count: Object.values(subscriptions).filter(Boolean).length,
          telegram_user_id: authenticatedUser.telegram_id,
          execution_time_ms: Date.now() - startTime,
          success: true,
        });
        
        return { 
          subscriptions, 
          hasUnsubscribedChannels, 
          missingChannels,
          allChannels: channels
        };
      } catch (error) {
        console.error('Ошибка при проверке подписок:', error);
        
        // Логируем ошибку
        logAdminAction({
          log_type: 'data_query',
          operation: 'check_user_subscriptions_failed',
          details: { 
            error_message: error instanceof Error ? error.message : 'Unknown error',
            user_id: authenticatedUser.telegram_id,
            app_code: appCode,
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
        channelIds: [channelId], // Передаем как массив
      });
      
      const { data, error } = await supabase.functions.invoke('simple-check-subscription', {
        body: {
          userId: authenticatedUser.telegram_id.toString(),
          channelIds: [channelId], // Передаем как массив для единообразия
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
          subscription_result: data?.subscriptions?.[channelId] || false,
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
        queryKey: ['user-subscriptions', authenticatedUser.id, appCode]
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
  console.log('missingChannels:', subscriptionQuery.data?.missingChannels || []);
  console.log('isChecking:', isChecking);

  return {
    ...subscriptionQuery,
    subscriptions: subscriptionQuery.data?.subscriptions || {},
    hasUnsubscribedChannels: subscriptionQuery.data?.hasUnsubscribedChannels || false,
    missingChannels: subscriptionQuery.data?.missingChannels || [],
    allChannels: subscriptionQuery.data?.allChannels || [],
    isChecking,
    checkSubscription,
  };
};
