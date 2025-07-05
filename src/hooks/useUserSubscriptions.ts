
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';
import type { Channel } from './useChannels';

interface DebugInfo {
  user: ReturnType<typeof useTelegramContext>['user'];
  step: string;
  appCode: string;
  times: Record<string, number>;
  appChannelsRaw: unknown;
  channels: Channel[] | null;
  channelIdentifiers: string[] | null;
  checkResult: unknown;
  missingChannels: Channel[] | null;
  thrownError: unknown;
  checkError?: unknown;
  subscriptionsById?: Record<string, boolean>;
}

interface SubscriptionResult {
  hasUnsubscribedChannels: boolean;
  missingChannels: Channel[];
  subscriptionsById: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  debugInfo?: DebugInfo;
}

export function useUserSubscriptions(appCode: 'druid' | 'cookie' = 'druid') {
  const { user, isAuthenticated } = useTelegramContext();

  return useQuery<SubscriptionResult, Error>({
    queryKey: ['user-subscriptions', user?.id, appCode],
    enabled: isAuthenticated && !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      const debugInfo: DebugInfo = {
        user,
        step: 'start',
        appCode,
        times: {},
        appChannelsRaw: null,
        channels: null,
        channelIdentifiers: null,
        checkResult: null,
        missingChannels: null,
        thrownError: null,
      };
      debugInfo.times.start = Date.now();

      try {
        const { data: appChannels, error: appChannelsError } = await supabase
          .from('app_channels')
          .select(`
            app,
            required,
            channels (
              id,
              username,
              chat_id,
              name,
              invite_link,
              created_at
            )
          `)
          .eq('app', appCode)
          .eq('required', true);

        debugInfo.times.gotChannels = Date.now();
        debugInfo.appChannelsRaw = appChannels;
        
        if (appChannelsError) {
          debugInfo.thrownError = appChannelsError;
          throw new Error('Не удалось получить список каналов');
        }

        if (!appChannels || appChannels.length === 0) {
          debugInfo.channels = [];
          return {
            hasUnsubscribedChannels: false,
            missingChannels: [],
            subscriptionsById: {},
            isLoading: false,
            error: null,
            debugInfo,
          };
        }

        const channels: Channel[] = appChannels
          .map(ac => {
            if (!ac.channels) return null;
            return {
              ...ac.channels,
              app_name: ac.app,
              required: ac.required,
            };
          })
          .filter((c): c is Channel => c !== null);

        debugInfo.channels = channels;

        if (channels.length === 0) {
          debugInfo.step = 'channels_len_0';
          return {
            hasUnsubscribedChannels: false,
            missingChannels: [],
            subscriptionsById: {},
            isLoading: false,
            error: null,
            debugInfo,
          };
        }

        const channelIdentifiers = channels.map(c => c.chat_id || c.username!);
        debugInfo.channelIdentifiers = channelIdentifiers;

        const { data: checkResult, error: checkError } = await supabase.functions.invoke(
          'simple-check-subscription',
          {
            body: {
              userId: user.id.toString(),
              channelIds: channelIdentifiers,
              appCode,
              username: user.username
            },
          }
        );
        
        debugInfo.times.invokedFunction = Date.now();
        debugInfo.checkResult = checkResult;
        debugInfo.checkError = checkError;

        if (checkError) {
          debugInfo.thrownError = checkError;
          throw new Error('Ошибка проверки подписок: ' + checkError.message);
        }

        const subscriptions = checkResult?.subscriptions || {};
        const missingChannels: Channel[] = [];
        const subscriptionsById: Record<string, boolean> = {};

        // Улучшенная логика обработки подписок с учетом ошибок
        channels.forEach(channel => {
          const username = channel.username;
          const chatId = channel.chat_id;

          let isSubscribed = false;
          
          // Проверяем подписку по разным идентификаторам
          if (chatId && subscriptions[chatId] === true) {
            isSubscribed = true;
          } else if (username && subscriptions[username] === true) {
            isSubscribed = true;
          } else if (username && subscriptions[`@${username}`] === true) {
            isSubscribed = true;
          }
          
          subscriptionsById[channel.id] = isSubscribed;

          // Добавляем в список недостающих только если:
          // 1. Пользователь не подписан
          // 2. И проверка не завершилась ошибкой (статус не "error")
          if (!isSubscribed) {
            // Проверяем, была ли ошибка при проверке этого канала
            const hasError = (chatId && subscriptions[chatId] === 'error') || 
                           (username && subscriptions[username] === 'error') ||
                           (username && subscriptions[`@${username}`] === 'error');
            
            // Если ошибка проверки канала, логируем но не блокируем пользователя
            if (hasError) {
              console.warn(`Ошибка проверки канала ${channel.name} (${chatId || username}) - пропускаем проверку`);
            } else {
              // Добавляем только каналы без ошибок проверки
              missingChannels.push(channel);
            }
          }
        });
        
        debugInfo.missingChannels = missingChannels;
        debugInfo.subscriptionsById = subscriptionsById;

        const result: SubscriptionResult = {
          hasUnsubscribedChannels: missingChannels.length > 0,
          missingChannels,
          subscriptionsById,
          isLoading: false,
          error: null,
          debugInfo,
        };

        return result;

      } catch (error) {
        debugInfo.thrownError = error;
        return {
          hasUnsubscribedChannels: true,
          missingChannels: [],
          subscriptionsById: {},
          isLoading: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          debugInfo,
        };
      }
    },
  });
}
