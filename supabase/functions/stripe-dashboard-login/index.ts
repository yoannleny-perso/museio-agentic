import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import type { StripeLinkResponse } from '../../../src/contracts/stripe.ts'

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
    console.log('Creating Stripe Connect dashboard login link')

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
      console.error('Authentication error:', userError)
      throw new Error('Unauthorized')
    }
    console.log('User authenticated:', user.id)

    // Get user's profile to find their Stripe account ID
    console.log('Querying profile for user:', user.id)
    
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, id')
      .eq('id', user.id)
      .single()

    console.log('Profile query result:', {
      data: profile,
      error: profileError,
      hasData: !!profile,
      hasAccountId: !!profile?.stripe_account_id
    })

    if (profileError) {
      console.error('Profile database error:', profileError)
      if (profileError.code === 'PGRST116') {
        throw new Error('Profile not found. Please contact support.')
      }
      throw new Error(`Database error: ${profileError.message}`)
    }

    if (!profile?.stripe_account_id) {
      console.error('No stripe_account_id found in profile:', profile)
      throw new Error('No Stripe account found. Please complete your Stripe Connect setup in bank details.')
    }

    const accountId = profile.stripe_account_id
    console.log('Found Stripe account ID:', accountId)

    // Verify account exists and get its status
    try {
      const account = await stripe.accounts.retrieve(accountId)
      console.log('Account status:', {
        id: account.id,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        type: account.type
      })

      // Check if account is ready for dashboard access
      if (!account.details_submitted) {
        throw new Error('Account setup is not complete. Please finish your Stripe onboarding first.')
      }

    } catch (accountError) {
      console.error('Error retrieving Stripe account:', accountError)
      throw new Error(`Invalid or non-existent Stripe account: ${accountId}`)
    }

    // Create login link for the Connect account
    console.log('Creating login link for account:', accountId)
    
    const loginLink = await stripe.accounts.createLoginLink(accountId)
    
    console.log('Login link created successfully:', {
      url: loginLink.url,
      created: loginLink.created
    })

    const responseBody: StripeLinkResponse = {
      success: true,
      url: loginLink.url,
    }

    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating login link:', error)
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Check if it's a Stripe error
    if (error.type) {
      console.error('Stripe error type:', error.type)
      console.error('Stripe error code:', error.code)
      console.error('Stripe error param:', error.param)
    }
    
    // Determine appropriate status code and message
    let status = 400
    let errorMessage = error.message || 'Unknown error occurred'
    
    if (errorMessage.includes('Unauthorized')) {
      status = 401
    } else if (errorMessage.includes('not complete') || errorMessage.includes('onboarding')) {
      status = 422
      errorMessage = `Account setup incomplete: ${errorMessage}`
    } else if (errorMessage.includes('No Stripe account found')) {
      status = 404
    }
    
    const errorResponse: StripeLinkResponse = {
      success: false,
      error: errorMessage,
    }
    
    console.error('Returning error response:', JSON.stringify(errorResponse))
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    )
  }
})
