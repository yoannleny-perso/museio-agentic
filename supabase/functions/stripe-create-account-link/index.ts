import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { z } from 'npm:zod@3.23.8'
import {
  DEFAULT_APP_ORIGIN,
  buildAbsoluteUrl,
  buildStripeCallbackRoute,
} from '../../../src/contracts/routes.ts'
import type {
  StripeCreateAccountLinkRequest,
  StripeLinkResponse,
} from '../../../src/contracts/stripe.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripeCreateAccountLinkSchema = z.object({
  account_id: z.string().min(1),
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { account_id } = stripeCreateAccountLinkSchema.parse(
      await req.json()
    ) as StripeCreateAccountLinkRequest

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the session
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Determine return URLs - always use web URLs for Stripe API
    const origin = req.headers.get('origin') || 'http://localhost:8082'
    const isCapacitorOrigin = origin.startsWith('capacitor://') || origin.startsWith('ionic://')
    
    // If origin is from native app, use the web URL instead
    const baseUrl = isCapacitorOrigin ||
      !/^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)
      ? DEFAULT_APP_ORIGIN
      : origin
    
    // Always use web URLs for Stripe (the StripeCallback page handles native redirects)
    const refreshUrl = buildAbsoluteUrl(
      buildStripeCallbackRoute({ stripe_refresh: true }),
      baseUrl
    )
    const returnUrl = buildAbsoluteUrl(
      buildStripeCallbackRoute({ stripe_return: true }),
      baseUrl
    )
    
    console.log('Creating Account Link for account:', account_id)
    console.log('Refresh URL:', refreshUrl)
    console.log('Return URL:', returnUrl)
    
    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account_id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
      collection_options: {
        fields: 'eventually_due',
      },
    })

    console.log('Account Link created successfully:', accountLink.url)

    const responseBody: StripeLinkResponse = {
      url: accountLink.url,
      success: true,
    }

    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating account link:', error)
    const responseBody: StripeLinkResponse = {
      error: error.message,
      success: false,
    }
    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
