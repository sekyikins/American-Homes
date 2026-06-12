import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT and get user credentials
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Auth Header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get input payload
    const { withdrawalId } = await req.json()
    if (!withdrawalId) {
      return new Response(JSON.stringify({ error: 'Missing withdrawalId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch the withdrawal record
    const { data: withdrawal, error: fetchError } = await supabaseClient
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return new Response(JSON.stringify({ error: 'Withdrawal request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (withdrawal.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (withdrawal.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Withdrawal is already processed or completed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch wallet balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet || wallet.balance < withdrawal.amount) {
      return new Response(JSON.stringify({ error: 'Insufficient wallet balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update state to processing
    await supabaseClient
      .from('withdrawals')
      .update({ status: 'processing' })
      .eq('id', withdrawalId)

    // Call Mock Payout Gateway API
    // (Simulating Flutterwave/MoMo/Hubtel delay and response)
    const successRate = 0.95
    const isSuccess = Math.random() < successRate
    
    if (isSuccess) {
      // Complete transaction (The database trigger will adjust wallet balance on completed status)
      const { error: updateError } = await supabaseClient
        .from('withdrawals')
        .update({ status: 'completed' })
        .eq('id', withdrawalId)

      if (updateError) throw updateError

      return new Response(JSON.stringify({ success: true, status: 'completed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      // Mark as failed
      await supabaseClient
        .from('withdrawals')
        .update({ status: 'failed' })
        .eq('id', withdrawalId)

      return new Response(JSON.stringify({ success: false, status: 'failed', error: 'Payment gateway rejected payout' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
