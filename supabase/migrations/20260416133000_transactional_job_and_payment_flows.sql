CREATE OR REPLACE FUNCTION public.accept_booking_request_transactional(
  p_request_id uuid,
  p_owner_id uuid,
  p_idempotency_key text
)
RETURNS TABLE (
  result_status text,
  job_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_request public.booking_requests%ROWTYPE;
  v_existing_job_id uuid;
  v_created_job_id uuid;
  v_start_time time := '09:00'::time;
  v_end_time time := '17:00'::time;
  v_end_date date;
  v_rate numeric := 0;
  v_status text := 'upcoming';
BEGIN
  SELECT *
  INTO v_request
  FROM public.booking_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_request.portfolio_user_id <> p_owner_id THEN
    RAISE EXCEPTION 'Booking request owner mismatch'
      USING ERRCODE = '42501';
  END IF;

  SELECT id
  INTO v_existing_job_id
  FROM public.jobs
  WHERE idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_job_id IS NOT NULL THEN
    IF v_request.status IS DISTINCT FROM 'accepted' THEN
      UPDATE public.booking_requests
      SET status = 'accepted',
          updated_at = now()
      WHERE id = v_request.id;
    END IF;

    RETURN QUERY
    SELECT 'already_used'::text, v_existing_job_id;
    RETURN;
  END IF;

  IF v_request.status IN ('accepted', 'declined') THEN
    RETURN QUERY
    SELECT 'already_used'::text, NULL::uuid;
    RETURN;
  END IF;

  v_start_time := COALESCE(v_request.event_start_time, v_start_time);
  v_end_time := COALESCE(v_request.event_end_time, v_end_time);
  v_end_date := COALESCE(v_request.event_end_date, v_request.event_date);
  v_rate := COALESCE(v_request.quoted_price, v_request.budget, 0);

  IF ((v_end_date + v_end_time) < (now() AT TIME ZONE current_setting('TIMEZONE'))) THEN
    v_status := 'past';
  END IF;

  INSERT INTO public.jobs (
    user_id,
    title,
    client,
    contact_name,
    contact_email,
    contact_phone,
    location,
    date,
    end_date,
    start_time,
    end_time,
    rate,
    status,
    pricing_mode,
    job_description,
    notes,
    idempotency_key
  )
  VALUES (
    p_owner_id,
    COALESCE(NULLIF(v_request.event_name, ''), 'Event for ' || v_request.requester_name),
    v_request.requester_name,
    v_request.requester_name,
    v_request.requester_email,
    NULLIF(v_request.phone, ''),
    COALESCE(v_request.location, ''),
    v_request.event_date,
    v_end_date,
    v_start_time,
    v_end_time,
    v_rate,
    v_status,
    'itemized',
    v_request.event_description,
    CASE
      WHEN NULLIF(v_request.special_requirements, '') IS NOT NULL
        THEN 'Special requirements: ' || v_request.special_requirements
      ELSE 'Created from accepted booking request'
    END,
    p_idempotency_key
  )
  RETURNING id INTO v_created_job_id;

  INSERT INTO public.job_items (
    job_id,
    item_name,
    unit_cost,
    quantity,
    is_taxable,
    sort_order
  )
  VALUES (
    v_created_job_id,
    'DJ Service',
    v_rate,
    1,
    true,
    0
  );

  UPDATE public.booking_requests
  SET status = 'accepted',
      updated_at = now()
  WHERE id = v_request.id;

  RETURN QUERY
  SELECT 'accepted'::text, v_created_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_job_with_items(
  p_job jsonb,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_payload jsonb := COALESCE(p_job, '{}'::jsonb);
  v_job_id uuid;
  v_job RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(COALESCE(p_items, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Job items payload must be an array'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_job
  FROM jsonb_to_record(v_payload) AS x(
    title text,
    client text,
    location text,
    date date,
    end_date date,
    start_time time,
    end_time time,
    rate numeric,
    status text,
    notes text,
    contact_email text,
    contact_phone text,
    job_number text,
    job_description text,
    contact_name text,
    client_id uuid,
    pricing_mode text,
    discount_percent numeric,
    idempotency_key text
  );

  IF v_job.title IS NULL
    OR v_job.client IS NULL
    OR v_job.location IS NULL
    OR v_job.date IS NULL
    OR v_job.start_time IS NULL
    OR v_job.end_time IS NULL
    OR v_job.rate IS NULL
    OR v_job.status IS NULL THEN
    RAISE EXCEPTION 'Missing required job fields'
      USING ERRCODE = '23502';
  END IF;

  INSERT INTO public.jobs (
    user_id,
    title,
    client,
    location,
    date,
    end_date,
    start_time,
    end_time,
    rate,
    status,
    notes,
    contact_email,
    contact_phone,
    job_number,
    job_description,
    contact_name,
    client_id,
    pricing_mode,
    discount_percent,
    idempotency_key
  )
  VALUES (
    v_user_id,
    v_job.title,
    v_job.client,
    v_job.location,
    v_job.date,
    v_job.end_date,
    v_job.start_time,
    v_job.end_time,
    v_job.rate,
    v_job.status,
    v_job.notes,
    v_job.contact_email,
    v_job.contact_phone,
    v_job.job_number,
    v_job.job_description,
    v_job.contact_name,
    v_job.client_id,
    v_job.pricing_mode,
    v_job.discount_percent,
    v_job.idempotency_key
  )
  RETURNING id INTO v_job_id;

  INSERT INTO public.job_items (
    job_id,
    item_name,
    unit_cost,
    quantity,
    discount_percent,
    is_taxable,
    sort_order
  )
  SELECT
    v_job_id,
    item_data.item_name,
    COALESCE(item_data.unit_cost, 0),
    COALESCE(item_data.quantity, 1),
    item_data.discount_percent,
    COALESCE(item_data.is_taxable, true),
    item_list.ordinality::int - 1
  FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) WITH ORDINALITY AS item_list(item, ordinality)
  CROSS JOIN LATERAL jsonb_to_record(item_list.item) AS item_data(
    item_name text,
    unit_cost numeric,
    quantity numeric,
    discount_percent numeric,
    is_taxable boolean
  )
  WHERE NULLIF(TRIM(COALESCE(item_data.item_name, '')), '') IS NOT NULL;

  RETURN v_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_job_with_items(
  p_job_id uuid,
  p_job_patch jsonb DEFAULT '{}'::jsonb,
  p_items jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_payload jsonb := COALESCE(p_job_patch, '{}'::jsonb);
  v_patch RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  IF p_items IS NOT NULL AND jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Job items payload must be an array'
      USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.jobs
  WHERE id = p_job_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO v_patch
  FROM jsonb_to_record(v_payload) AS x(
    title text,
    client text,
    location text,
    date date,
    end_date date,
    start_time time,
    end_time time,
    rate numeric,
    status text,
    notes text,
    contact_email text,
    contact_phone text,
    job_number text,
    job_description text,
    contact_name text,
    client_id uuid,
    pricing_mode text,
    discount_percent numeric,
    idempotency_key text
  );

  UPDATE public.jobs
  SET
    title = CASE WHEN v_payload ? 'title' THEN v_patch.title ELSE title END,
    client = CASE WHEN v_payload ? 'client' THEN v_patch.client ELSE client END,
    location = CASE WHEN v_payload ? 'location' THEN v_patch.location ELSE location END,
    date = CASE WHEN v_payload ? 'date' THEN v_patch.date ELSE date END,
    end_date = CASE WHEN v_payload ? 'end_date' THEN v_patch.end_date ELSE end_date END,
    start_time = CASE WHEN v_payload ? 'start_time' THEN v_patch.start_time ELSE start_time END,
    end_time = CASE WHEN v_payload ? 'end_time' THEN v_patch.end_time ELSE end_time END,
    rate = CASE WHEN v_payload ? 'rate' THEN v_patch.rate ELSE rate END,
    status = CASE WHEN v_payload ? 'status' THEN v_patch.status ELSE status END,
    notes = CASE WHEN v_payload ? 'notes' THEN v_patch.notes ELSE notes END,
    contact_email = CASE WHEN v_payload ? 'contact_email' THEN v_patch.contact_email ELSE contact_email END,
    contact_phone = CASE WHEN v_payload ? 'contact_phone' THEN v_patch.contact_phone ELSE contact_phone END,
    job_number = CASE WHEN v_payload ? 'job_number' THEN v_patch.job_number ELSE job_number END,
    job_description = CASE WHEN v_payload ? 'job_description' THEN v_patch.job_description ELSE job_description END,
    contact_name = CASE WHEN v_payload ? 'contact_name' THEN v_patch.contact_name ELSE contact_name END,
    client_id = CASE WHEN v_payload ? 'client_id' THEN v_patch.client_id ELSE client_id END,
    pricing_mode = CASE WHEN v_payload ? 'pricing_mode' THEN v_patch.pricing_mode ELSE pricing_mode END,
    discount_percent = CASE WHEN v_payload ? 'discount_percent' THEN v_patch.discount_percent ELSE discount_percent END,
    idempotency_key = CASE WHEN v_payload ? 'idempotency_key' THEN v_patch.idempotency_key ELSE idempotency_key END,
    updated_at = now()
  WHERE id = p_job_id
    AND user_id = v_user_id;

  IF p_items IS NOT NULL THEN
    DELETE FROM public.job_items
    WHERE job_id = p_job_id;

    INSERT INTO public.job_items (
      job_id,
      item_name,
      unit_cost,
      quantity,
      discount_percent,
      is_taxable,
      sort_order
    )
    SELECT
      p_job_id,
      item_data.item_name,
      COALESCE(item_data.unit_cost, 0),
      COALESCE(item_data.quantity, 1),
      item_data.discount_percent,
      COALESCE(item_data.is_taxable, true),
      item_list.ordinality::int - 1
    FROM jsonb_array_elements(p_items) WITH ORDINALITY AS item_list(item, ordinality)
    CROSS JOIN LATERAL jsonb_to_record(item_list.item) AS item_data(
      item_name text,
      unit_cost numeric,
      quantity numeric,
      discount_percent numeric,
      is_taxable boolean
    )
    WHERE NULLIF(TRIM(COALESCE(item_data.item_name, '')), '') IS NOT NULL;
  END IF;

  RETURN p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_invoice_payment_paid_once(
  p_invoice_payment_id uuid,
  p_payment_intent_id text
)
RETURNS TABLE (
  transitioned boolean,
  invoice_id uuid,
  job_id uuid,
  user_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_payment public.invoice_payments%ROWTYPE;
  v_invoice public.sent_invoices%ROWTYPE;
BEGIN
  SELECT *
  INTO v_payment
  FROM public.invoice_payments
  WHERE id = p_invoice_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice payment not found'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO v_invoice
  FROM public.sent_invoices
  WHERE id = v_payment.invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sent invoice not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_payment.status = 'paid' OR v_invoice.status = 'paid' THEN
    RETURN QUERY
    SELECT false, v_payment.invoice_id, v_invoice.job_id, v_payment.user_id;
    RETURN;
  END IF;

  UPDATE public.sent_invoices
  SET status = 'paid',
      updated_at = now()
  WHERE id = v_invoice.id;

  IF v_invoice.job_id IS NOT NULL THEN
    UPDATE public.jobs
    SET status = 'paid',
        updated_at = now()
    WHERE id = v_invoice.job_id
      AND user_id = v_payment.user_id;
  END IF;

  UPDATE public.invoice_payments
  SET status = 'paid',
      paid_at = COALESCE(paid_at, now()),
      stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, p_payment_intent_id),
      updated_at = now()
  WHERE id = v_payment.id;

  RETURN QUERY
  SELECT true, v_payment.invoice_id, v_invoice.job_id, v_payment.user_id;
END;
$$;
