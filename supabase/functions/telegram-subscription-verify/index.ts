
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Типы для работы с Telegram
interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface InitDataUnsafe {
  user?: TelegramUser;
  auth_date?: number;
  hash?: string;
}

interface SubscriptionCheck {
  chat_id: string;
  status: string;
  channel_name?: string;
}

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN не установлен');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не установлены');
}

// Проверка подписи initData (упрощенная версия)
function validateInitData(initData: string): InitDataUnsafe | null {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const hash = params.get('hash');
    
    if (!userParam || !hash) {
      return null;
    }

    // В продакшене здесь должна быть полная проверка подписи с использованием секрета бота
    // Для MVP возвращаем распарсенного пользователя
    return {
      user: JSON.parse(userParam),
      hash
    };
  } catch (error) {
    console.error('Ошибка парсинга initData:', error);
    return null;
  }
}

// Проверка подписки пользователя на канал через Bot API
async function checkChannelSubscription(userId: number, chatId: string): Promise<string> {
  if (!BOT_TOKEN) {
    throw new Error('Bot token не настроен');
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Ошибка API Telegram для ${chatId}:`, response.status, response.statusText);
      return 'error';
    }

    const data = await response.json();
    
    if (!data.ok) {
      console.error(`Telegram API вернул ошибку для ${chatId}:`, data.description);
      return 'error';
    }

    return data.result.status || 'left';
  } catch (error) {
    console.error(`Ошибка при проверке подписки на ${chatId}:`, error);
    return 'error';
  }
}

serve(async (req) => {
  // Обработка CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { initData, app = 'druid' } = await req.json()

    if (!initData) {
      return new Response(
        JSON.stringify({ error: 'initData обязателен' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Валидация initData
    const parsedData = validateInitData(initData);
    if (!parsedData?.user) {
      return new Response(
        JSON.stringify({ error: 'Недействительные данные initData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = parsedData.user;
    console.log(`Проверяем подписки для пользователя ${user.id} (${user.username || user.first_name})`);

    // Получаем каналы из базы данных
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: appChannels, error: appChannelsError } = await supabase
      .from('app_channels')
      .select(`
        app,
        required,
        channels (
          id,
          username,
          chat_id,
          name,
          invite_link,
          created_at
        )
      `)
      .eq('app', app)
      .eq('required', true);

    if (appChannelsError) {
      console.error('Ошибка получения каналов из БД:', appChannelsError);
      return new Response(
        JSON.stringify({ error: 'Ошибка получения списка каналов' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!appChannels || appChannels.length === 0) {
      console.log(`Нет обязательных каналов для приложения ${app}`);
      return new Response(
        JSON.stringify({
          ok: true,
          checks: [],
          user: {
            id: user.id,
            first_name: user.first_name,
            username: user.username
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Преобразуем данные в нужный формат
    const channels = appChannels
      .map(ac => {
        if (!ac.channels) return null;
        return {
          id: ac.channels.chat_id || ac.channels.username || ac.channels.id,
          // Исправляем логику формирования имени канала
          name: ac.channels.username 
            ? (ac.channels.username.startsWith('@') ? ac.channels.username : `@${ac.channels.username}`)
            : ac.channels.name
        };
      })
      .filter((c): c is { id: string; name: string } => c !== null);

    console.log(`Найдено ${channels.length} каналов для проверки:`, channels);
    
    // Проверяем подписки параллельно
    const checks: SubscriptionCheck[] = await Promise.all(
      channels.map(async (channel) => {
        const status = await checkChannelSubscription(user.id, channel.id);
        return {
          chat_id: channel.id,
          status,
          channel_name: channel.name
        };
      })
    );

    // Определяем, разрешен ли доступ
    const allowedStatuses = ['member', 'administrator', 'creator'];
    const isAllowed = checks.every(check => allowedStatuses.includes(check.status));

    const result = {
      ok: isAllowed,
      checks,
      user: {
        id: user.id,
        first_name: user.first_name,
        username: user.username
      }
    };

    console.log(`Результат проверки для ${user.id}:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Ошибка в telegram-subscription-verify:', error)
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
