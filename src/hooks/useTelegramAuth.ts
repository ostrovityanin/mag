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
 * Обновленный хук useTelegramAuth для работы с Telegram WebApp
 */
export const useTelegramAuth = () => {
  const [currentUser, setCurrentUser] = useState<TelegramUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { logAdminAction } = useAdminLogs();
  const { checkForTestUser, logSuspiciousAuth } = useSecurityMonitor();

  /**
   * Проверить валидность данных пользователя от Telegram WebApp
   */
  const validateTelegramWebAppUser = useCallback((user: any): true => {
    if (!user || !user.id || typeof user.id !== 'number' || user.id <= 0) {
      logSuspiciousAuth(user?.id ?? 0, 'Недопустимый telegram_id от WebApp');
      throw new Error('Недопустимый telegram_id от Telegram WebApp');
    }

    // Блокируем тестовых пользователей
    const check = checkForTestUser(user.id, user.username);
    if (check.isTestUser) {
      const msg = `Тестовые пользователи запрещены (${check.reason})`;
      logSuspiciousAuth(user.id, msg);
      throw new Error(msg);
    }

    return true;
  }, [checkForTestUser, logSuspiciousAuth]);

  /**
   * Аутентификация пользователя через Telegram WebApp initData
   */
  const authenticateUser = useCallback(async (initData: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    let telegramUser: any = null;

    try {
      console.log('=== НАЧАЛО WEBAPP АУТЕНТИФИКАЦИИ ===');
      if (!initData) {
        throw new Error('Отсутствуют данные для аутентификации (initData)');
      }

      const params = new URLSearchParams(initData);
      const userJson = params.get('user');
      if (!userJson) {
        throw new Error('Данные пользователя отсутствуют в initData');
      }
      telegramUser = JSON.parse(userJson);

      validateTelegramWebAppUser(telegramUser);
      
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'webapp_user_login_attempt',
        details: {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          auth_method: 'telegram_webapp',
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramUser.id,
        success: true,
      });

      const { data: authResult, error: authError } = await supabase.functions.invoke(
        'telegram-auth',
        { body: { initData } }
      );

      if (authError) {
        throw new Error(`Ошибка верификации WebApp: ${authError.message}`);
      }

      if (!authResult || !authResult.success) {
        throw new Error(authResult?.error || 'Неизвестная ошибка верификации WebApp');
      }

      const userData = authResult.user;
      const sessionToken = authResult.sessionToken;

      if (!userData || !sessionToken) {
        throw new Error('Не удалось получить данные пользователя или сессию');
      }

      localStorage.setItem('telegram_session_token', sessionToken);
      setCurrentUser(userData);

      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'webapp_user_login_completed',
        details: {
          user_id: userData.id,
          telegram_id: userData.telegram_id,
          username: userData.username,
          auth_method: 'telegram_webapp',
          login_finished: new Date().toISOString(),
        },
        telegram_user_id: userData.telegram_id,
        success: true,
      });

      return true;

    } catch (err: any) {
      const errorMessage = err?.message ?? 'Ошибка аутентификации WebApp';
      setError(errorMessage);
      setCurrentUser(null);

      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'webapp_user_login_failed',
        details: {
          telegram_id: telegramUser?.id || null,
          username: telegramUser?.username,
          error: errorMessage,
          auth_method: 'telegram_webapp',
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramUser?.id || 0,
        success: false,
        error_message: errorMessage,
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validateTelegramWebAppUser, logAdminAction]);

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
