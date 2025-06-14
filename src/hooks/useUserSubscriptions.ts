
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';

interface Channel {
  id: string;
  username: string | null;
  chat_id: string | null;
  name: string;
}

interface SubscriptionResult {
  hasUnsubscribedChannels: boolean;
  missingChannels: Channel[];
  isLoading: boolean;
  error: string | null;
  debugInfo?: any; // для возврата в UI, но не писать в консоль!
}

export function useUserSubscriptions(appCode: 'druid' | 'cookie' = 'druid') {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();

  return useQuery<SubscriptionResult, Error>({
    queryKey: ['user-subscriptions', authenticatedUser?.id, appCode],
    enabled: isAuthenticated && !!authenticatedUser,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!authenticatedUser) {
        throw new Error('Пользователь не аутентифицирован');
      }

      // Не пишем ничего в консоль!
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
              name
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
            name: c.name
          }));

        debugInfo.channels = channels;

        if (channels.length === 0) {
          debugInfo.step = 'channels_len_0';
          return {
            hasUnsubscribedChannels: false,
            missingChannels: [],
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
              userId: authenticatedUser.telegram_id.toString(),
              channelIds: channelIdentifiers,
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

        // 5. Обрабатываем результат
        const subscriptions = checkResult?.subscriptions || {};
        const missingChannels: Channel[] = [];

        channels.forEach(channel => {
          const identifier = channel.chat_id || channel.username!;
          const isSubscribed = subscriptions[identifier] === true;
          if (!isSubscribed) {
            missingChannels.push(channel);
          }
        });
        debugInfo.missingChannels = missingChannels;

        const result = {
          hasUnsubscribedChannels: missingChannels.length > 0,
          missingChannels,
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
          isLoading: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          debugInfo,
        };
      }
    },
  });
}
