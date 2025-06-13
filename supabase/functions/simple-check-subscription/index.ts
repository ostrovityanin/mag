
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
    console.log('=== МАССОВАЯ ПРОВЕРКА ПОДПИСОК ===');
    
    const { userId, channelIds } = await req.json();
    console.log('Параметры:', { userId, channelIds });

    if (!Array.isArray(channelIds)) {
      console.error('channelIds должен быть массивом');
      return new Response(
        JSON.stringify({ error: 'channelIds должен быть массивом' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Получаем токен бота из секретов
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN не найден');
      return new Response(
        JSON.stringify({ error: 'Токен бота не настроен' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Проверяем подписки для каждого канала
    const subscriptions: Record<string, boolean> = {};
    
    for (const channelId of channelIds) {
      try {
        console.log(`Проверяем канал: ${channelId}`);
        
        const telegramUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelId)}&user_id=${userId}`;
        console.log('Запрос к Telegram API:', telegramUrl.replace(botToken, '[СКРЫТ]'));

        const response = await fetch(telegramUrl);
        const data = await response.json();
        
        console.log(`Ответ Telegram API для ${channelId}:`, data);

        if (!data.ok) {
          console.error(`Ошибка Telegram API для канала ${channelId}:`, data);
          subscriptions[channelId] = false;
          continue;
        }

        // Проверяем статус пользователя в канале
        const memberStatus = data.result?.status;
        const isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus);
        
        console.log(`Канал ${channelId} - статус пользователя: ${memberStatus}, подписан: ${isSubscribed}`);
        subscriptions[channelId] = isSubscribed;
        
      } catch (error) {
        console.error(`Ошибка при проверке канала ${channelId}:`, error);
        subscriptions[channelId] = false;
      }
    }

    console.log('Итоговый результат проверки подписок:', subscriptions);

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
