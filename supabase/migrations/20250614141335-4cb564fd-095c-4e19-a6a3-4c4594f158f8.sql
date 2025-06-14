
-- Таблица для логов проверки подписок каждого юзера по каналам
CREATE TABLE public.subscription_checks_log (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  username TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  channel_check_results JSONB NOT NULL, -- В формате {'@channel1': true, '@channel2': false}
  app_code TEXT NOT NULL DEFAULT 'druid'
);

-- Индексы для быстрого поиска по юзеру и дате
CREATE INDEX idx_subscription_checks_log_user ON public.subscription_checks_log(telegram_user_id);
CREATE INDEX idx_subscription_checks_log_checked_at ON public.subscription_checks_log(checked_at DESC);

-- Включить RLS и разрешить только системе сохранять (можно уточнить для вашей безопасности)
ALTER TABLE public.subscription_checks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system can insert subscription checks" ON public.subscription_checks_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admins can view subscription checks" ON public.subscription_checks_log
  FOR SELECT USING (true);
