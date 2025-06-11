
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
    console.log('=== ПРОСТАЯ ПРОВЕРКА ПОДПИСКИ ===');
    
    const { userId, channelId } = await req.json();
    console.log('Параметры:', { userId, channelId });

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

    // Проверяем подписку через Telegram API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelId)}&user_id=${userId}`;
    console.log('Запрос к Telegram API:', telegramUrl.replace(botToken, '[СКРЫТ]'));

    const response = await fetch(telegramUrl);
    const data = await response.json();
    
    console.log('Ответ Telegram API:', data);

    if (!data.ok) {
      console.error('Ошибка Telegram API:', data);
      return new Response(
        JSON.stringify({ 
          isSubscribed: false, 
          error: data.description || 'Ошибка проверки подписки'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Проверяем статус пользователя в канале
    const memberStatus = data.result?.status;
    const isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus);
    
    console.log('Статус пользователя:', memberStatus);
    console.log('Подписан:', isSubscribed);

    return new Response(
      JSON.stringify({ isSubscribed }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Ошибка в функции:', error);
    return new Response(
      JSON.stringify({ 
        isSubscribed: false, 
        error: 'Внутренняя ошибка сервера'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
