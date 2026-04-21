import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get user profile with Stripe account ID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          has_account: false,
          onboarding_completed: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    
    console.log('=== STRIPE ACCOUNT DEBUG ===')
    console.log('Account ID:', account.id)
    console.log('Details submitted:', account.details_submitted)
    console.log('Charges enabled:', account.charges_enabled)
    console.log('Payouts enabled:', account.payouts_enabled)
    console.log('Currently due requirements:', account.requirements?.currently_due)
    console.log('Eventually due requirements:', account.requirements?.eventually_due)
    console.log('Past due requirements:', account.requirements?.past_due)
    console.log('Account type:', account.type)
    console.log('Account capabilities:', account.capabilities)
    
    // Check if onboarding is complete
    const onboardingCompleted = 
      account.details_submitted && 
      account.charges_enabled && 
      account.payouts_enabled &&
      (!account.requirements?.currently_due?.length || account.requirements.currently_due.length === 0)
    
    console.log('Calculated onboarding completed:', onboardingCompleted)
    console.log('Current DB onboarding status:', profile.stripe_onboarding_completed)

    // Update the profile if onboarding status has changed
    if (onboardingCompleted !== profile.stripe_onboarding_completed) {
      console.log('Onboarding status changed, updating database...')
      const { data: updateData, error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          stripe_onboarding_completed: onboardingCompleted,
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Failed to update profile:', updateError)
      } else {
        console.log('Successfully updated profile onboarding status to:', onboardingCompleted)
      }
    } else {
      console.log('No change in onboarding status, skipping database update')
    }

    return new Response(
      JSON.stringify({
        has_account: true,
        account_id: profile.stripe_account_id,
        onboarding_completed: onboardingCompleted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || [],
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error checking Stripe account status:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        has_account: false,
        onboarding_completed: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
