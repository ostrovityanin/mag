
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TelegramUser } from '@/types/telegram';
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
 * Хук useTelegramAuth: строго определяет юзера Telegram,
 * логирует все действия, исключает любые тестовые сценарии.
 */
export const useTelegramAuth = () => {
  const [currentUser, setCurrentUser] = useState<TelegramUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { logAdminAction } = useAdminLogs();
  const { checkForTestUser, logSuspiciousAuth } = useSecurityMonitor();

  /**
   * Проверить, валиден ли TelegramUser.
   * Логировать и блокировать любые подозрительные действия.
   */
  const validateTelegramUser = useCallback((tg: TelegramUser): true => {
    if (!tg || !tg.id || typeof tg.id !== 'number' || tg.id <= 0) {
      logSuspiciousAuth(tg?.id ?? 0, 'Недопустимый telegram_id');
      throw new Error('Недопустимый telegram_id');
    }
    // Жесткий запрет на тестовых юзеров всегда (!)
    const check = checkForTestUser(tg.id, tg.username);
    if (check.isTestUser) {
      const msg = `Тестовые пользователи запрещены (${check.reason})`;
      logSuspiciousAuth(tg.id, msg);
      throw new Error(msg);
    }
    return true;
  }, [checkForTestUser, logSuspiciousAuth]);

  /**
   * Создать или обновить пользователя Telegram в базе
   */
  const createOrUpdateUser = useCallback(async (telegramUser: TelegramUser): Promise<TelegramUserData> => {
    const startTime = Date.now();
    validateTelegramUser(telegramUser);

    logAdminAction({
      log_type: 'auth_attempt',
      operation: 'user_login_attempt',
      details: {
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        has_premium: telegramUser.is_premium,
        language: telegramUser.language_code,
        timestamp: new Date().toISOString(),
      },
      telegram_user_id: telegramUser.id,
      success: true,
    });

    // Проверяем — есть ли такой пользователь
    const { data: existing, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single();

    // Собираем всегда однообразный профиль из данных Telegram
    const userData = {
      telegram_id: telegramUser.id,
      username: telegramUser.username || null,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
      language_code: telegramUser.language_code || 'ru',
      is_premium: telegramUser.is_premium || false,
      is_bot: telegramUser.is_bot || false,
      photo_url: telegramUser.photo_url || null,
      last_login: new Date().toISOString(),
    };

    if (error && error.code !== 'PGRST116') {
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'user_login_failed',
        details: {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramUser.id,
        execution_time_ms: Date.now() - startTime,
        success: false,
        error_message: error.message,
      });
      throw error;
    }

    if (existing) {
      // Обновляем существующего пользователя
      const { data: updated, error: updateError } = await supabase
        .from('telegram_users')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      logAdminAction({
        log_type: 'user_load',
        operation: 'existing_user_login',
        details: {
          user_id: updated.id,
          telegram_id: telegramUser.id,
          last_login_before: existing.last_login,
          login_time: userData.last_login,
          username: telegramUser.username,
          is_premium: telegramUser.is_premium,
        },
        telegram_user_id: telegramUser.id,
        execution_time_ms: Date.now() - startTime,
        success: true,
      });

      return updated;
    } else {
      // Создаём нового пользователя
      const { data: newUser, error: insertError } = await supabase
        .from('telegram_users')
        .insert(userData)
        .select()
        .single();
      if (insertError) throw insertError;

      logAdminAction({
        log_type: 'user_load',
        operation: 'new_user_registration',
        details: {
          user_id: newUser.id,
          telegram_id: telegramUser.id,
          registration_time: userData.last_login,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          is_premium: telegramUser.is_premium,
          language_code: telegramUser.language_code,
        },
        telegram_user_id: telegramUser.id,
        execution_time_ms: Date.now() - startTime,
        success: true,
      });

      return newUser;
    }
  }, [logAdminAction, validateTelegramUser]);

  /**
   * Создать сессию Telegram
   */
  const createSession = useCallback(async (userId: string): Promise<string> => {
    await supabase
      .from('telegram_sessions')
      .delete()
      .eq('user_id', userId);

    const sessionToken = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supabase
      .from('telegram_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (error) throw error;
    localStorage.setItem('telegram_session_token', sessionToken);
    return sessionToken;
  }, []);

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
   * Аутентификация пользователя Telegram (главная функция для фронта)
   */
  const authenticateUser = useCallback(async (telegramUser: TelegramUser): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Проверяем пользователя (отказ, если тест или мусор)
      validateTelegramUser(telegramUser);

      // Создаем/обновляем пользователя
      const userData = await createOrUpdateUser(telegramUser);
      if (!userData) throw new Error('Не удалось создать пользователя');

      // Создаём сессию для user_id
      const sessionToken = await createSession(userData.id);
      if (!sessionToken) throw new Error('Не удалось создать сессию');

      setCurrentUser(userData);

      // Доп. лог для полной отладки
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'user_login_completed',
        details: {
          user_id: userData.id,
          telegram_id: userData.telegram_id,
          login_finished: new Date().toISOString(),
        },
        telegram_user_id: userData.telegram_id,
        success: true,
      });

      return true;
    } catch (err: any) {
      setError(err?.message ?? 'Ошибка аутентификации');
      setCurrentUser(null);
      // Отдельный лог ошибки
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'user_login_failed',
        details: {
          telegram_id: telegramUser?.id || null,
          username: telegramUser?.username,
          error: err?.message || String(err),
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramUser?.id || 0,
        success: false,
        error_message: err?.message || String(err),
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validateTelegramUser, createOrUpdateUser, createSession, logAdminAction]);

  /**
   * Выход из системы и очистка сессии
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
   * При монтировании: если есть сессия — проверяем её, иначе сбрасываем всё.
   * При невалидной сессии никакой пользователь не установлен.
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
