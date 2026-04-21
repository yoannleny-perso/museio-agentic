CREATE TABLE IF NOT EXISTS public.booking_request_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  portfolio_user_id uuid NOT NULL,
  requester_email_hash text NULL,
  ip_hash text NULL,
  user_agent_hash text NULL,
  outcome text NOT NULL DEFAULT 'pending',
  rejection_reason text NULL,
  booking_request_id uuid NULL REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_request_attempts_outcome_check
    CHECK (
      outcome = ANY (
        ARRAY[
          'pending'::text,
          'accepted'::text,
          'duplicate'::text,
          'rate_limited'::text,
          'bot_rejected'::text,
          'invalid'::text,
          'failed'::text
        ]
      )
    )
);

CREATE INDEX IF NOT EXISTS booking_request_attempts_owner_created_idx
ON public.booking_request_attempts (portfolio_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS booking_request_attempts_email_created_idx
ON public.booking_request_attempts (portfolio_user_id, requester_email_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS booking_request_attempts_ip_created_idx
ON public.booking_request_attempts (portfolio_user_id, ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS booking_request_attempts_global_ip_created_idx
ON public.booking_request_attempts (ip_hash, created_at DESC);

ALTER TABLE public.booking_request_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_request_attempts FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reserve_booking_request_attempt(
  p_request_id uuid,
  p_portfolio_user_id uuid,
  p_requester_email_hash text,
  p_ip_hash text DEFAULT NULL,
  p_user_agent_hash text DEFAULT NULL
)
RETURNS TABLE (
  allowed boolean,
  rejection_reason text
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_email_attempt_count integer := 0;
  v_owner_attempt_count integer := 0;
  v_ip_owner_attempt_count integer := 0;
  v_ip_global_attempt_count integer := 0;
  v_reason text := null;
BEGIN
  SELECT count(*)
  INTO v_email_attempt_count
  FROM public.booking_request_attempts
  WHERE portfolio_user_id = p_portfolio_user_id
    AND requester_email_hash = p_requester_email_hash
    AND created_at >= now() - interval '10 minutes';

  SELECT count(*)
  INTO v_owner_attempt_count
  FROM public.booking_request_attempts
  WHERE portfolio_user_id = p_portfolio_user_id
    AND created_at >= now() - interval '10 minutes';

  IF p_ip_hash IS NOT NULL THEN
    SELECT count(*)
    INTO v_ip_owner_attempt_count
    FROM public.booking_request_attempts
    WHERE portfolio_user_id = p_portfolio_user_id
      AND ip_hash = p_ip_hash
      AND created_at >= now() - interval '10 minutes';

    SELECT count(*)
    INTO v_ip_global_attempt_count
    FROM public.booking_request_attempts
    WHERE ip_hash = p_ip_hash
      AND created_at >= now() - interval '10 minutes';
  END IF;

  IF v_email_attempt_count >= 4 THEN
    v_reason := 'email_limit_exceeded';
  ELSIF v_owner_attempt_count >= 25 THEN
    v_reason := 'portfolio_limit_exceeded';
  ELSIF p_ip_hash IS NOT NULL AND v_ip_owner_attempt_count >= 8 THEN
    v_reason := 'ip_limit_exceeded';
  ELSIF p_ip_hash IS NOT NULL AND v_ip_global_attempt_count >= 30 THEN
    v_reason := 'global_ip_limit_exceeded';
  END IF;

  INSERT INTO public.booking_request_attempts (
    request_id,
    portfolio_user_id,
    requester_email_hash,
    ip_hash,
    user_agent_hash,
    outcome,
    rejection_reason
  )
  VALUES (
    p_request_id,
    p_portfolio_user_id,
    p_requester_email_hash,
    p_ip_hash,
    p_user_agent_hash,
    CASE WHEN v_reason IS NULL THEN 'pending' ELSE 'rate_limited' END,
    v_reason
  )
  ON CONFLICT (request_id) DO NOTHING;

  RETURN QUERY
  SELECT v_reason IS NULL, v_reason;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_booking_request_attempt(
  p_request_id uuid,
  p_outcome text,
  p_rejection_reason text DEFAULT NULL,
  p_booking_request_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.booking_request_attempts
  SET
    outcome = p_outcome,
    rejection_reason = COALESCE(p_rejection_reason, rejection_reason),
    booking_request_id = COALESCE(p_booking_request_id, booking_request_id),
    updated_at = now()
  WHERE request_id = p_request_id;
END;
$$;
