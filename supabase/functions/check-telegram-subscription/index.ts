
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
    
    if (!userId || !channelId || !username) {
      throw new Error('Missing required parameters: userId, channelId, username')
    }

    console.log(`Checking subscription for user ${userId} to channel @${username}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get bot token from secrets
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }

    // Get channel information from database
    const { data: channel, error: channelError } = await supabase
      .from('required_channels')
      .select('chat_id, username, channel_type')
      .eq('id', channelId)
      .single()

    if (channelError) {
      console.error('Error fetching channel:', channelError)
      throw new Error('Channel not found')
    }

    console.log('Channel info:', channel)

    // Check subscription using Telegram Bot API
    let isSubscribed = false
    
    try {
      // Determine channel identifier (use chat_id if available, otherwise username)
      const channelIdentifier = channel.chat_id || `@${channel.username}`
      
      console.log(`Checking membership for user ${userId} in channel ${channelIdentifier}`)
      
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelIdentifier}&user_id=${userId}`
      )
      
      const telegramData = await telegramResponse.json()
      console.log('Telegram API response:', telegramData)
      
      if (telegramData.ok) {
        const memberStatus = telegramData.result.status
        // User is subscribed if they are member, administrator, or creator
        isSubscribed = ['member', 'administrator', 'creator'].includes(memberStatus)
        console.log(`User ${userId} status in channel: ${memberStatus}, subscribed: ${isSubscribed}`)
      } else {
        console.error('Telegram API error:', telegramData)
        // If there's an error (like user not found), assume not subscribed
        isSubscribed = false
      }
    } catch (telegramError) {
      console.error('Error checking Telegram subscription:', telegramError)
      // On error, assume not subscribed for security
      isSubscribed = false
    }

    // Save subscription status to database
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId.toString(),
        channel_id: channelId,
        is_subscribed: isSubscribed,
        checked_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,channel_id'
      })

    if (upsertError) {
      console.error('Error saving subscription status:', upsertError)
      throw new Error('Failed to save subscription status')
    }

    console.log(`Subscription check completed: user ${userId}, channel ${channelId}, subscribed: ${isSubscribed}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        isSubscribed,
        channelId,
        userId 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in check-telegram-subscription function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
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
