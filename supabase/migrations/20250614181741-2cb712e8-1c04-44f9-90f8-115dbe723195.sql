
-- Добавить уникальный индекс на поле sign_id в таблицу druid_sign_texts
CREATE UNIQUE INDEX druid_sign_texts_sign_id_unique ON public.druid_sign_texts(sign_id);
