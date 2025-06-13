
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramContext } from '@/components/TelegramProvider';

interface Channel {
  id: string;
  username: string | null;
  chat_id: string | null;
  name: string;
}

interface SubResult {
  hasUnsubscribedChannels: boolean;
  missingChannels: Channel[];
}

export function useUserSubscriptions(appCode: 'druid' | 'cookie' = 'druid') {
  const { authenticatedUser, isAuthenticated } = useTelegramContext();

  return useQuery<SubResult, Error>({
    queryKey: ['user-subscriptions', authenticatedUser?.id, appCode],
    enabled: isAuthenticated && !!authenticatedUser,
    // гарантируем автоматический запуск сразу после auth:
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,  // исправлено: cacheTime вместо некорректного gcTime
    queryFn: async () => {
      if (!authenticatedUser) {
        throw new Error('Не аутентифицирован');
      }

      // 1) берём список ID каналов из app_channels
      const { data: links, error: linkErr } = await supabase
        .from('app_channels')
        .select('channel_id')
        .eq('app', appCode)
        .eq('required', true);
      if (linkErr) throw linkErr;

      const channelIds = links.map(l => l.channel_id);
      if (channelIds.length === 0) {
        // ни одного обязательного канала — доступ не ограничен
        return { hasUnsubscribedChannels: false, missingChannels: [] };
      }

      // 2) подтягиваем метаданные каналов для UI
      const { data: channels, error: chanErr } = await supabase
        .from('channels')
        .select('id, username, chat_id, name')
        .in('id', channelIds);
      if (chanErr) throw chanErr;

      // 3) вызываем Edge Function для пакетной проверки
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        'simple-check-subscription',
        {
          body: {
            userId: authenticatedUser.telegram_id.toString(),
            channelIds: channels.map(c => c.chat_id || c.username!),
          },
        }
      );
      if (fnErr) throw fnErr;

      const subs: Record<string, boolean> = fnData.subscriptions || {};
      // 4) формируем список непройденных
      const missing = channels.filter(c => {
        const key = c.chat_id || c.username!;
        return !subs[key];
      });

      return {
        hasUnsubscribedChannels: missing.length > 0,
        missingChannels: missing,
      };
    },
  });
}
