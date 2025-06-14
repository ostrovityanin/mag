
-- Убедимся, что в таблицах admin_logs и security_events уже есть нужные поля (всё есть, но можно добавить тип операции для подписки)
-- Добавим дополнительную политику для записи логов проверки подписки, если потребуется:

-- НОВЫЙ ТИП operation для логов проверок подписки — "subscription_check" (можно просто использовать как значение в operation)

-- Политики таблицы admin_logs уже позволяют системе записывать любые логи:
--   CREATE POLICY "Система может записывать логи" 
--     ON public.admin_logs 
--     FOR INSERT 
--     WITH CHECK (true);

-- Политики таблицы security_events уже позволяют системе записывать любые события:
--   CREATE POLICY "Система может записывать события безопасности" 
--     ON public.security_events 
--     FOR INSERT 
--     WITH CHECK (true);

-- Если нужно — можно расширить существующую таблицу admin_logs (например, добавить новые operation), но это не обязательно, значения operation задаются программно.

-- Можно добавить индекс для ускорения поиска логов с operation = 'subscription_check', но это оптимизационный шаг:
CREATE INDEX IF NOT EXISTS idx_admin_logs_operation ON public.admin_logs(operation);

