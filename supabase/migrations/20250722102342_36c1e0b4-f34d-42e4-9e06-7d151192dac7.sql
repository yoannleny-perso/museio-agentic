-- First, drop the existing constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_format_check;

-- Add username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'username'
    ) THEN
        -- Add username column
        ALTER TABLE public.profiles 
        ADD COLUMN username TEXT;
    END IF;
END $$;

-- Migrate existing nickname data to username format, handling empty values
UPDATE public.profiles 
SET username = CASE 
    WHEN nickname IS NOT NULL AND TRIM(nickname) != '' THEN 
        -- Convert to lowercase, replace spaces and special chars with empty string
        REGEXP_REPLACE(LOWER(TRIM(nickname)), '[^a-z0-9]', '', 'g')
    ELSE 
        -- Generate username from first part of email or fallback
        CASE 
            WHEN email IS NOT NULL THEN 
                REGEXP_REPLACE(LOWER(SPLIT_PART(email, '@', 1)), '[^a-z0-9]', '', 'g')
            ELSE 
                'user' || SUBSTRING(id::text, 1, 8)
        END
END
WHERE username IS NULL;

-- Fix any empty usernames that might have been created
UPDATE public.profiles 
SET username = 'user' || SUBSTRING(id::text, 1, 8)
WHERE username IS NULL OR TRIM(username) = '';

-- Handle potential duplicates by appending numbers
WITH duplicate_usernames AS (
    SELECT username, 
           ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at) as rn,
           id
    FROM public.profiles 
    WHERE username IS NOT NULL
),
updated_usernames AS (
    SELECT id,
           CASE 
               WHEN rn = 1 THEN username
               ELSE username || rn::text
           END as new_username
    FROM duplicate_usernames
    WHERE rn > 1
)
UPDATE public.profiles 
SET username = updated_usernames.new_username
FROM updated_usernames
WHERE profiles.id = updated_usernames.id;

-- Now add the constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (username IS NOT NULL AND username ~ '^[a-z0-9]+$' AND LENGTH(username) >= 1);

-- Create unique constraint on username
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS unique_username;
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_username UNIQUE (username);

-- Create index for performance
DROP INDEX IF EXISTS idx_profiles_username;
CREATE INDEX idx_profiles_username ON public.profiles(username);