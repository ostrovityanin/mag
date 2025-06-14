
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
  debugInfo?: any; // добавляем для возврата деталей в UI
}

export function useUserSubscriptions(appCode: 'druid' | 'cookie' = 'druid') {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();

  return useQuery<SubscriptionResult, Error>({
    queryKey: ['user-subscriptions', authenticatedUser?.id, appCode],
    enabled: isAuthenticated && !!authenticatedUser,
    staleTime: 30000, // 30 секунд
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!authenticatedUser) {
        throw new Error('Пользователь не аутентифицирован');
      }

      // --- Начало лога ---
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
      console.log('[ПОДПИСКИ] --- НАЧАЛО ПРОВЕРКИ ПОДПИСОК ---');
      console.log('[ПОДПИСКИ]', { authenticatedUser, appCode });

      try {
        // 1. Получаем список обязательных каналов для приложения
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
          console.error('[ПОДПИСКИ] Ошибка получения каналов:', appChannelsError);
          throw new Error('Не удалось получить список каналов');
        }

        if (!appChannels || appChannels.length === 0) {
          console.log('[ПОДПИСКИ] Нет обязательных каналов для приложения');
          debugInfo.channels = [];
          return {
            hasUnsubscribedChannels: false,
            missingChannels: [],
            isLoading: false,
            error: null,
            debugInfo,
          };
        }

        // 2. Извлекаем данные каналов
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

        // 3. Подготавливаем список идентификаторов каналов для проверки
        const channelIdentifiers = channels.map(c => c.chat_id || c.username!);
        debugInfo.channelIdentifiers = channelIdentifiers;
        console.log('[ПОДПИСКИ] Идентификаторы каналов для проверки:', channelIdentifiers);

        // 4. Вызываем edge function для проверки подписок
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
          console.error('[ПОДПИСКИ] Ошибка вызова функции проверки:', checkError);
          debugInfo.thrownError = checkError;
          throw new Error('Ошибка проверки подписок: ' + checkError.message);
        }

        console.log('[ПОДПИСКИ] Результат функции:', checkResult);

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

        console.log('[ПОДПИСКИ] --- РЕЗУЛЬТАТ:', result);

        return result;

      } catch (error) {
        debugInfo.thrownError = error;
        console.error('[ПОДПИСКИ] Критическая ошибка проверки подписок:', error);
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
