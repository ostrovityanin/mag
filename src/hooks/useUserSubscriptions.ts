
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';

interface Channel {
  id: string;
  username: string | null;
  chat_id: string | null;
  name: string;
}

interface SubResult {
  hasUnsubscribedChannels: boolean;
  missingChannels: Channel[];
}

export function useUserSubscriptions(appCode: 'druid' | 'cookie' = 'druid') {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();

  return useQuery<SubResult, Error>({
    queryKey: ['user-subscriptions', authenticatedUser?.id, appCode],
    enabled: isAuthenticated && !!authenticatedUser,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    queryFn: async () => {
      if (!authenticatedUser) {
        throw new Error('Не аутентифицирован');
      }

      const startTime = Date.now();

      try {
        console.log('=== НАЧАЛО ПРОВЕРКИ ПОДПИСОК ===');
        console.log('Пользователь:', authenticatedUser.telegram_id);
        console.log('Приложение:', appCode);

        // Логируем начало проверки подписок
        await supabase
          .from('admin_logs')
          .insert({
            log_type: 'user_load',
            operation: 'subscription_check_start',
            details: {
              app_code: appCode,
              telegram_id: authenticatedUser.telegram_id,
              timestamp: new Date().toISOString(),
            },
            telegram_user_id: authenticatedUser.telegram_id,
            success: true,
          });

        // 1) берём список ID каналов из app_channels
        const { data: links, error: linkErr } = await supabase
          .from('app_channels')
          .select('channel_id')
          .eq('app', appCode)
          .eq('required', true);
        if (linkErr) throw linkErr;

        const channelIds = links.map(l => l.channel_id);
        console.log('Найдено обязательных каналов:', channelIds.length);

        if (channelIds.length === 0) {
          // Логируем случай, когда нет обязательных каналов
          await supabase
            .from('admin_logs')
            .insert({
              log_type: 'user_load',
              operation: 'subscription_check_complete',
              details: {
                app_code: appCode,
                telegram_id: authenticatedUser.telegram_id,
                required_channels_count: 0,
                result: 'no_required_channels',
              },
              telegram_user_id: authenticatedUser.telegram_id,
              execution_time_ms: Date.now() - startTime,
              success: true,
            });

          return { hasUnsubscribedChannels: false, missingChannels: [] };
        }

        // 2) подтягиваем метаданные каналов для UI
        const { data: channels, error: chanErr } = await supabase
          .from('channels')
          .select('id, username, chat_id, name')
          .in('id', channelIds);
        if (chanErr) throw chanErr;

        console.log('Метаданные каналов получены:', channels.length);

        // 3) вызываем Edge Function для пакетной проверки
        const { data: fnData, error: fnErr } = await supabase.functions.invoke(
          'simple-check-subscription',
          {
            body: {
              userId: authenticatedUser.telegram_id.toString(),
              channelIds: channels.map(c => c.chat_id || c.username!),
            },
          }
        );
        if (fnErr) throw fnErr;

        const subs: Record<string, boolean> = fnData.subscriptions || {};
        console.log('Результат проверки подписок:', subs);

        // 4) формируем список непройденных
        const missing = channels.filter(c => {
          const key = c.chat_id || c.username!;
          return !subs[key];
        });

        const result = {
          hasUnsubscribedChannels: missing.length > 0,
          missingChannels: missing,
        };

        // Логируем завершение проверки подписок
        await supabase
          .from('admin_logs')
          .insert({
            log_type: 'user_load',
            operation: 'subscription_check_complete',
            details: {
              app_code: appCode,
              telegram_id: authenticatedUser.telegram_id,
              required_channels_count: channelIds.length,
              checked_channels_count: channels.length,
              missing_channels_count: missing.length,
              missing_channels: missing.map(c => ({ id: c.id, name: c.name })),
              subscriptions_result: subs,
              access_granted: missing.length === 0,
            },
            user_count: 1,
            filtered_count: missing.length,
            telegram_user_id: authenticatedUser.telegram_id,
            execution_time_ms: Date.now() - startTime,
            success: true,
          });

        console.log('=== ПРОВЕРКА ПОДПИСОК ЗАВЕРШЕНА ===');
        console.log('Результат:', result);

        return result;
      } catch (error) {
        console.error('Ошибка проверки подписок:', error);

        // Логируем ошибку проверки подписок
        await supabase
          .from('admin_logs')
          .insert({
            log_type: 'user_load',
            operation: 'subscription_check_failed',
            details: {
              app_code: appCode,
              telegram_id: authenticatedUser.telegram_id,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            telegram_user_id: authenticatedUser.telegram_id,
            execution_time_ms: Date.now() - startTime,
            success: false,
            error_message: error instanceof Error ? error.message : 'Ошибка проверки подписок',
          });

        throw error;
      }
    },
  });
}
