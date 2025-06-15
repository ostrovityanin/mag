
-- Обновляем все записи с druid_horoscope на druid для единообразия
UPDATE public.app_channels 
SET app = 'druid' 
WHERE app = 'druid_horoscope';

-- Проверяем результат
SELECT 
  ac.app, 
  c.username, 
  c.name, 
  ac.required 
FROM public.app_channels ac 
JOIN public.channels c ON ac.channel_id = c.id 
WHERE ac.app = 'druid';
