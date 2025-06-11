
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';

export const useUserSubscriptions = () => {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();

  return useQuery({
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
        // Вызываем функцию проверки подписок
        const { data, error } = await supabase.functions.invoke('check-telegram-subscription', {
          body: {
            userId: authenticatedUser.telegram_id.toString(),
            username: authenticatedUser.username || '',
          },
        });

        if (error) {
          console.error('Ошибка функции проверки подписок:', error);
          throw error;
        }

        console.log('Результат проверки подписок:', data);
        return data;
      } catch (error) {
        console.error('Ошибка при проверке подписок:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!authenticatedUser,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchInterval: 10 * 60 * 1000, // 10 минут
  });
};
