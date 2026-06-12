import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse input payloads
    const { orders } = await req.json() // Array of { id, customer_id, total_amount, payment_status, items, payments, created_by }
    
    if (!orders || !Array.isArray(orders)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid orders array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = []

    for (const offlineOrder of orders) {
      const { id: orderId, customer_id, total_amount, payment_status, items, payments, created_by } = offlineOrder

      // 1. Deduplication: check if order already exists
      const { data: existingOrder } = await supabaseClient
        .from('orders')
        .select('id, payment_status')
        .eq('id', orderId)
        .maybeSingle()

      if (existingOrder) {
        results.push({ id: orderId, status: 'skipped', reason: 'Order already synced' })
        continue
      }

      // 2. Validate stock availability for all items in this order
      let hasConflict = false
      const validatedItems = []

      for (const item of items) {
        // Find if any batch has enough remaining quantity
        const { data: batch, error: batchError } = await supabaseClient
          .from('inventory_batches')
          .select('id, remaining_quantity')
          .eq('product_id', item.product_id)
          .gte('remaining_quantity', item.quantity)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (batchError || !batch) {
          hasConflict = true
          break
        }
        
        validatedItems.push({
          ...item,
          batch_id: batch.id
        })
      }

      // 3. Insert order record
      const finalPaymentStatus = hasConflict ? 'pending_resolution' : payment_status

      const { data: createdOrder, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          id: orderId,
          customer_id,
          total_amount,
          payment_status: finalPaymentStatus,
          created_by
        })
        .select()
        .single()

      if (orderError) {
        results.push({ id: orderId, status: 'error', reason: orderError.message })
        continue
      }

      // 4. Create Order Items & Deduct Stock if no conflict
      if (!hasConflict) {
        let itemsFailed = false
        for (const item of validatedItems) {
          const { error: itemError } = await supabaseClient
            .from('order_items')
            .insert({
              order_id: orderId,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              batch_id: item.batch_id
            })

          if (itemError) {
            itemsFailed = true
            break
          }
        }

        if (itemsFailed) {
          // Fallback order to pending_resolution
          await supabaseClient
            .from('orders')
            .update({ payment_status: 'pending_resolution' })
            .eq('id', orderId)

          hasConflict = true
        }
      }

      // 5. Save payment details
      for (const pay of payments) {
        await supabaseClient
          .from('payments')
          .insert({
            order_id: orderId,
            provider: pay.provider,
            amount: pay.amount,
            reference: pay.reference,
            status: hasConflict ? 'pending' : 'completed'
          })
      }

      // 6. Log Sync Auditing
      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: created_by,
          action: hasConflict ? 'ORDER_SYNC_CONFLICT' : 'ORDER_SYNC_SUCCESS',
          details: { order_id: orderId, has_conflict: hasConflict }
        })

      results.push({
        id: orderId,
        status: hasConflict ? 'conflict' : 'success',
        resolvedStatus: finalPaymentStatus
      })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
