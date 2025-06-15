
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Верификация данных Telegram Login Widget
 * Использует алгоритм HMAC-SHA256 для проверки подлинности данных
 */
async function verifyTelegramAuth(data: any, botToken: string): Promise<boolean> {
  try {
    const { hash, ...authData } = data;
    
    // Создаем строку для проверки из всех параметров кроме hash
    const authParams = Object.keys(authData)
      .sort()
      .map(key => `${key}=${authData[key]}`)
      .join('\n');

    // Создаем секретный ключ из токена бота
    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const hmacKey = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      new TextEncoder().encode(botToken)
    );

    // Создаем HMAC для данных аутентификации
    const authKey = await crypto.subtle.importKey(
      'raw',
      hmacKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      authKey,
      new TextEncoder().encode(authParams)
    );

    // Конвертируем в hex
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Проверка подписи:', { expected: hash, calculated: signatureHex });
    
    return signatureHex === hash;
  } catch (error) {
    console.error('Ошибка верификации Telegram:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== TELEGRAM WIDGET AUTH ===');
    
    const { telegramData } = await req.json();
    console.log('Получены данные:', telegramData);

    if (!telegramData || !telegramData.id || !telegramData.hash) {
      console.error('Недопустимые входные данные');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Недопустимые данные пользователя'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN не найден');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Конфигурация сервера не найдена'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Проверяем время аутентификации (не старше 24 часов)
    const authAge = Date.now() / 1000 - telegramData.auth_date;
    if (authAge > 86400) { // 24 часа
      console.error('Данные аутентификации устарели');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Данные аутентификации устарели'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Верифицируем подлинность данных
    const isValid = await verifyTelegramAuth(telegramData, botToken);
    if (!isValid) {
      console.error('Неверная подпись данных');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Неверная подпись данных'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Данные Telegram успешно верифицированы');

    // Создаем Supabase клиент
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Создаем или обновляем пользователя
    const userData = {
      telegram_id: telegramData.id,
      username: telegramData.username || null,
      first_name: telegramData.first_name || null,
      last_name: telegramData.last_name || null,
      photo_url: telegramData.photo_url || null,
      is_premium: false,
      is_bot: false,
      language_code: 'ru',
      last_login: new Date().toISOString(),
    };

    // Проверяем существующего пользователя
    const { data: existingUser, error: selectError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramData.id)
      .single();

    let user;
    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (existingUser) {
      // Обновляем существующего пользователя
      const { data: updatedUser, error: updateError } = await supabase
        .from('telegram_users')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    } else {
      // Создаем нового пользователя
      const { data: newUser, error: insertError } = await supabase
        .from('telegram_users')
        .insert(userData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      user = newUser;
    }

    // Создаем сессию
    const sessionToken = `tg_widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Удаляем старые сессии пользователя
    await supabase
      .from('telegram_sessions')
      .delete()
      .eq('user_id', user.id);

    // Создаем новую сессию
    const { error: sessionError } = await supabase
      .from('telegram_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) throw sessionError;

    console.log('Пользователь успешно аутентифицирован:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        user,
        sessionToken,
        message: 'Аутентификация успешна'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Ошибка в функции telegram-widget-auth:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Внутренняя ошибка сервера'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
