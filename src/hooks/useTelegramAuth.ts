import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TelegramUser } from '@/types/telegram';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

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

export const useTelegramAuth = () => {
  const [currentUser, setCurrentUser] = useState<TelegramUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { logAdminAction } = useAdminLogs();
  const { checkForTestUser, logSuspiciousAuth } = useSecurityMonitor();

  const createOrUpdateUser = async (telegramUser: TelegramUser): Promise<TelegramUserData | null> => {
    const startTime = Date.now();
    
    try {
      console.log('=== СОЗДАНИЕ/ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ===');
      console.log('Данные Telegram пользователя:', telegramUser);
      
      // Проверяем, что это реальный пользователь Telegram
      if (!telegramUser.id || telegramUser.id <= 0) {
        const errorMsg = 'Недопустимый ID пользователя Telegram';
        console.error('Недопустимый telegram_id:', telegramUser.id);
        
        logSuspiciousAuth(telegramUser.id, errorMsg);
        throw new Error(errorMsg);
      }
      
      // Проверяем на тестовых пользователей
      const securityCheck = checkForTestUser(telegramUser.id, telegramUser.username);
      if (securityCheck.isTestUser) {
        const errorMsg = `Тестовые пользователи запрещены (${securityCheck.reason})`;
        console.error('Попытка использования тестового пользователя:', telegramUser.id);
        throw new Error(errorMsg);
      }

      // Логируем попытку аутентификации
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

      // Проверяем, существует ли пользователь
      const { data: existingUser, error: fetchError } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Ошибка поиска пользователя:', fetchError);
        throw fetchError;
      }

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

      console.log('Подготовленные данные пользователя:', userData);

      if (existingUser) {
        // Обновляем существующего пользователя
        console.log('Обновляем существующего пользователя:', existingUser.id);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('telegram_users')
          .update({
            ...userData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Ошибка обновления пользователя:', updateError);
          throw updateError;
        }

        console.log('Пользователь обновлен:', updatedUser);
        
        // Логируем успешный вход существующего пользователя
        logAdminAction({
          log_type: 'user_load',
          operation: 'existing_user_login',
          details: { 
            user_id: updatedUser.id, 
            telegram_id: telegramUser.id,
            last_login_before: existingUser.last_login,
            login_time: userData.last_login,
            username: telegramUser.username,
            is_premium: telegramUser.is_premium,
          },
          telegram_user_id: telegramUser.id,
          execution_time_ms: Date.now() - startTime,
          success: true,
        });
        
        return updatedUser;
      } else {
        // Создаем нового пользователя
        console.log('Создаем нового пользователя с telegram_id:', telegramUser.id);
        
        const { data: newUser, error: createError } = await supabase
          .from('telegram_users')
          .insert(userData)
          .select()
          .single();

        if (createError) {
          console.error('Ошибка создания пользователя:', createError);
          throw createError;
        }

        console.log('Новый пользователь создан:', newUser);
        
        // Логируем создание нового пользователя
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
    } catch (err) {
      console.error('Ошибка в createOrUpdateUser:', err);
      
      // Логируем ошибку аутентификации
      logAdminAction({
        log_type: 'auth_attempt',
        operation: 'user_login_failed',
        details: { 
          telegram_id: telegramUser.id, 
          username: telegramUser.username,
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        telegram_user_id: telegramUser.id,
        execution_time_ms: Date.now() - startTime,
        success: false,
        error_message: err instanceof Error ? err.message : 'Ошибка аутентификации',
      });
      
      setError(err instanceof Error ? err.message : 'Ошибка аутентификации');
      return null;
    }
  };

  const createSession = async (userId: string): Promise<string | null> => {
    try {
      console.log('=== СОЗДАНИЕ СЕССИИ ===');
      console.log('ID пользователя:', userId);

      await supabase
        .from('telegram_sessions')
        .delete()
        .eq('user_id', userId);

      const sessionToken = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: session, error: sessionError } = await supabase
        .from('telegram_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Ошибка создания сессии:', sessionError);
        throw sessionError;
      }

      console.log('Сессия создана:', session);
      localStorage.setItem('telegram_session_token', sessionToken);
      
      return sessionToken;
    } catch (err) {
      console.error('Ошибка в createSession:', err);
      setError(err instanceof Error ? err.message : 'Ошибка создания сессии');
      return null;
    }
  };

  const validateSession = async (sessionToken: string): Promise<TelegramUserData | null> => {
    try {
      console.log('=== ВАЛИДАЦИЯ СЕССИИ ===');
      console.log('Токен сессии:', sessionToken);

      const { data: session, error: sessionError } = await supabase
        .from('telegram_sessions')
        .select(`
          *,
          telegram_users (*)
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError) {
        console.log('Сессия не найдена или истекла:', sessionError);
        localStorage.removeItem('telegram_session_token');
        return null;
      }

      console.log('Сессия валидна:', session);
      return session.telegram_users as TelegramUserData;
    } catch (err) {
      console.error('Ошибка валидации сессии:', err);
      localStorage.removeItem('telegram_session_token');
      return null;
    }
  };

  const authenticateUser = async (telegramUser: TelegramUser): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('=== НАЧАЛО АУТЕНТИФИКАЦИИ ===');
      console.log('Входящие данные пользователя Telegram:', telegramUser);
      
      const userData = await createOrUpdateUser(telegramUser);
      if (!userData) {
        setError('Не удалось создать пользователя');
        return false;
      }

      const sessionToken = await createSession(userData.id);
      if (!sessionToken) {
        setError('Не удалось создать сессию');
        return false;
      }

      setCurrentUser(userData);
      console.log('=== АУТЕНТИФИКАЦИЯ ЗАВЕРШЕНА ===');
      console.log('Текущий пользователь установлен:', userData);
      
      return true;
    } catch (err) {
      console.error('Ошибка аутентификации:', err);
      setError(err instanceof Error ? err.message : 'Ошибка аутентификации');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('telegram_session_token');
      if (sessionToken) {
        await supabase
          .from('telegram_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }
      
      // Логируем выход пользователя
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
  };

  // Проверяем существующую сессию при загрузке
  useEffect(() => {
    const checkExistingSession = async () => {
      const sessionToken = localStorage.getItem('telegram_session_token');
      if (sessionToken) {
        console.log('Найден токен сессии, проверяем валидность:', sessionToken);
        const userData = await validateSession(sessionToken);
        if (userData) {
          console.log('Сессия валидна, пользователь восстановлен:', userData);
          setCurrentUser(userData);
          
          // Логируем восстановление сессии
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
        } else {
          console.log('Сессия недействительна, требуется повторная аутентификация');
        }
      } else {
        console.log('Токен сессии не найден');
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  return {
    currentUser,
    isLoading,
    error,
    authenticateUser,
    logout,
  };
};
