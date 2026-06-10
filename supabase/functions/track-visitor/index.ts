import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { sessionId, userAgent } = await req.json()
    const ip = req.headers.get('x-forwarded-for')?.split(',').shift() || ''

    // Insert or update visitor data
    const { error: upsertError } = await supabaseClient
      .from('visitors')
      .upsert(
        { session_id: sessionId, user_agent: userAgent, ip_address: ip, last_seen_at: new Date().toISOString() },
        { onConflict: 'session_id' }
      )

    if (upsertError) {
      console.error('Error upserting visitor:', upsertError)
      throw upsertError
    }

    // Get updated stats
    const { data: visitorData, error: rpcError } = await supabaseClient.rpc('get_visitor_stats')

    if (rpcError) {
      console.error('Error getting visitor stats:', rpcError)
      throw rpcError
    }

    return new Response(JSON.stringify({ visitorData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
