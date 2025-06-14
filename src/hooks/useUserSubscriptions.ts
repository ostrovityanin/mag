
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

      console.log('=== НАЧАЛО ПРОВЕРКИ ПОДПИСОК ===');
      console.log('Пользователь ID:', authenticatedUser.telegram_id);
      console.log('Приложение:', appCode);

      try {
        // 1. Получаем список обязательных каналов для приложения
        console.log('Получаем список каналов для приложения:', appCode);
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

        if (appChannelsError) {
          console.error('Ошибка получения каналов приложения:', appChannelsError);
          throw new Error('Не удалось получить список каналов');
        }

        if (!appChannels || appChannels.length === 0) {
          console.log('Нет обязательных каналов для приложения');
          return {
            hasUnsubscribedChannels: false,
            missingChannels: [],
            isLoading: false,
            error: null
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

        console.log('Найдено каналов для проверки:', channels.length);

        if (channels.length === 0) {
          return {
            hasUnsubscribedChannels: false,
            missingChannels: [],
            isLoading: false,
            error: null
          };
        }

        // 3. Подготавливаем список идентификаторов каналов для проверки
        const channelIdentifiers = channels.map(c => c.chat_id || c.username!);
        console.log('Идентификаторы каналов для проверки:', channelIdentifiers);

        // 4. Вызываем edge function для проверки подписок
        console.log('Вызываем функцию проверки подписок...');
        const { data: checkResult, error: checkError } = await supabase.functions.invoke(
          'simple-check-subscription',
          {
            body: {
              userId: authenticatedUser.telegram_id.toString(),
              channelIds: channelIdentifiers,
            },
          }
        );

        if (checkError) {
          console.error('Ошибка вызова функции проверки:', checkError);
          throw new Error('Ошибка проверки подписок: ' + checkError.message);
        }

        console.log('Результат проверки подписок:', checkResult);

        // 5. Обрабатываем результат
        const subscriptions = checkResult?.subscriptions || {};
        const missingChannels: Channel[] = [];

        channels.forEach(channel => {
          const identifier = channel.chat_id || channel.username!;
          const isSubscribed = subscriptions[identifier] === true;
          
          console.log(`Канал ${channel.name} (${identifier}): ${isSubscribed ? 'подписан' : 'НЕ подписан'}`);
          
          if (!isSubscribed) {
            missingChannels.push(channel);
          }
        });

        const result = {
          hasUnsubscribedChannels: missingChannels.length > 0,
          missingChannels,
          isLoading: false,
          error: null
        };

        console.log('=== РЕЗУЛЬТАТ ПРОВЕРКИ ===');
        console.log('Есть неподписанные каналы:', result.hasUnsubscribedChannels);
        console.log('Количество неподписанных:', missingChannels.length);

        return result;

      } catch (error) {
        console.error('Критическая ошибка проверки подписок:', error);
        return {
          hasUnsubscribedChannels: true,
          missingChannels: [],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        };
      }
    },
  });
}
