-- Create portfolio_videos table
CREATE TABLE public.portfolio_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio_events table  
CREATE TABLE public.portfolio_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  venue TEXT NOT NULL,
  location TEXT,
  ticket_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.portfolio_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolio_videos
CREATE POLICY "Public can view published videos" 
ON public.portfolio_videos 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM portfolio_settings
  WHERE ((portfolio_settings.user_id = portfolio_videos.user_id) AND (portfolio_settings.is_public = true))));

CREATE POLICY "Users can manage their own videos" 
ON public.portfolio_videos 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_events
CREATE POLICY "Public can view published events" 
ON public.portfolio_events 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM portfolio_settings
  WHERE ((portfolio_settings.user_id = portfolio_events.user_id) AND (portfolio_settings.is_public = true))));

CREATE POLICY "Users can manage their own events" 
ON public.portfolio_events 
FOR ALL 
USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_portfolio_videos_updated_at
BEFORE UPDATE ON public.portfolio_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_events_updated_at
BEFORE UPDATE ON public.portfolio_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();