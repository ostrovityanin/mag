
-- Создаем улучшенную таблицу для детального логирования админ-панели
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type TEXT NOT NULL, -- 'user_load', 'auth_attempt', 'filter_action', 'data_query'
  operation TEXT NOT NULL, -- 'load_users', 'authenticate_user', 'filter_users', etc.
  details JSONB NOT NULL DEFAULT '{}',
  user_count INTEGER DEFAULT 0,
  filtered_count INTEGER DEFAULT 0,
  telegram_user_id BIGINT,
  session_info JSONB DEFAULT '{}',
  request_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для отслеживания подозрительных действий
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'test_user_blocked', 'invalid_telegram_id', 'suspicious_auth'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  telegram_user_id BIGINT,
  blocked_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_admin_logs_type_operation ON public.admin_logs(log_type, operation);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_telegram_user_id ON public.admin_logs(telegram_user_id);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);

-- Включаем RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Создаем политики для админ-логов
CREATE POLICY "Админы могут видеть все логи" 
  ON public.admin_logs 
  FOR SELECT 
  USING (true);

CREATE POLICY "Система может записывать логи" 
  ON public.admin_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Создаем политики для событий безопасности
CREATE POLICY "Админы могут видеть события безопасности" 
  ON public.security_events 
  FOR SELECT 
  USING (true);

CREATE POLICY "Система может записывать события безопасности" 
  ON public.security_events 
  FOR INSERT 
  WITH CHECK (true);

-- Создаем функцию для автоматической очистки старых логов (старше 90 дней)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.admin_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM public.security_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;
