
-- Создаем таблицу для каналов
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  chat_id TEXT,
  invite_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу связи приложений с каналами
CREATE TABLE IF NOT EXISTS public.app_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app TEXT NOT NULL,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(app, channel_id)
);

-- Включаем RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_channels ENABLE ROW LEVEL SECURITY;

-- Создаем политики (открытое чтение для всех)
CREATE POLICY "Все могут читать каналы" 
  ON public.channels 
  FOR SELECT 
  USING (true);

CREATE POLICY "Все могут читать связи приложений с каналами" 
  ON public.app_channels 
  FOR SELECT 
  USING (true);

-- Добавляем тестовый канал для друидов
INSERT INTO public.channels (username, name, chat_id) 
VALUES ('@luizahey', 'Luiza Hey Channel', '@luizahey')
ON CONFLICT (username) DO NOTHING;

-- Связываем канал с приложением druid
INSERT INTO public.app_channels (app, channel_id, required)
SELECT 'druid', id, true
FROM public.channels 
WHERE username = '@luizahey'
ON CONFLICT (app, channel_id) DO NOTHING;
