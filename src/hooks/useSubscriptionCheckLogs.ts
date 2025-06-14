
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Тип логов проверки подписок
export interface SubscriptionCheckLog {
  id: string;
  telegram_user_id: number;
  username: string | null;
  checked_at: string;
  channel_check_results: Record<string, boolean>;
  app_code: string;
}

export function useSubscriptionCheckLogs(appCode?: string, limit: number = 50) {
  return useQuery({
    queryKey: ['subscription-checks-log', appCode, limit],
    queryFn: async (): Promise<SubscriptionCheckLog[]> => {
      let query = supabase
        .from('subscription_checks_log')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(limit);

      if (appCode) {
        query = query.eq('app_code', appCode);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}
