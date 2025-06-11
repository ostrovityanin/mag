
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { userId, channelId, username } = await req.json()
    
    console.log('=== SUBSCRIPTION CHECK START ===')
    console.log('Request params:', { userId, channelId, username })
    
    if (!userId || !channelId || !username) {
      throw new Error('Missing required parameters: userId, channelId, username')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get bot token from secrets
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    console.log('Bot token exists:', !!botToken)
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }

    // Get channel information from database
    const { data: channel, error: channelError } = await supabase
      .from('required_channels')
      .select('chat_id, username, channel_type, name')
      .eq('id', channelId)
      .single()

    if (channelError) {
      console.error('Error fetching channel:', channelError)
      throw new Error('Channel not found')
    }

    console.log('Channel from database:', channel)

    // Check subscription using Telegram Bot API
    let isSubscribed = false
    let telegramApiResponse = null
    
    try {
      // Determine channel identifier (use chat_id if available, otherwise username)
      const channelIdentifier = channel.chat_id || `@${channel.username}`
      
      console.log(`Checking membership for user ${userId} in channel ${channelIdentifier}`)
      
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelIdentifier)}&user_id=${userId}`
      console.log('Telegram API URL (without token):', telegramApiUrl.replace(botToken, 'HIDDEN_TOKEN'))
      
      const telegramResponse = await fetch(telegramApiUrl)
      telegramApiResponse = await telegramResponse.json()
      
      console.log('Telegram API response status:', telegramResponse.status)
      console.log('Telegram API full response:', JSON.stringify(telegramApiResponse, null, 2))
      
      if (telegramApiResponse.ok) {
        const memberStatus = telegramApiResponse.result.status
        // User is subscribed if they are member, administrator, or creator
        isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus)
        console.log(`User ${userId} status in channel: ${memberStatus}, subscribed: ${isSubscribed}`)
      } else {
        console.error('Telegram API error details:', {
          error_code: telegramApiResponse.error_code,
          description: telegramApiResponse.description,
          parameters: telegramApiResponse.parameters
        })
        
        // Special handling for common errors
        if (telegramApiResponse.error_code === 400) {
          if (telegramApiResponse.description?.includes('user not found')) {
            console.log('User not found in chat - treating as not subscribed')
          } else if (telegramApiResponse.description?.includes('chat not found')) {
            console.error('Chat not found - check channel identifier')
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
    
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id,channel_id'
      })

    if (upsertError) {
      console.error('Error saving subscription status:', upsertError)
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
        subscriptionSaved: true
      }
    }
    
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
