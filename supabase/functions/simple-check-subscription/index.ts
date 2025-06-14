
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== ПРОВЕРКА ПОДПИСОК ===');
    
    const { userId, channelIds, appCode = 'druid', username } = await req.json();
    console.log('Параметры:', { userId, channelIds, appCode, username });

    if (!userId || !Array.isArray(channelIds)) {
      console.error('Неверные параметры входа');
      return new Response(
        JSON.stringify({ 
          error: 'Неверные параметры входа',
          subscriptions: {}
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (channelIds.length === 0) {
      console.log('Нет каналов для проверки');
      return new Response(
        JSON.stringify({ subscriptions: {} }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN не найден');
      return new Response(
        JSON.stringify({ 
          error: 'Токен бота не настроен',
          subscriptions: {}
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Проверяем подписки для каждого канала
    const subscriptions: Record<string, boolean> = {};
    
    for (const chId of channelIds) {
      try {
        let chatId = chId;
        if (typeof chatId === 'string' && !chatId.startsWith('@') && isNaN(Number(chatId))) {
          chatId = '@' + chatId;
        }

        const telegramUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(userId)}`;

        const response = await fetch(telegramUrl);
        const data = await response.json();

        if (response.ok && data.ok) {
          const memberStatus = data.result?.status;
          const isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus);
          subscriptions[chId] = isSubscribed;
        } else {
          subscriptions[chId] = false;
        }
      } catch (error) {
        subscriptions[chId] = false;
      }
    }

    // Запись в логи подписок
    try {
      // Получаем авторизационный ключ и url из переменных окружения
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (supabaseUrl && supabaseAnonKey) {
        const logBody = {
          telegram_user_id: userId,
          username,
          checked_at: new Date().toISOString(),
          channel_check_results: subscriptions,
          app_code: appCode
        };
        await fetch(`${supabaseUrl}/rest/v1/subscription_checks_log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(logBody),
        });
      }
    } catch (logErr) {
      console.error('Ошибка записи subscription_checks_log', logErr);
      // Не прерываем основной ответ
    }

    return new Response(
      JSON.stringify({ subscriptions }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Ошибка в функции:', error);
    return new Response(
      JSON.stringify({ 
        subscriptions: {},
        error: 'Внутренняя ошибка сервера'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
