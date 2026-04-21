UPDATE public.booking_requests
SET status = CASE
  WHEN status = 'quote accepted' THEN 'accepted'
  WHEN status = 'quote rejected' THEN 'declined'
  ELSE status
END
WHERE status IN ('quote accepted', 'quote rejected');

ALTER TABLE public.booking_requests
DROP CONSTRAINT IF EXISTS booking_requests_status_check;

ALTER TABLE public.booking_requests
ADD CONSTRAINT booking_requests_status_check
CHECK (
  status = ANY (
    ARRAY[
      'pending'::text,
      'quoted'::text,
      'declined'::text,
      'accepted'::text
    ]
  )
);
