
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
    console.log('=== УПРОЩЕННАЯ ПРОВЕРКА ПОДПИСОК ===');
    
    const { userId, channelIds } = await req.json();
    console.log('Параметры:', { userId, channelIds });

    if (!userId || !Array.isArray(channelIds)) {
      console.error('Неверные параметры входа');
      return new Response(
        JSON.stringify({ error: 'Неверные параметры входа' }),
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
    
    for (const chId of channelIds) {
      try {
        let chatId = chId;
        // Если передали username без "@", добавим его
        if (typeof chatId === 'string' && !chatId.startsWith('@') && isNaN(Number(chatId))) {
          chatId = '@' + chatId;
        }
        
        console.log(`Проверяем канал: ${chatId} для пользователя ${userId}`);
        
        const telegramUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(userId)}`;
        console.log('Запрос к Telegram API:', telegramUrl.replace(botToken, '[СКРЫТ]'));

        const response = await fetch(telegramUrl);
        const data = await response.json();
        
        console.log(`Ответ Telegram API для ${chatId}:`, data);

        if (response.ok && data.ok) {
          const memberStatus = data.result?.status;
          const isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus);
          
          console.log(`Канал ${chatId} - статус пользователя: ${memberStatus}, подписан: ${isSubscribed}`);
          subscriptions[chId] = isSubscribed;
        } else {
          console.error(`Ошибка Telegram API для канала ${chatId}:`, data);
          subscriptions[chId] = false;
        }
        
      } catch (error) {
        console.error(`Ошибка при проверке канала ${chId}:`, error);
        subscriptions[chId] = false;
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
