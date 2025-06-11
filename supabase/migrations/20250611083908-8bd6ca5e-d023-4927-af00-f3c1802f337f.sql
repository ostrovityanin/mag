
-- Создаем таблицу для аутентифицированных пользователей Telegram
CREATE TABLE public.telegram_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'ru',
  is_premium BOOLEAN DEFAULT false,
  is_bot BOOLEAN DEFAULT false,
  photo_url TEXT,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для сессий пользователей
CREATE TABLE public.telegram_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_telegram_users_telegram_id ON public.telegram_users(telegram_id);
CREATE INDEX idx_telegram_users_username ON public.telegram_users(username);
CREATE INDEX idx_telegram_users_last_login ON public.telegram_users(last_login DESC);
CREATE INDEX idx_telegram_sessions_token ON public.telegram_sessions(session_token);
CREATE INDEX idx_telegram_sessions_expires ON public.telegram_sessions(expires_at);

-- Включаем RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Создаем политики для telegram_users
CREATE POLICY "Пользователи могут видеть свои данные" 
  ON public.telegram_users 
  FOR SELECT 
  USING (true);

CREATE POLICY "Система может управлять пользователями" 
  ON public.telegram_users 
  FOR ALL 
  USING (true);

-- Создаем политики для telegram_sessions
CREATE POLICY "Система может управлять сессиями" 
  ON public.telegram_sessions 
  FOR ALL 
  USING (true);

-- Создаем функцию для обновления updated_at
CREATE TRIGGER update_telegram_users_updated_at 
  BEFORE UPDATE ON public.telegram_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
