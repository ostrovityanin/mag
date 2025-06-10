
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useToast } from '@/hooks/use-toast';

export const useUserSubscriptions = () => {
  const { user } = useTelegramContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [checkingChannel, setCheckingChannel] = useState<string | null>(null);

  const checkSubscriptionMutation = useMutation({
    mutationFn: async ({ channelId, username }: { channelId: string; username: string }) => {
      if (!user?.id) {
        throw new Error('Пользователь не найден');
      }

      console.log(`Checking subscription for user ${user.id} to channel @${username}`);

      // Call the Edge Function to check subscription
      const { data, error } = await supabase.functions.invoke('check-telegram-subscription', {
        body: {
          userId: user.id.toString(),
          channelId: channelId,
          username: username
        }
      });

      if (error) {
        console.error('Error calling subscription check function:', error);
        throw new Error('Ошибка при проверке подписки');
      }

      if (!data?.success) {
        console.error('Subscription check failed:', data?.error);
        throw new Error(data?.error || 'Ошибка при проверке подписки');
      }

      return { 
        channelId, 
        isSubscribed: data.isSubscribed 
      };
    },
    onSuccess: ({ channelId, isSubscribed }) => {
      setSubscriptions(prev => ({
        ...prev,
        [channelId]: isSubscribed
      }));
      setCheckingChannel(null);
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      
      if (isSubscribed) {
        toast({
          title: "Подписка подтверждена!",
          description: "Спасибо за подписку на канал.",
        });
      } else {
        toast({
          title: "Подписка не найдена",
          description: "Пожалуйста, подпишитесь на канал и попробуйте снова.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error checking subscription:', error);
      setCheckingChannel(null);
      toast({
        title: "Ошибка проверки",
        description: error.message || "Не удалось проверить подписку. Попробуйте снова.",
        variant: "destructive",
      });
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
