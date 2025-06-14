
-- Создаем таблицу для хранения описаний знаков друидского гороскопа
CREATE TABLE public.druid_sign_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sign_id text NOT NULL,
  text text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Возможность обновлять текст для любого знака (доступно для администраторов или без ограничений, если нет авторизации)
-- Если позже потребуется ограничить доступ, можно добавить RLS-политику
