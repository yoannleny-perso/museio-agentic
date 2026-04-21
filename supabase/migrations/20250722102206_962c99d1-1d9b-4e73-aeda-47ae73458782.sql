-- Check if username column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public' 
AND column_name = 'username';

-- If not, add it properly
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
        
        -- Create unique constraint on username
        ALTER TABLE public.profiles 
        ADD CONSTRAINT unique_username UNIQUE (username);
        
        -- Create index for performance
        CREATE INDEX idx_profiles_username ON public.profiles(username);
        
        -- Add check constraint for username format (lowercase alphanumeric only)
        ALTER TABLE public.profiles 
        ADD CONSTRAINT username_format_check 
        CHECK (username IS NULL OR username ~ '^[a-z0-9]+$');
        
        -- Migrate existing nickname data to username format
        UPDATE public.profiles 
        SET username = CASE 
            WHEN nickname IS NOT NULL THEN 
                -- Convert to lowercase, replace spaces and special chars with empty string
                REGEXP_REPLACE(LOWER(nickname), '[^a-z0-9]', '', 'g')
            ELSE NULL
        END
        WHERE nickname IS NOT NULL;
        
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
        
        -- Clean up any empty usernames
        UPDATE public.profiles 
        SET username = 'user' || SUBSTRING(id::text, 1, 8)
        WHERE username IS NULL OR username = '';
    END IF;
END $$;