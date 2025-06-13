
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';

export const useUserSubscriptions = (appCode: 'druid' | 'cookie' = 'druid') => {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();

  return useQuery({
    queryKey: ['user-subscriptions', authenticatedUser?.id, appCode],
    enabled: isAuthenticated && !!authenticatedUser,
    queryFn: async () => {
      if (!isAuthenticated || !authenticatedUser) {
        console.log('=== USER SUBSCRIPTIONS: НЕ АУТЕНТИФИЦИРОВАН ===');
        throw new Error('Пользователь не аутентифицирован');
      }

      console.log('=== УПРОЩЕННАЯ ПРОВЕРКА ПОДПИСОК ===');
      console.log('Аутентифицированный пользователь:', authenticatedUser);
      console.log('Код приложения:', appCode);
      console.log('Telegram ID пользователя:', authenticatedUser.telegram_id);

      try {
        // 1. Получаем связи для нужного приложения
        const { data: appLinks, error: linkError } = await supabase
          .from('app_channels')
          .select('channel_id')
          .eq('app', appCode)
          .eq('required', true);

        if (linkError) {
          console.error('Ошибка получения связей приложения с каналами:', linkError);
          throw linkError;
        }

        console.log('Найденные связи app_channels:', appLinks);

        if (!appLinks || appLinks.length === 0) {
          console.log(`Нет обязательных каналов для приложения ${appCode}`);
          
          return {
            hasUnsubscribedChannels: false,
            missingChannels: [],
            allChannels: []
          };
        }

        // 2. Получаем сами каналы по ID
        const channelIds = appLinks.map(link => link.channel_id);
        const { data: channels, error: channelsError } = await supabase
          .from('channels')
          .select('id, username, name, chat_id')
          .in('id', channelIds);

        if (channelsError) {
          console.error('Ошибка получения каналов:', channelsError);
          throw channelsError;
        }

        console.log('Найденные каналы:', channels);

        if (!channels || channels.length === 0) {
          console.log('Каналы не найдены в таблице channels');
          return {
            hasUnsubscribedChannels: false,
            missingChannels: [],
            allChannels: []
          };
        }

        // 3. Формируем массив для проверки (приоритет chat_id, потом username)
        const channelIdsForCheck = channels.map(ch => ch.chat_id || ch.username!);
        console.log('Каналы для проверки:', channelIdsForCheck);

        // 4. Вызываем Edge Function для массовой проверки подписок
        const { data, error } = await supabase.functions.invoke('simple-check-subscription', {
          body: {
            userId: authenticatedUser.telegram_id.toString(),
            channelIds: channelIdsForCheck,
          },
        });

        if (error) {
          console.error('Ошибка проверки подписок через Edge Function:', error);
          throw error;
        }

        console.log('Результат проверки от Edge Function:', data);

        // 5. Обрабатываем результат проверки
        const subscriptions: Record<string, boolean> = data?.subscriptions || {};
        const missingChannels = channels.filter(ch => {
          const key = ch.chat_id || ch.username!;
          return !subscriptions[key];
        });
        const hasUnsubscribedChannels = missingChannels.length > 0;

        console.log('Обработанный результат:', { 
          subscriptions, 
          hasUnsubscribedChannels, 
          missingChannels 
        });
        
        return { 
          hasUnsubscribedChannels, 
          missingChannels,
          allChannels: channels
        };
      } catch (error) {
        console.error('Ошибка при проверке подписок:', error);
        throw error;
      }
    },
    staleTime: 0,           // всегда делаем свежий запрос
    gcTime: 5 * 60 * 1000,  // 5 минут кэш
  });
};
