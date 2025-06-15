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
    console.log('Получены параметры:')
    console.log('- userId:', userId, '(тип:', typeof userId, ')')
    console.log('- channelId:', channelId, '(тип:', typeof channelId, ')')
    console.log('- username:', username, '(тип:', typeof username, ')')
    
    await logToDatabase(supabase, 'info', 'Начало проверки подписки реального пользователя', {
      userId,
      channelId,
      username,
      userIdType: typeof userId,
      receivedAt: new Date().toISOString()
    }, 'check-telegram-subscription', userId)
    
    // Валидация входных параметров
    if (!userId || !channelId || !username) {
      const errorMsg = 'Отсутствуют обязательные параметры: userId, channelId, username'
      console.error('Ошибка валидации:', errorMsg)
      await logToDatabase(supabase, 'error', errorMsg, {
        providedParams: { 
          hasUserId: !!userId, 
          hasChannelId: !!channelId, 
          hasUsername: !!username 
        }
      }, 'check-telegram-subscription', userId)
      throw new Error(errorMsg)
    }

    // Проверка токена бота
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    console.log('Статус токена бота:', botToken ? 'найден' : 'отсутствует')
    
    if (!botToken) {
      const errorMsg = 'TELEGRAM_BOT_TOKEN не настроен в секретах Supabase'
      console.error('Критическая ошибка:', errorMsg)
      await logToDatabase(supabase, 'error', errorMsg, null, 'check-telegram-subscription', userId)
      throw new Error(errorMsg)
    }

    console.log('=== ПОЛУЧЕНИЕ ДАННЫХ КАНАЛА ===')
    await logToDatabase(supabase, 'info', 'Поиск канала в базе данных', {
      channelId
    }, 'check-telegram-subscription', userId)

    // Получение информации о канале из базы данных
    const { data: channel, error: channelError } = await supabase
      .from('required_channels')
      .select('chat_id, username, channel_type, name')
      .eq('id', channelId)
      .single()

    if (channelError) {
      console.error('Ошибка получения канала из БД:', channelError)
      await logToDatabase(supabase, 'error', 'Канал не найден в базе данных', {
        channelId,
        error: channelError
      }, 'check-telegram-subscription', userId)
      throw new Error(`Канал с ID ${channelId} не найден в базе данных`)
    }

    console.log('Данные канала из БД:', channel)
    await logToDatabase(supabase, 'info', 'Канал найден в базе данных', {
      channel,
      foundChatId: !!channel.chat_id,
      foundUsername: !!channel.username
    }, 'check-telegram-subscription', userId)

    // Подготовка идентификатора канала для Telegram API
    const channelIdentifier = channel.chat_id || `@${channel.username}`
    
    console.log('=== ВЫЗОВ TELEGRAM API ===')
    console.log('Параметры запроса:')
    console.log('- Пользователь ID:', userId)
    console.log('- Идентификатор канала:', channelIdentifier)
    console.log('- Тип канала:', channel.channel_type)
    console.log('- Используется chat_id:', !!channel.chat_id)
    
    await logToDatabase(supabase, 'info', 'Подготовка к вызову Telegram API', {
      userId,
      channelIdentifier,
      channelType: channel.channel_type,
      usesChatId: !!channel.chat_id,
      channelName: channel.name
    }, 'check-telegram-subscription', userId)
    
    // Формирование URL для Telegram API
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelIdentifier)}&user_id=${userId}`
    console.log('URL запроса к Telegram API:', telegramApiUrl.replace(botToken, '[СКРЫТ]'))
    
    // Вызов Telegram API
    const telegramResponse = await fetch(telegramApiUrl)
    const telegramApiResponse = await telegramResponse.json()
    
    console.log('=== ОТВЕТ TELEGRAM API ===')
    console.log('HTTP статус:', telegramResponse.status)
    console.log('Ответ API:', JSON.stringify(telegramApiResponse, null, 2))

    await logToDatabase(supabase, 'info', 'Получен ответ от Telegram API', {
      httpStatus: telegramResponse.status,
      responseOk: telegramApiResponse.ok,
      errorCode: telegramApiResponse.error_code,
      description: telegramApiResponse.description,
      hasResult: !!telegramApiResponse.result,
      memberStatus: telegramApiResponse.result?.status
    }, 'check-telegram-subscription', userId)
    
    let isSubscribed = false
    
    if (telegramApiResponse.ok && telegramApiResponse.result) {
      const memberStatus = telegramApiResponse.result.status
      isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus)
      console.log(`=== РЕЗУЛЬТАТ ПРОВЕРКИ ===`)
      console.log(`Статус пользователя ${userId} в канале:`, memberStatus)
      console.log(`Подписан:`, isSubscribed)
      
      await logToDatabase(supabase, 'info', 'Статус пользователя в канале определен', {
        memberStatus,
        isSubscribed,
        userInfo: telegramApiResponse.result
      }, 'check-telegram-subscription', userId)
    } else {
      console.error('=== ОШИБКА TELEGRAM API ===')
      console.error('Код ошибки:', telegramApiResponse.error_code)
      console.error('Описание:', telegramApiResponse.description)

      await logToDatabase(supabase, 'error', 'Ошибка ответа от Telegram API', {
        error_code: telegramApiResponse.error_code,
        description: telegramApiResponse.description,
        channelIdentifier,
        userId,
        fullResponse: telegramApiResponse
      }, 'check-telegram-subscription', userId)
      
      // Обработка специфических ошибок Telegram API
      if (telegramApiResponse.error_code === 400) {
        if (telegramApiResponse.description?.includes('user not found')) {
          throw new Error(`Пользователь с ID ${userId} не найден в Telegram или не взаимодействовал с ботом`)
        } else if (telegramApiResponse.description?.includes('chat not found')) {
          throw new Error(`Канал ${channelIdentifier} не найден или бот не добавлен в канал`)
        } else if (telegramApiResponse.description?.includes('USER_ID_INVALID')) {
          throw new Error(`Некорректный ID пользователя: ${userId}`)
        }
      }
      
      throw new Error(`Ошибка Telegram API (${telegramApiResponse.error_code}): ${telegramApiResponse.description || 'Неизвестная ошибка'}`)
    }

    // === ДОБАВЛЯЕМ ОЧИСТКУ user_subscriptions ===
    // Очищаем результаты прошлых проверок чтобы не было "вечного" кэша
    console.log("=== ОЧИСТКА user_subscriptions перед новой проверкой ===")
    const { error: deleteError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId.toString())
      .eq('channel_id', channelId);

    if (deleteError) {
      console.error("Ошибка при очистке записей user_subscriptions:", deleteError)
      await logToDatabase(supabase, 'error', 'Ошибка очистки user_subscriptions', {
        userId,
        channelId,
        deleteError
      }, 'check-telegram-subscription', userId)
      // Не прерываем дальнейшую работу, просто логируем ошибку
    } else {
      await logToDatabase(supabase, 'info', 'Очищены старые записи user_subscriptions', {
        userId,
        channelId
      }, 'check-telegram-subscription', userId)
    }

    // Сохранение результата в базу данных
    const subscriptionData = {
      user_id: userId.toString(),
      channel_id: channelId,
      is_subscribed: isSubscribed,
      checked_at: new Date().toISOString()
    }
    
    console.log('=== СОХРАНЕНИЕ РЕЗУЛЬТАТА ===')
    console.log('Данные для сохранения:', subscriptionData)
    
    await logToDatabase(supabase, 'info', 'Сохранение результата проверки подписки', {
      subscriptionData
    }, 'check-telegram-subscription', userId)
    
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id,channel_id'
      })

    if (upsertError) {
      console.error('Ошибка сохранения в БД:', upsertError)
      await logToDatabase(supabase, 'error', 'Ошибка сохранения статуса подписки', {
        error: upsertError,
        subscriptionData
      }, 'check-telegram-subscription', userId)
      throw new Error('Не удалось сохранить статус подписки в базу данных')
    }

    const result = { 
      success: true, 
      isSubscribed,
      channelId,
      userId,
      debug: {
        channelInfo: channel,
        telegramApiResponse: {
          ok: telegramApiResponse.ok,
          error_code: telegramApiResponse.error_code,
          description: telegramApiResponse.description,
          result: telegramApiResponse.result
        },
        subscriptionSaved: true,
        usedChannelIdentifier: channelIdentifier,
        timestamp: new Date().toISOString()
      }
    }
    
    await logToDatabase(supabase, 'info', 'Проверка подписки завершена успешно', {
      result: {
        isSubscribed,
        channelId,
        userId,
        channelName: channel.name
      }
    }, 'check-telegram-subscription', userId)

    console.log('=== УСПЕШНОЕ ЗАВЕРШЕНИЕ ===')
    console.log('Финальный результат:', {
      success: true,
      isSubscribed,
      channelId,
      userId
    })

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
    console.error('=== КРИТИЧЕСКАЯ ОШИБКА ===')
    console.error('Тип ошибки:', error.name)
    console.error('Сообщение ошибки:', error.message)
    console.error('Стек ошибки:', error.stack)

    await logToDatabase(supabase, 'error', 'Критическая ошибка в функции проверки подписки', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    }, 'check-telegram-subscription')
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        debug: {
          errorType: error.name,
          timestamp: new Date().toISOString()
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
