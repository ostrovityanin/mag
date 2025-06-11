
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to log to database
async function logToDatabase(supabase: any, level: string, message: string, context: any = null, functionName: string = 'check-telegram-subscription', userId: string | null = null) {
  try {
    await supabase
      .from('system_logs')
      .insert({
        level,
        message,
        context,
        function_name: functionName,
        user_id: userId
      })
  } catch (error) {
    console.error('Failed to log to database:', error)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { userId, channelId, username } = await req.json()
    
    console.log('=== ПРОВЕРКА ПОДПИСКИ РЕАЛЬНОГО ПОЛЬЗОВАТЕЛЯ ===')
    console.log('userId:', userId, 'type:', typeof userId)
    console.log('channelId:', channelId, 'type:', typeof channelId)
    console.log('username:', username, 'type:', typeof username)
    
    await logToDatabase(supabase, 'info', 'Начало проверки подписки', {
      userId,
      channelId,
      username,
      userIdType: typeof userId
    }, 'check-telegram-subscription', userId)
    
    if (!userId || !channelId || !username) {
      const errorMsg = 'Отсутствуют обязательные параметры: userId, channelId, username'
      await logToDatabase(supabase, 'error', errorMsg, {
        providedParams: { userId: !!userId, channelId: !!channelId, username: !!username }
      }, 'check-telegram-subscription', userId)
      throw new Error(errorMsg)
    }

    // Get bot token from secrets
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    console.log('Bot token доступен:', !!botToken)
    
    if (!botToken) {
      const errorMsg = 'TELEGRAM_BOT_TOKEN не настроен в секретах Supabase'
      await logToDatabase(supabase, 'error', errorMsg, null, 'check-telegram-subscription', userId)
      throw new Error(errorMsg)
    }

    await logToDatabase(supabase, 'info', 'Получение информации о канале из базы данных', {
      channelId
    }, 'check-telegram-subscription', userId)

    // Get channel information from database
    const { data: channel, error: channelError } = await supabase
      .from('required_channels')
      .select('chat_id, username, channel_type, name')
      .eq('id', channelId)
      .single()

    if (channelError) {
      console.error('Ошибка получения канала:', channelError)
      await logToDatabase(supabase, 'error', 'Ошибка получения канала из базы данных', {
        channelId,
        error: channelError
      }, 'check-telegram-subscription', userId)
      throw new Error('Канал не найден в базе данных')
    }

    console.log('Канал из базы данных:', channel)
    await logToDatabase(supabase, 'info', 'Канал найден в базе данных', {
      channel
    }, 'check-telegram-subscription', userId)

    // Prepare channel identifier for Telegram API
    const channelIdentifier = channel.chat_id || `@${channel.username}`
    
    console.log(`=== ВЫЗОВ TELEGRAM API ===`)
    console.log(`User ID: ${userId}`)
    console.log(`Идентификатор канала: ${channelIdentifier}`)
    console.log(`Тип канала: ${channel.channel_type}`)
    
    await logToDatabase(supabase, 'info', 'Вызов Telegram API', {
      userId,
      channelIdentifier,
      channelType: channel.channel_type,
      usesChatId: !!channel.chat_id
    }, 'check-telegram-subscription', userId)
    
    // Call Telegram API to check subscription
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelIdentifier)}&user_id=${userId}`
    console.log('Вызов Telegram API:', telegramApiUrl.replace(botToken, 'HIDDEN_TOKEN'))
    
    const telegramResponse = await fetch(telegramApiUrl)
    const telegramApiResponse = await telegramResponse.json()
    
    console.log('Статус ответа Telegram API:', telegramResponse.status)
    console.log('Полный ответ Telegram API:', JSON.stringify(telegramApiResponse, null, 2))

    await logToDatabase(supabase, 'info', 'Ответ от Telegram API', {
      httpStatus: telegramResponse.status,
      responseOk: telegramApiResponse.ok,
      errorCode: telegramApiResponse.error_code,
      description: telegramApiResponse.description,
      result: telegramApiResponse.result
    }, 'check-telegram-subscription', userId)
    
    let isSubscribed = false
    
    if (telegramApiResponse.ok && telegramApiResponse.result) {
      const memberStatus = telegramApiResponse.result.status
      isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus)
      console.log(`Пользователь ${userId} статус в канале: ${memberStatus}, подписан: ${isSubscribed}`)
      
      await logToDatabase(supabase, 'info', 'Статус пользователя в канале определен', {
        memberStatus,
        isSubscribed,
        result: telegramApiResponse.result
      }, 'check-telegram-subscription', userId)
    } else {
      console.error('Ошибка Telegram API:', {
        error_code: telegramApiResponse.error_code,
        description: telegramApiResponse.description
      })

      await logToDatabase(supabase, 'error', 'Ошибка Telegram API', {
        error_code: telegramApiResponse.error_code,
        description: telegramApiResponse.description,
        channelIdentifier,
        userId
      }, 'check-telegram-subscription', userId)
      
      // Если API вернул ошибку, проверяем код ошибки
      if (telegramApiResponse.error_code === 400 && telegramApiResponse.description?.includes('user not found')) {
        throw new Error('Пользователь не найден в Telegram или не взаимодействовал с ботом')
      } else if (telegramApiResponse.error_code === 400 && telegramApiResponse.description?.includes('chat not found')) {
        throw new Error('Канал не найден. Проверьте правильность chat_id или username канала')
      } else {
        throw new Error(`Ошибка Telegram API: ${telegramApiResponse.description || 'Неизвестная ошибка'}`)
      }
    }

    // Save subscription status to database
    const subscriptionData = {
      user_id: userId.toString(),
      channel_id: channelId,
      is_subscribed: isSubscribed,
      checked_at: new Date().toISOString()
    }
    
    console.log('Сохранение данных подписки:', subscriptionData)
    await logToDatabase(supabase, 'info', 'Сохранение статуса подписки в базу данных', {
      subscriptionData
    }, 'check-telegram-subscription', userId)
    
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id,channel_id'
      })

    if (upsertError) {
      console.error('Ошибка сохранения статуса подписки:', upsertError)
      await logToDatabase(supabase, 'error', 'Ошибка сохранения статуса подписки', {
        error: upsertError,
        subscriptionData
      }, 'check-telegram-subscription', userId)
      throw new Error('Не удалось сохранить статус подписки')
    }

    const result = { 
      success: true, 
      isSubscribed,
      channelId,
      userId,
      debug: {
        channelInfo: channel,
        telegramApiResponse: telegramApiResponse,
        subscriptionSaved: true,
        usedChannelIdentifier: channelIdentifier
      }
    }
    
    await logToDatabase(supabase, 'info', 'Проверка подписки завершена успешно', {
      result: {
        isSubscribed,
        channelId,
        userId
      }
    }, 'check-telegram-subscription', userId)

    console.log('=== КОНЕЦ ПРОВЕРКИ ПОДПИСКИ ===')
    console.log('Итоговый результат:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('=== ОШИБКА В ПРОВЕРКЕ ПОДПИСКИ ===')
    console.error('Детали ошибки:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })

    await logToDatabase(supabase, 'error', 'Критическая ошибка в проверке подписки', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }, 'check-telegram-subscription')
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        debug: {
          errorType: error.name,
          errorStack: error.stack
        }
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
