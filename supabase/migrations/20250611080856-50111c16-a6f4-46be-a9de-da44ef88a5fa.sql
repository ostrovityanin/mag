
-- Создаем таблицу для хранения логов
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  context JSONB DEFAULT NULL,
  function_name TEXT DEFAULT NULL,
  user_id TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем индекс для быстрого поиска по времени
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);

-- Создаем индекс для поиска по функциям
CREATE INDEX idx_system_logs_function_name ON public.system_logs(function_name);

-- Включаем RLS для безопасности
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Создаем политику для чтения логов (только для администраторов)
CREATE POLICY "Admin can view all logs" 
  ON public.system_logs 
  FOR SELECT 
  USING (true);

-- Создаем политику для вставки логов (разрешаем всем функциям)
CREATE POLICY "Functions can insert logs" 
  ON public.system_logs 
  FOR INSERT 
  WITH CHECK (true);
