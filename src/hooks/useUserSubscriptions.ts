
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';

interface Channel {
  id: string;
  username: string;
  chat_id: string | null;
  name: string;
  invite_link: string | null;
}

interface SubscriptionResult {
  hasUnsubscribedChannels: boolean;
  missingChannels: Channel[];
  subscriptionsById: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  debugInfo?: any;
}

export function useUserSubscriptions(appCode: 'druid' | 'cookie' = 'druid') {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();

  return useQuery<SubscriptionResult, Error>({
    queryKey: ['user-subscriptions', authenticatedUser?.id, appCode],
    enabled: isAuthenticated && !!authenticatedUser,
    staleTime: 0, // Данные считаются устаревшими немедленно
    refetchOnMount: 'always', // Всегда запрашивать при монтировании компонента
    refetchOnWindowFocus: true, // Запрашивать при фокусе на окне
    queryFn: async () => {
      if (!authenticatedUser) {
        throw new Error('Пользователь не аутентифицирован');
      }

      const debugInfo: any = {
        authenticatedUser,
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
            channel_id,
            channels (
              id,
              username,
              chat_id,
              name,
              invite_link
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
          .map(ac => ac.channels)
          .filter(Boolean)
          .map(c => ({
            id: c.id,
            username: c.username,
            chat_id: c.chat_id,
            name: c.name,
            invite_link: c.invite_link
          }));

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

        // Добавляем передачу username и appCode для логирования
        const { data: checkResult, error: checkError } = await supabase.functions.invoke(
          'simple-check-subscription',
          {
            body: {
              userId: authenticatedUser.telegram_id.toString(),
              channelIds: channelIdentifiers,
              appCode, // <- новый параметр для таблицы subscription_checks_log
              username: authenticatedUser.username
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

        channels.forEach(channel => {
          const username = channel.username;
          const chatId = channel.chat_id;

          let isSubscribed = false;
          // Проверяем по ID чата
          if (chatId && subscriptions[chatId] === true) {
            isSubscribed = true;
          }
          // Проверяем по имени пользователя (например, 'mychannel')
          if (!isSubscribed && username && subscriptions[username] === true) {
            isSubscribed = true;
          }
          // Проверяем по имени пользователя с @ (например, '@mychannel')
          if (!isSubscribed && username && subscriptions[`@${username}`] === true) {
            isSubscribed = true;
          }
          
          subscriptionsById[channel.id] = isSubscribed;

          if (!isSubscribed) {
            missingChannels.push(channel);
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
