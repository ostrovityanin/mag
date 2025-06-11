
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TelegramUser } from '@/types/telegram';

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

  const createOrUpdateUser = async (telegramUser: TelegramUser): Promise<TelegramUserData | null> => {
    try {
      console.log('=== СОЗДАНИЕ/ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ===');
      console.log('Данные Telegram пользователя:', telegramUser);

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
        return updatedUser;
      } else {
        // Создаем нового пользователя
        console.log('Создаем нового пользователя');
        
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
        return newUser;
      }
    } catch (err) {
      console.error('Ошибка в createOrUpdateUser:', err);
      setError(err instanceof Error ? err.message : 'Ошибка аутентификации');
      return null;
    }
  };

  const createSession = async (userId: string): Promise<string | null> => {
    try {
      console.log('=== СОЗДАНИЕ СЕССИИ ===');
      console.log('ID пользователя:', userId);

      // Удаляем старые сессии пользователя
      await supabase
        .from('telegram_sessions')
        .delete()
        .eq('user_id', userId);

      // Создаем новую сессию
      const sessionToken = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Сессия действительна 30 дней

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
      
      // Сохраняем токен сессии в localStorage
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
      
      // Создаем или обновляем пользователя
      const userData = await createOrUpdateUser(telegramUser);
      if (!userData) {
        setError('Не удалось создать пользователя');
        return false;
      }

      // Создаем сессию
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
        // Удаляем сессию из базы данных
        await supabase
          .from('telegram_sessions')
          .delete()
          .eq('session_token', sessionToken);
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
        const userData = await validateSession(sessionToken);
        if (userData) {
          setCurrentUser(userData);
        }
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
