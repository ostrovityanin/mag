
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
    const subscriptions: Record<string, boolean | string> = {};
    
    for (const chId of channelIds) {
      try {
        let chatId = chId;
        if (typeof chatId === 'string' && !chatId.startsWith('@') && isNaN(Number(chatId))) {
          chatId = '@' + chatId;
        }

        console.log(`Проверяем канал: ${chatId}`);
        const telegramUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(userId)}`;

        const response = await fetch(telegramUrl);
        const data = await response.json();

        if (response.ok && data.ok) {
          const memberStatus = data.result?.status;
          const isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus);
          subscriptions[chId] = isSubscribed;
          console.log(`Канал ${chatId}: статус=${memberStatus}, подписан=${isSubscribed}`);
        } else {
          // Отмечаем как ошибку вместо false
          subscriptions[chId] = 'error';
          console.error(`Ошибка проверки канала ${chatId}:`, data.error_code, data.description);
        }
      } catch (error) {
        // Отмечаем как ошибку вместо false
        subscriptions[chId] = 'error';
        console.error(`Исключение при проверке канала ${chId}:`, error);
      }
    }

    // Запись в логи подписок
    try {
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
    }

    console.log('Результат проверки подписок:', subscriptions);

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
