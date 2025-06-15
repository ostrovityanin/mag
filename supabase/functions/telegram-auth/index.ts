
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Верификация данных Telegram WebApp initData
 */
async function verifyTelegramAuth(initData: string, botToken: string): Promise<boolean> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    params.delete('hash');
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
        dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

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
      new TextEncoder().encode(dataCheckString)
    );

    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Проверка подписи WebApp:', { expected: hash, calculated: signatureHex });
    
    return signatureHex === hash;
  } catch (error) {
    console.error('Ошибка верификации Telegram WebApp:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== TELEGRAM WEBAPP AUTH ===');
    
    const { initData } = await req.json();
    console.log('Получен initData:', initData ? 'да' : 'нет');

    if (!initData) {
      return new Response(JSON.stringify({ success: false, error: 'initData не предоставлен' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
        return new Response(JSON.stringify({ success: false, error: 'Конфигурация сервера не найдена (BOT_TOKEN)' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const params = new URLSearchParams(initData);
    const authDate = params.get('auth_date');
    if (!authDate) {
        return new Response(JSON.stringify({ success: false, error: 'auth_date отсутствует' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authAge = Date.now() / 1000 - parseInt(authDate, 10);
    if (authAge > 86400) { // 24 часа
      return new Response(JSON.stringify({ success: false, error: 'Данные аутентификации устарели' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isValid = await verifyTelegramAuth(initData, botToken);
    if (!isValid) {
      return new Response(JSON.stringify({ success: false, error: 'Неверная подпись данных WebApp' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Данные Telegram WebApp успешно верифицированы');
    
    const userJson = params.get('user');
    if (!userJson) {
        return new Response(JSON.stringify({ success: false, error: 'Данные пользователя отсутствуют в initData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const telegramUser = JSON.parse(userJson);


    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const userData = {
      telegram_id: telegramUser.id,
      username: telegramUser.username || null,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
      photo_url: telegramUser.photo_url || null,
      is_premium: telegramUser.is_premium || false,
      is_bot: telegramUser.is_bot || false,
      language_code: telegramUser.language_code || 'ru',
      last_login: new Date().toISOString(),
    };
    
    const { data: existingUser, error: selectError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single();

    let user;
    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('telegram_users')
        .update({
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url,
          is_premium: userData.is_premium,
          is_bot: userData.is_bot,
          language_code: userData.language_code,
          last_login: userData.last_login,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from('telegram_users')
        .insert(userData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      user = newUser;
    }

    const sessionToken = `tg_webapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase
      .from('telegram_sessions')
      .delete()
      .eq('user_id', user.id);

    const { error: sessionError } = await supabase
      .from('telegram_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) throw sessionError;

    console.log('Пользователь WebApp успешно аутентифицирован:', user.id);

    return new Response(JSON.stringify({ success: true, user, sessionToken, message: 'Аутентификация успешна' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Ошибка в функции telegram-auth:', error);
    return new Response(JSON.stringify({ success: false, error: 'Внутренняя ошибка сервера' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
