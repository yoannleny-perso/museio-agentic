
-- Enforce idempotency for job creation attempts
-- Multiple NULL idempotency_key rows remain allowed; only non-NULL keys must be unique
CREATE UNIQUE INDEX IF NOT EXISTS jobs_idempotency_key_unique
ON public.jobs (idempotency_key)
WHERE idempotency_key IS NOT NULL;
