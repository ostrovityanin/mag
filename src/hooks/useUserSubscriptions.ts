
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';
import { useToast } from '@/hooks/use-toast';

export const useUserSubscriptions = () => {
  const { user, webApp } = useTelegramContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [checkingChannel, setCheckingChannel] = useState<string | null>(null);

  const checkSubscriptionMutation = useMutation({
    mutationFn: async ({ channelId, username }: { channelId: string; username: string }) => {
      // Более детальная проверка наличия пользователя
      if (!user?.id) {
        console.error('=== ОШИБКА: ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН ===');
        console.error('user объект:', user);
        console.error('webApp объект доступен:', !!webApp);
        
        if (webApp) {
          console.error('WebApp initData:', webApp.initData);
          console.error('WebApp initDataUnsafe:', webApp.initDataUnsafe);
        }
        
        throw new Error('Пользователь Telegram не найден. Убедитесь, что приложение запущено через бота.');
      }
      
      console.log('=== НАЧАЛО ПРОВЕРКИ ПОДПИСКИ ===');
      console.log('Реальный пользователь Telegram:', {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name
      });
      console.log('ID канала для проверки:', channelId);
      console.log('Username канала:', username);

      const requestBody = {
        userId: user.id.toString(),
        channelId: channelId,
        username: username
      };

      console.log('Отправляем запрос к Edge Function:', JSON.stringify(requestBody, null, 2));

      // Вызов Edge Function для проверки подписки
      const { data, error } = await supabase.functions.invoke('check-telegram-subscription', {
        body: requestBody
      });

      console.log('Ответ от Edge Function:', { data, error });

      if (error) {
        console.error('Ошибка вызова Edge Function:', error);
        throw new Error(`Ошибка при проверке подписки: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Проверка подписки не удалась:', data?.error);
        if (data?.debug) {
          console.error('Отладочная информация:', data.debug);
        }
        throw new Error(data?.error || 'Ошибка при проверке подписки');
      }

      console.log('Проверка подписки успешна:', {
        channelId,
        isSubscribed: data.isSubscribed,
        userId: user.id
      });

      return { 
        channelId, 
        isSubscribed: data.isSubscribed,
        debug: data.debug
      };
    },
    onSuccess: ({ channelId, isSubscribed, debug }) => {
      console.log('=== РЕЗУЛЬТАТ ПРОВЕРКИ ПОДПИСКИ ===');
      console.log('Канал:', channelId);
      console.log('Подписан:', isSubscribed);
      
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
      console.error('=== ОШИБКА ПРОВЕРКИ ПОДПИСКИ ===');
      console.error('Детали ошибки:', error);
      setCheckingChannel(null);
      
      toast({
        title: "Ошибка проверки подписки",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const checkSubscription = useCallback((channelId: string, username: string) => {
    // Проверяем наличие пользователя с детальным логированием
    console.log('=== ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ ПЕРЕД ЗАПРОСОМ ===');
    console.log('user объект:', user);
    console.log('user.id:', user?.id);
    console.log('Тип user.id:', typeof user?.id);
    console.log('webApp доступен:', !!webApp);
    
    if (!user?.id) {
      console.error('=== ОТКЛОНЕНИЕ ЗАПРОСА: НЕТ ПОЛЬЗОВАТЕЛЯ ===');
      toast({
        title: "Ошибка авторизации",
        description: "Данные пользователя Telegram не найдены. Перезапустите приложение из бота.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('=== ИНИЦИАЦИЯ ПРОВЕРКИ ПОДПИСКИ ===');
    console.log('Пользователь:', { id: user.id, username: user.username });
    console.log('Канал:', { id: channelId, username });
    
    setCheckingChannel(channelId);
    checkSubscriptionMutation.mutate({ channelId, username });
  }, [checkSubscriptionMutation, user, webApp, toast]);

  return {
    subscriptions,
    checkingChannel,
    checkSubscription,
    isChecking: checkSubscriptionMutation.isPending,
    hasUser: !!user?.id
  };
};
