
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
    
    console.log('=== DETAILED REQUEST DEBUG ===')
    console.log('Raw request body received')
    console.log('userId:', userId, 'type:', typeof userId)
    console.log('channelId:', channelId, 'type:', typeof channelId)
    console.log('username:', username, 'type:', typeof username)
    
    await logToDatabase(supabase, 'info', 'Подробный анализ входящих данных', {
      userId,
      channelId,
      username,
      userIdType: typeof userId,
      channelIdType: typeof channelId,
      usernameType: typeof username,
      timestamp: new Date().toISOString()
    }, 'check-telegram-subscription', userId)
    
    if (!userId || !channelId || !username) {
      const errorMsg = 'Missing required parameters: userId, channelId, username'
      await logToDatabase(supabase, 'error', errorMsg, {
        providedParams: { userId: !!userId, channelId: !!channelId, username: !!username }
      }, 'check-telegram-subscription', userId)
      throw new Error(errorMsg)
    }

    // Get bot token from secrets
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    console.log('Bot token exists:', !!botToken)
    
    if (!botToken) {
      const errorMsg = 'TELEGRAM_BOT_TOKEN is not configured'
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
      console.error('Error fetching channel:', channelError)
      await logToDatabase(supabase, 'error', 'Ошибка получения канала из базы данных', {
        channelId,
        error: channelError
      }, 'check-telegram-subscription', userId)
      throw new Error('Channel not found')
    }

    console.log('Channel from database:', channel)
    await logToDatabase(supabase, 'info', 'Канал найден в базе данных', {
      channel
    }, 'check-telegram-subscription', userId)

    // Check subscription using Telegram Bot API
    let isSubscribed = false
    let telegramApiResponse = null
    
    try {
      // Determine channel identifier (use chat_id if available, otherwise username)
      const channelIdentifier = channel.chat_id || `@${channel.username}`
      
      console.log(`=== TELEGRAM API CALL DETAILS ===`)
      console.log(`User ID for API call: ${userId}`)
      console.log(`Channel identifier: ${channelIdentifier}`)
      console.log(`Channel type: ${channel.channel_type}`)
      console.log(`Using chat_id: ${!!channel.chat_id}`)
      
      await logToDatabase(supabase, 'info', 'Детали вызова Telegram API', {
        userId,
        channelIdentifier,
        channelType: channel.channel_type,
        usesChatId: !!channel.chat_id,
        originalUsername: username,
        channelUsername: channel.username
      }, 'check-telegram-subscription', userId)
      
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelIdentifier)}&user_id=${userId}`
      console.log('Telegram API URL (without token):', telegramApiUrl.replace(botToken, 'HIDDEN_TOKEN'))
      
      const telegramResponse = await fetch(telegramApiUrl)
      telegramApiResponse = await telegramResponse.json()
      
      console.log('Telegram API response status:', telegramResponse.status)
      console.log('Telegram API full response:', JSON.stringify(telegramApiResponse, null, 2))

      await logToDatabase(supabase, 'info', 'Детальный ответ от Telegram API', {
        status: telegramResponse.status,
        responseOk: telegramApiResponse.ok,
        errorCode: telegramApiResponse.error_code,
        description: telegramApiResponse.description,
        fullResponse: telegramApiResponse
      }, 'check-telegram-subscription', userId)
      
      if (telegramApiResponse.ok) {
        const memberStatus = telegramApiResponse.result.status
        // User is subscribed if they are member, administrator, or creator
        isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus)
        console.log(`User ${userId} status in channel: ${memberStatus}, subscribed: ${isSubscribed}`)
        
        await logToDatabase(supabase, 'info', 'Статус пользователя в канале определен', {
          memberStatus,
          isSubscribed,
          result: telegramApiResponse.result
        }, 'check-telegram-subscription', userId)
      } else {
        console.error('Telegram API error details:', {
          error_code: telegramApiResponse.error_code,
          description: telegramApiResponse.description,
          parameters: telegramApiResponse.parameters
        })

        await logToDatabase(supabase, 'warning', 'Детальная ошибка Telegram API', {
          error_code: telegramApiResponse.error_code,
          description: telegramApiResponse.description,
          parameters: telegramApiResponse.parameters,
          channelIdentifier,
          userId,
          botHasToken: !!botToken
        }, 'check-telegram-subscription', userId)
        
        // Special handling for common errors
        if (telegramApiResponse.error_code === 400) {
          if (telegramApiResponse.description?.includes('user not found')) {
            console.log('User not found in chat - treating as not subscribed')
            await logToDatabase(supabase, 'info', 'Пользователь не найден в чате (возможно не подписан)', {
              userId,
              channelIdentifier,
              suggestion: 'Пользователь должен подписаться на канал'
            }, 'check-telegram-subscription', userId)
          } else if (telegramApiResponse.description?.includes('chat not found')) {
            console.error('Chat not found - check channel identifier')
            await logToDatabase(supabase, 'error', 'Чат не найден - проверьте идентификатор канала', {
              channelIdentifier,
              suggestion: 'Проверьте правильность chat_id или username канала'
            }, 'check-telegram-subscription', userId)
          }
        }
        
        // If there's an error, assume not subscribed
        isSubscribed = false
      }
    } catch (telegramError) {
      console.error('Error making request to Telegram API:', telegramError)
      console.error('Error details:', {
        name: telegramError.name,
        message: telegramError.message,
        stack: telegramError.stack
      })

      await logToDatabase(supabase, 'error', 'Критическая ошибка при запросе к Telegram API', {
        errorName: telegramError.name,
        errorMessage: telegramError.message,
        errorStack: telegramError.stack
      }, 'check-telegram-subscription', userId)
      
      // On error, assume not subscribed for security
      isSubscribed = false
    }

    // Save subscription status to database
    const subscriptionData = {
      user_id: userId.toString(),
      channel_id: channelId,
      is_subscribed: isSubscribed,
      checked_at: new Date().toISOString()
    }
    
    console.log('Saving subscription data:', subscriptionData)
    await logToDatabase(supabase, 'info', 'Сохранение статуса подписки в базу данных', {
      subscriptionData
    }, 'check-telegram-subscription', userId)
    
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id,channel_id'
      })

    if (upsertError) {
      console.error('Error saving subscription status:', upsertError)
      await logToDatabase(supabase, 'error', 'Ошибка сохранения статуса подписки', {
        error: upsertError,
        subscriptionData
      }, 'check-telegram-subscription', userId)
      throw new Error('Failed to save subscription status')
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
        usedChannelIdentifier: channel.chat_id || `@${channel.username}`
      }
    }
    
    await logToDatabase(supabase, 'info', 'Проверка подписки завершена успешно', {
      result: {
        isSubscribed,
        channelId,
        userId
      }
    }, 'check-telegram-subscription', userId)

    console.log('=== SUBSCRIPTION CHECK END ===')
    console.log('Final result:', result)

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
    console.error('=== ERROR IN SUBSCRIPTION CHECK ===')
    console.error('Error details:', {
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
