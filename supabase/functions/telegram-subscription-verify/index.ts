
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

// Каналы для разных приложений
const APP_CHANNELS = {
  druid: [
    { id: '-1002473071772', name: '@druid_horoscope_channel' },
    // Добавьте другие каналы для друид-приложения
  ],
  main: [
    { id: '-1002345678901', name: '@main_app_channel' },
    // Каналы для основного приложения
  ]
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN не установлен');
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

    // Получаем каналы для приложения
    const channels = APP_CHANNELS[app as keyof typeof APP_CHANNELS] || APP_CHANNELS.druid;
    
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
