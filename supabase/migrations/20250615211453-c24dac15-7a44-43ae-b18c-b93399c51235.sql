
-- Добавляем RLS политики для таблицы channels (исправленные)
CREATE POLICY "Все могут создавать каналы" 
  ON public.channels 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Все могут обновлять каналы" 
  ON public.channels 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- То же самое для app_channels (исправленные)
CREATE POLICY "Все могут создавать связи приложений с каналами" 
  ON public.app_channels 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Все могут обновлять связи приложений с каналами" 
  ON public.app_channels 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Все могут удалять связи приложений с каналами" 
  ON public.app_channels 
  FOR DELETE 
  USING (true);
