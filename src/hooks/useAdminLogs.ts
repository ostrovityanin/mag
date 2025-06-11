
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminLogData {
  log_type: string;
  operation: string;
  details?: Record<string, any>;
  user_count?: number;
  filtered_count?: number;
  telegram_user_id?: number;
  session_info?: Record<string, any>;
  request_url?: string;
  user_agent?: string;
  ip_address?: string;
  success?: boolean;
  error_message?: string;
  execution_time_ms?: number;
}

interface SecurityEventData {
  event_type: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context?: Record<string, any>;
  telegram_user_id?: number;
  blocked_action?: string;
}

export const useAdminLogs = () => {
  const queryClient = useQueryClient();

  // Получение логов
  const logsQuery = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  // Получение событий безопасности
  const securityEventsQuery = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Создание админ-лога
  const logAdminAction = useMutation({
    mutationFn: async (logData: AdminLogData) => {
      console.log('=== СОЗДАНИЕ АДМИН-ЛОГА ===');
      console.log('Данные лога:', logData);

      const { data, error } = await supabase
        .from('admin_logs')
        .insert({
          ...logData,
          request_url: window.location.href,
          user_agent: navigator.userAgent,
        })
        .select()
        .single();

      if (error) {
        console.error('Ошибка создания лога:', error);
        throw error;
      }

      console.log('Лог создан:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    },
  });

  // Создание события безопасности
  const logSecurityEvent = useMutation({
    mutationFn: async (eventData: SecurityEventData) => {
      console.log('=== СОЗДАНИЕ СОБЫТИЯ БЕЗОПАСНОСТИ ===');
      console.log('Данные события:', eventData);

      const { data, error } = await supabase
        .from('security_events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error('Ошибка создания события безопасности:', error);
        throw error;
      }

      console.log('Событие безопасности создано:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
    },
  });

  return {
    // Данные
    adminLogs: logsQuery.data || [],
    securityEvents: securityEventsQuery.data || [],
    isLoading: logsQuery.isLoading || securityEventsQuery.isLoading,
    
    // Мутации
    logAdminAction: logAdminAction.mutate,
    logSecurityEvent: logSecurityEvent.mutate,
    
    // Статусы
    isLoggingAction: logAdminAction.isPending,
    isLoggingEvent: logSecurityEvent.isPending,
  };
};
