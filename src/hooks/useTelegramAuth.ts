
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

/**
 * Тип данных юзера для внутренней работы приложения
 */
interface TelegramUserData {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean;
  photo_url?: string;
}

/**
 * Обновленный хук useTelegramAuth для работы с Telegram Login Widget
 * Удалена поддержка WebApp initDataUnsafe для повышения безопасности
 */
export const useTelegramAuth = () => {
  const [currentUser, setCurrentUser] = useState<TelegramUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { logAdminAction } = useAdminLogs();
  const { checkForTestUser, logSuspiciousAuth } = useSecurityMonitor();

  /**
   * Проверить валидность данных пользователя от Telegram Login Widget
   */
  const validateTelegramWidgetUser = useCallback((telegramData: any): true => {
    if (!telegramData || !telegramData.id || typeof telegramData.id !== 'number' || telegramData.id <= 0) {
      logSuspiciousAuth(telegramData?.id ?? 0, 'Недопустимый telegram_id от Widget');
      throw new Error('Недопустимый telegram_id от Telegram Widget');
    }

    if (!telegramData.hash || !telegramData.auth_date) {
      logSuspiciousAuth(telegramData.id, 'Отсутствуют обязательные поля верификации от Widget');
      throw new Error('Отсутствуют данные верификации от Telegram Widget');
    }

    // Проверяем время аутентификации (не старше 24 часов)
    const authAge = Date.now() / 1000 - telegramData.auth_date;
    if (authAge > 86400) {
      logSuspiciousAuth(telegramData.id, 'Устаревшие данные аутентификации от Widget');
      throw new Error('Данные аутентификации устарели');
    }

    // Блокируем тестовых пользователей
    const check = checkForTestUser(telegramData.id, telegramData.username);
    if (check.isTestUser) {
      const msg = `Тестовые пользователи запрещены (${check.reason})`;
      logSuspiciousAuth(telegramData.id, msg);
      throw new Error(msg);
    }

    return true;
  }, [checkForTestUser, logSuspiciousAuth]);

  /**
   * Аутентификация пользователя через Telegram Login Widget
   */
  const authenticateUser = useCallback(async (telegramData: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('=== НАЧАЛО WIDGET АУТЕНТИФИКАЦИИ ===');
      console.log('Данные от Widget:', telegramData);

      // Валидируем данные
      validateTelegramWidgetUser(telegramData);

      // Логируем попытку аутентификации
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'widget_user_login_attempt',
        details: {
          telegram_id: telegramData.id,
          username: telegramData.username,
          first_name: telegramData.first_name,
          auth_date: telegramData.auth_date,
          has_hash: !!telegramData.hash,
          auth_method: 'telegram_widget',
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramData.id,
        success: true,
      });

      // Вызываем edge function для безопасной верификации и создания пользователя
      const { data: authResult, error: authError } = await supabase.functions.invoke(
        'telegram-widget-auth',
        {
          body: {
            telegramData,
            timestamp: Date.now()
          }
        }
      );

      if (authError) {
        throw new Error(`Ошибка верификации Widget: ${authError.message}`);
      }

      if (!authResult || !authResult.success) {
        throw new Error(authResult?.error || 'Неизвестная ошибка верификации Widget');
      }

      const userData = authResult.user;
      const sessionToken = authResult.sessionToken;

      if (!userData || !sessionToken) {
        throw new Error('Не удалось получить данные пользователя или сессию');
      }

      // Сохраняем токен сессии
      localStorage.setItem('telegram_session_token', sessionToken);
      setCurrentUser(userData);

      // Логируем успешную аутентификацию
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'widget_user_login_completed',
        details: {
          user_id: userData.id,
          telegram_id: userData.telegram_id,
          username: userData.username,
          auth_method: 'telegram_widget',
          login_finished: new Date().toISOString(),
        },
        telegram_user_id: userData.telegram_id,
        success: true,
      });

      return true;

    } catch (err: any) {
      const errorMessage = err?.message ?? 'Ошибка аутентификации Widget';
      setError(errorMessage);
      setCurrentUser(null);

      // Логируем ошибку
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'widget_user_login_failed',
        details: {
          telegram_id: telegramData?.id || null,
          username: telegramData?.username,
          error: errorMessage,
          auth_method: 'telegram_widget',
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
  }, [validateTelegramWidgetUser, logAdminAction]);

  /**
   * Проверить сессию в базе
   */
  const validateSession = useCallback(async (sessionToken: string): Promise<TelegramUserData | null> => {
    const { data, error } = await supabase
      .from('telegram_sessions')
      .select('*,telegram_users(*)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data || !data.telegram_users) {
      localStorage.removeItem('telegram_session_token');
      return null;
    }

    return data.telegram_users as TelegramUserData;
  }, []);

  /**
   * Выход из системы
   */
  const logout = useCallback(async () => {
    try {
      const sessionToken = localStorage.getItem('telegram_session_token');
      if (sessionToken) {
        await supabase
          .from('telegram_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }

      if (currentUser) {
        logAdminAction({
          log_type: 'auth_attempt',
          operation: 'user_logout',
          details: {
            user_id: currentUser.id,
            telegram_id: currentUser.telegram_id,
            logout_time: new Date().toISOString(),
          },
          telegram_user_id: currentUser.telegram_id,
          success: true,
        });
      }

      localStorage.removeItem('telegram_session_token');
      setCurrentUser(null);
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    }
  }, [currentUser, logAdminAction]);

  /**
   * При монтировании проверяем существующую сессию
   */
  useEffect(() => {
    const checkExistingSession = async () => {
      setIsLoading(true);
      const sessionToken = localStorage.getItem('telegram_session_token');
      
      if (sessionToken) {
        const userData = await validateSession(sessionToken);
        if (userData) {
          setCurrentUser(userData);
          logAdminAction({
            log_type: 'auth_attempt',
            operation: 'session_restored',
            details: {
              user_id: userData.id,
              telegram_id: userData.telegram_id,
              restored_time: new Date().toISOString(),
            },
            telegram_user_id: userData.telegram_id,
            success: true,
          });
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, [validateSession, logAdminAction]);

  return {
    currentUser,
    isLoading,
    error,
    authenticateUser,
    logout,
  };
};
