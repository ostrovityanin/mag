
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';

export const useUserSubscriptions = () => {
  const { user } = useTelegramContext();
  const queryClient = useQueryClient();
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [checkingChannel, setCheckingChannel] = useState<string | null>(null);

  const checkSubscriptionMutation = useMutation({
    mutationFn: async ({ channelId, username }: { channelId: string; username: string }) => {
      if (!user) throw new Error('Пользователь не найден');

      // Здесь можно добавить реальную проверку через Telegram Bot API
      // Пока используем симуляцию для демонстрации
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const isSubscribed = Math.random() > 0.3;

      // Сохраняем результат проверки в базу данных
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id?.toString() || '',
          channel_id: channelId,
          is_subscribed: isSubscribed,
          checked_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,channel_id'
        });

      if (error) {
        console.error('Error saving subscription status:', error);
      }

      return { channelId, isSubscribed };
    },
    onSuccess: ({ channelId, isSubscribed }) => {
      setSubscriptions(prev => ({
        ...prev,
        [channelId]: isSubscribed
      }));
      setCheckingChannel(null);
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
    onError: (error) => {
      console.error('Error checking subscription:', error);
      setCheckingChannel(null);
    }
  });

  const checkSubscription = useCallback((channelId: string, username: string) => {
    setCheckingChannel(channelId);
    checkSubscriptionMutation.mutate({ channelId, username });
  }, [checkSubscriptionMutation]);

  return {
    subscriptions,
    checkingChannel,
    checkSubscription,
    isChecking: checkSubscriptionMutation.isPending
  };
};
