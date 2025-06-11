
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
      // Используем тестового пользователя, если реального нет
      const userId = user?.id || 123456789;
      
      console.log('=== SUBSCRIPTION CHECK DEBUG ===');
      console.log('Original user object:', user);
      console.log('Using user ID:', userId);
      console.log('User ID type:', typeof userId);
      console.log('Channel ID:', channelId);
      console.log('Channel username:', username);

      if (!userId) {
        throw new Error('Пользователь не найден');
      }

      console.log(`Starting subscription check for user ${userId} to channel @${username}`);

      // Call the Edge Function to check subscription
      const requestBody = {
        userId: userId.toString(),
        channelId: channelId,
        username: username
      };

      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));

      const { data, error } = await supabase.functions.invoke('check-telegram-subscription', {
        body: requestBody
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Error calling subscription check function:', error);
        throw new Error(`Ошибка при проверке подписки: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Subscription check failed:', data?.error);
        console.error('Debug info:', data?.debug);
        throw new Error(data?.error || 'Ошибка при проверке подписки');
      }

      // Log debug information if available
      if (data.debug) {
        console.log('Debug info from Edge Function:', data.debug);
      }

      return { 
        channelId, 
        isSubscribed: data.isSubscribed,
        debug: data.debug
      };
    },
    onSuccess: ({ channelId, isSubscribed, debug }) => {
      console.log('Subscription check successful:', { channelId, isSubscribed });
      
      if (debug) {
        console.log('Additional debug info:', debug);
      }
      
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
      console.error('Error in subscription check:', error);
      setCheckingChannel(null);
      
      // Show detailed error to help with debugging
      toast({
        title: "Ошибка проверки",
        description: `${error.message}. Проверьте консоль для деталей.`,
        variant: "destructive",
      });
    }
  });

  const checkSubscription = useCallback((channelId: string, username: string) => {
    console.log('Initiating subscription check for:', { channelId, username });
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
