
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminLogs } from '@/hooks/useAdminLogs';

/**
 * Тип данных пользователя от Telegram Login Widget
 */
interface TelegramWidgetUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Хук для аутентификации через Telegram Login Widget
 * Использует безопасную верификацию через edge function
 */
export const useTelegramWidgetAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logAdminAction } = useAdminLogs();

  /**
   * Аутентификация пользователя через Telegram Login Widget
   */
  const authenticateWithWidget = useCallback(async (telegramData: TelegramWidgetUser): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('=== НАЧАЛО АУТЕНТИФИКАЦИИ ЧЕРЕЗ WIDGET ===');
      console.log('Данные от Telegram:', telegramData);

      // Логируем попытку аутентификации
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'telegram_widget_login_attempt',
        details: {
          telegram_id: telegramData.id,
          username: telegramData.username,
          auth_date: telegramData.auth_date,
          has_hash: !!telegramData.hash,
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramData.id,
        success: true,
      });

      // Вызываем edge function для безопасной верификации
      const { data, error: authError } = await supabase.functions.invoke('telegram-widget-auth', {
        body: {
          telegramData,
          timestamp: Date.now()
        }
      });

      if (authError) {
        throw new Error(`Ошибка верификации: ${authError.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Неизвестная ошибка верификации');
      }

      console.log('=== АУТЕНТИФИКАЦИЯ УСПЕШНА ===');
      console.log('Результат:', data);

      // Логируем успешную аутентификацию
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'telegram_widget_login_success',
        details: {
          user_id: data.user?.id,
          telegram_id: telegramData.id,
          username: telegramData.username,
          verified_by_widget: true,
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramData.id,
        success: true,
      });

      return true;

    } catch (err: any) {
      const errorMessage = err?.message || 'Ошибка аутентификации';
      setError(errorMessage);

      console.error('=== ОШИБКА АУТЕНТИФИКАЦИИ ===');
      console.error('Ошибка:', err);

      // Логируем ошибку аутентификации
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'telegram_widget_login_failed',
        details: {
          telegram_id: telegramData?.id || null,
          username: telegramData?.username,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramData?.id || 0,
        success: false,
        error_message: errorMessage,
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [logAdminAction]);

  return {
    authenticateWithWidget,
    isLoading,
    error,
  };
};
