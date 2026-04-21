import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'npm:zod@3.23.8'
import {
  DEFAULT_APP_ORIGIN,
  DEFAULT_MARKETING_ORIGIN,
  buildAbsoluteUrl,
  buildStripeCallbackRoute,
} from '../../../src/contracts/routes.ts'
import type {
  StripeLinkResponse,
  StripeOAuthConnectRequest,
} from '../../../src/contracts/stripe.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

const stripeOAuthConnectSchema = z.object({
  platform: z.enum(['native', 'web']).default('web'),
})

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Initiating Stripe OAuth flow')

    // Parse body
    const parsedBody = await req.json().catch((e: any) => {
      throw new Error(`Invalid JSON: ${e?.message || e}`)
    })
    const { platform } = stripeOAuthConnectSchema.parse(
      parsedBody
    ) as StripeOAuthConnectRequest

    // Supabase (use anon key; forward Authorization for session)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )

    // Get the session user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      throw new Error('Unauthorized')
    }
    console.log('User authenticated:', user.id)

    // Stripe client_id
    const stripeClientId = Deno.env.get('STRIPE_CLIENT_ID')
    if (!stripeClientId) throw new Error('Stripe client ID not configured')

    // Build redirect_uri
    const originHeader = req.headers.get('origin')
    const defaultWebOrigin = DEFAULT_MARKETING_ORIGIN
    // Use a simple allowlist if you have multiple frontends; here we just fallback.
    const webOrigin = originHeader && /^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(originHeader)
      ? originHeader
      : defaultWebOrigin

    // Native uses your Universal Link page (must be whitelisted in Stripe’s dashboard)
    const isNative = platform === 'native'
    const redirectUri = isNative
      ? buildAbsoluteUrl(buildStripeCallbackRoute(), DEFAULT_APP_ORIGIN)
      : buildAbsoluteUrl(buildStripeCallbackRoute(), webOrigin)

    // OAuth link: Configure for Standard connected accounts with direct charges
    // Standard accounts support direct charges and application fee collection
    const params = new URLSearchParams({
      client_id: stripeClientId,
      response_type: 'code',
      scope: 'read_write', // Full access for Standard accounts
      redirect_uri: redirectUri,
      state: user.id, // use CSRF token or a signed nonce if you prefer
      'stripe_user[email]': user.email || '',
      'stripe_user[country]': 'AU',
      // Standard account configuration
      'stripe_user[product_description]': 'Music booking and payment platform',
      'stripe_user[business_type]': 'individual', // Can be 'company' or 'individual'
      // Capabilities for Standard accounts
      suggested_capabilities: JSON.stringify([
        'card_payments',
        'transfers',
        'tax_reporting_us_1099_misc',
        'tax_reporting_us_1099_k'
      ]),
    })

    const oauthUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`
    console.log('OAuth URL created:', oauthUrl)

    const responseBody: StripeLinkResponse = { url: oauthUrl, success: true }

    return new Response(
      JSON.stringify(responseBody),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error creating OAuth URL:', error)
    const responseBody: StripeLinkResponse = {
      success: false,
      error: error?.message || 'Unknown error',
    }
    return new Response(
      JSON.stringify(responseBody),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
