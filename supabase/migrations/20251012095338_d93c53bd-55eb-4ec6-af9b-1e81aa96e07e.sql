-- Grant execute permission on vault decryption function to postgres role
GRANT EXECUTE ON FUNCTION vault._crypto_aead_det_decrypt TO postgres;

-- Create or replace the trigger function with enhanced logging
CREATE OR REPLACE FUNCTION public.notify_booking_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  request_id bigint;
  service_role_key text;
BEGIN
  -- Log start of function
  RAISE LOG 'notify_booking_request: Starting for booking ID %', NEW.id;
  
  -- Get service role key from vault
  BEGIN
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    LIMIT 1;
    
    IF service_role_key IS NULL THEN
      RAISE WARNING 'notify_booking_request: Service role key not found in vault';
      RETURN NEW;
    END IF;
    
    RAISE LOG 'notify_booking_request: Successfully retrieved service role key';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'notify_booking_request: Error accessing vault: %', SQLERRM;
      RETURN NEW;
  END;
  
  -- Make async HTTP request to edge function using pg_net
  BEGIN
    SELECT INTO request_id net.http_post(
      url := 'https://qsdfsycxaucxpbomjijg.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'userId', NEW.portfolio_user_id,
        'title', '🎵 New Booking Request',
        'body', NEW.requester_name || ' wants to book you for ' || NEW.event_name,
        'data', jsonb_build_object(
          'type', 'booking_request',
          'bookingRequestId', NEW.id,
          'eventName', NEW.event_name,
          'eventDate', NEW.event_date
        )
      )
    );
    
    RAISE LOG 'notify_booking_request: HTTP request queued with ID %', request_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'notify_booking_request: Error making HTTP request: %', SQLERRM;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'notify_booking_request: Unexpected error: %', SQLERRM;
    RETURN NEW;
END;
$$;
