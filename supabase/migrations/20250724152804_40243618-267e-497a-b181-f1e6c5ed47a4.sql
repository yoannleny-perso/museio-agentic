-- Create table for user availability repeat settings
CREATE TABLE public.user_availability_repeat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  repeat_enabled BOOLEAN NOT NULL DEFAULT false,
  repeat_duration TEXT NOT NULL DEFAULT 'forever',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable Row Level Security
ALTER TABLE public.user_availability_repeat_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own repeat settings" 
ON public.user_availability_repeat_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own repeat settings" 
ON public.user_availability_repeat_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repeat settings" 
ON public.user_availability_repeat_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repeat settings" 
ON public.user_availability_repeat_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_availability_repeat_settings_updated_at
BEFORE UPDATE ON public.user_availability_repeat_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();