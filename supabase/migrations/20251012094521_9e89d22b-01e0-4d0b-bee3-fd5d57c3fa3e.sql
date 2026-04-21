-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to send booking request notification via edge function
CREATE OR REPLACE FUNCTION notify_booking_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  request_id bigint;
  service_role_key text;
BEGIN
  -- Get service role key from vault
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;
  
  -- Make async HTTP request to edge function using pg_net
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
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send booking notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on booking_requests table
CREATE TRIGGER on_booking_request_created
  AFTER INSERT ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_request();
