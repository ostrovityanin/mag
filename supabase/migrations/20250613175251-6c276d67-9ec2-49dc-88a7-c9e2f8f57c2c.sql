
-- Проверяем и создаем записи для приложения druid
-- Сначала убедимся, что канал существует
INSERT INTO public.channels (username, name, chat_id) 
VALUES ('@luizahey', 'Luiza Hey Channel', '@luizahey')
ON CONFLICT (username) DO NOTHING;

-- Связываем канал с приложением druid (именно в нижнем регистре)
INSERT INTO public.app_channels (app, channel_id, required)
SELECT 'druid', id, true
FROM public.channels 
WHERE username = '@luizahey'
ON CONFLICT (app, channel_id) DO NOTHING;

-- Проверим, что записи создались
SELECT 
  ac.app, 
  c.username, 
  c.name, 
  ac.required 
FROM public.app_channels ac 
JOIN public.channels c ON ac.channel_id = c.id 
WHERE ac.app = 'druid';
