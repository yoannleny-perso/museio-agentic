-- Create missing smart_links table
CREATE TABLE public.smart_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  thumbnail_url text,
  icon_url text,
  is_featured boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  display_order integer DEFAULT 0,
  click_count integer DEFAULT 0,
  badge_text text,
  badge_color text,
  custom_styling jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own smart links" 
ON public.smart_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own smart links" 
ON public.smart_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own smart links" 
ON public.smart_links 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own smart links" 
ON public.smart_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_smart_links_updated_at
  BEFORE UPDATE ON public.smart_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();