-- Create portfolio_settings table
CREATE TABLE public.portfolio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  artist_name TEXT,
  bio_short TEXT,
  bio_full TEXT,
  background_gradient TEXT DEFAULT 'gradient-cosmic',
  theme_colors JSONB DEFAULT '{}',
  layout_preferences JSONB DEFAULT '{"max_width": "400px"}',
  social_links JSONB DEFAULT '{}',
  section_order JSONB DEFAULT '["hero", "bio", "featured", "videos", "photos", "releases", "events"]',
  enabled_sections JSONB DEFAULT '{"hero": true, "bio": true, "featured": true, "videos": true, "photos": true, "releases": true, "events": true}',
  section_titles JSONB DEFAULT '{}',
  section_configs JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create portfolio_photos table
CREATE TABLE public.portfolio_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio_videos table
CREATE TABLE public.portfolio_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio_music_releases table
CREATE TABLE public.portfolio_music_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  release_date DATE,
  artwork_url TEXT,
  spotify_url TEXT,
  apple_music_url TEXT,
  youtube_url TEXT,
  bandcamp_url TEXT,
  soundcloud_url TEXT,
  other_links JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio_events table
CREATE TABLE public.portfolio_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  location TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  description TEXT,
  ticket_url TEXT,
  image_url TEXT,
  price_range TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio_featured_cards table
CREATE TABLE public.portfolio_featured_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Learn More',
  background_color TEXT,
  text_color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-images', 'portfolio-images', true);

-- Enable RLS on all portfolio tables
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_music_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_featured_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolio_settings
CREATE POLICY "Users can view their own portfolio settings" 
ON public.portfolio_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolio settings" 
ON public.portfolio_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio settings" 
ON public.portfolio_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio settings" 
ON public.portfolio_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_photos
CREATE POLICY "Users can view their own photos" 
ON public.portfolio_photos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own photos" 
ON public.portfolio_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos" 
ON public.portfolio_photos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" 
ON public.portfolio_photos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_videos
CREATE POLICY "Users can view their own videos" 
ON public.portfolio_videos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos" 
ON public.portfolio_videos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" 
ON public.portfolio_videos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" 
ON public.portfolio_videos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_music_releases
CREATE POLICY "Users can view their own music releases" 
ON public.portfolio_music_releases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own music releases" 
ON public.portfolio_music_releases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music releases" 
ON public.portfolio_music_releases 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music releases" 
ON public.portfolio_music_releases 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_events
CREATE POLICY "Users can view their own events" 
ON public.portfolio_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" 
ON public.portfolio_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.portfolio_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.portfolio_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_featured_cards
CREATE POLICY "Users can view their own featured cards" 
ON public.portfolio_featured_cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own featured cards" 
ON public.portfolio_featured_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own featured cards" 
ON public.portfolio_featured_cards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own featured cards" 
ON public.portfolio_featured_cards 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for portfolio-images bucket
CREATE POLICY "Portfolio images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'portfolio-images');

CREATE POLICY "Users can upload their own portfolio images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own portfolio images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own portfolio images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_portfolio_settings_updated_at
BEFORE UPDATE ON public.portfolio_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_photos_updated_at
BEFORE UPDATE ON public.portfolio_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_videos_updated_at
BEFORE UPDATE ON public.portfolio_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_music_releases_updated_at
BEFORE UPDATE ON public.portfolio_music_releases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_events_updated_at
BEFORE UPDATE ON public.portfolio_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_featured_cards_updated_at
BEFORE UPDATE ON public.portfolio_featured_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();