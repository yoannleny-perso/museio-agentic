import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { z } from 'npm:zod@3.23.8'
import type {
  StripeOAuthCallbackRequest,
  StripeOAuthCallbackResponse,
} from '../../../src/contracts/stripe.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripeOAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing Stripe OAuth callback')

    const { code, state } = stripeOAuthCallbackSchema.parse(
      await req.json()
    ) as StripeOAuthCallbackRequest

    const userId = state

    // Initialize Supabase client FIRST
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // CHECK IF ALREADY CONNECTED (idempotency)
    console.log('Checking if user already has Stripe account:', userId)
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_completed')
      .eq('id', userId)
      .single()

    if (existingProfile?.stripe_account_id) {
      console.log('User already connected to Stripe account:', existingProfile.stripe_account_id)
      const responseBody: StripeOAuthCallbackResponse = {
        success: true,
        already_connected: true,
        account_id: existingProfile.stripe_account_id,
        onboarding_completed: existingProfile.stripe_onboarding_completed,
      }

      return new Response(
        JSON.stringify(responseBody),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    })

    // Exchange authorization code for access token
    console.log('Exchanging authorization code for access token')
    let response
    try {
      response = await stripe.oauth.token({
        grant_type: 'authorization_code',
        code,
      })
    } catch (stripeError) {
      // If code already used, check if we saved it previously
      if (stripeError.type === 'StripeInvalidGrantError') {
        console.log('Authorization code already used, rechecking database...')
        const { data: recheckProfile } = await supabaseClient
          .from('profiles')
          .select('stripe_account_id, stripe_onboarding_completed')
          .eq('id', userId)
          .single()

        if (recheckProfile?.stripe_account_id) {
          console.log('Found saved account after code reuse:', recheckProfile.stripe_account_id)
          const responseBody: StripeOAuthCallbackResponse = {
            success: true,
            already_connected: true,
            account_id: recheckProfile.stripe_account_id,
            onboarding_completed: recheckProfile.stripe_onboarding_completed,
          }

          return new Response(
            JSON.stringify(responseBody),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }
      }
      throw stripeError
    }

    const stripeUserId = response.stripe_user_id
    console.log('Stripe account connected:', stripeUserId)

    // Get account details to check status
    const account = await stripe.accounts.retrieve(stripeUserId)
    console.log('Account details retrieved:', {
      id: account.id,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
    })

    // Update user profile with Stripe account ID
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        stripe_account_id: stripeUserId,
        stripe_onboarding_completed: account.details_submitted && account.charges_enabled,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error('Failed to save Stripe account information')
    }

    console.log('Profile updated successfully')

    const responseBody: StripeOAuthCallbackResponse = {
      success: true,
      account_id: stripeUserId,
      onboarding_completed: account.details_submitted && account.charges_enabled,
    }

    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    
    let errorMessage = error.message || 'Unknown error occurred'
    let status = 400

    if (error.type === 'StripeInvalidGrantError') {
      errorMessage = 'Invalid or expired authorization code'
      status = 400
    }

    const responseBody: StripeOAuthCallbackResponse = {
      error: errorMessage,
      success: false,
    }

    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    )
  }
})
