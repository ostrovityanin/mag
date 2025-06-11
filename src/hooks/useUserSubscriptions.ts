
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
      // Проверяем, что пользователь авторизован через Telegram
      if (!user?.id) {
        throw new Error('Пользователь не авторизован через Telegram WebApp');
      }
      
      console.log('=== ПРОВЕРКА ПОДПИСКИ РЕАЛЬНОГО ПОЛЬЗОВАТЕЛЯ ===');
      console.log('Telegram пользователь:', user);
      console.log('User ID:', user.id);
      console.log('Тип user ID:', typeof user.id);
      console.log('ID канала:', channelId);
      console.log('Username канала:', username);

      const requestBody = {
        userId: user.id.toString(),
        channelId: channelId,
        username: username
      };

      console.log('Тело запроса:', JSON.stringify(requestBody, null, 2));

      // Call the Edge Function to check subscription
      const { data, error } = await supabase.functions.invoke('check-telegram-subscription', {
        body: requestBody
      });

      console.log('Ответ Edge Function:', { data, error });

      if (error) {
        console.error('Ошибка вызова Edge Function:', error);
        throw new Error(`Ошибка при проверке подписки: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Проверка подписки не удалась:', data?.error);
        console.error('Отладочная информация:', data?.debug);
        throw new Error(data?.error || 'Ошибка при проверке подписки');
      }

      // Log debug information if available
      if (data.debug) {
        console.log('Отладочная информация от Edge Function:', data.debug);
      }

      return { 
        channelId, 
        isSubscribed: data.isSubscribed,
        debug: data.debug
      };
    },
    onSuccess: ({ channelId, isSubscribed, debug }) => {
      console.log('Проверка подписки успешна:', { channelId, isSubscribed });
      
      if (debug) {
        console.log('Дополнительная отладочная информация:', debug);
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
      console.error('Ошибка в проверке подписки:', error);
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
    if (!user?.id) {
      toast({
        title: "Ошибка авторизации",
        description: "Пользователь не авторизован через Telegram WebApp",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Инициирую проверку подписки для:', { channelId, username, userId: user.id });
    setCheckingChannel(channelId);
    checkSubscriptionMutation.mutate({ channelId, username });
  }, [checkSubscriptionMutation, user?.id, toast]);

  return {
    subscriptions,
    checkingChannel,
    checkSubscription,
    isChecking: checkSubscriptionMutation.isPending
  };
};
