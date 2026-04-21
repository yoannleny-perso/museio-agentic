-- Create user availability settings table
CREATE TABLE public.user_availability_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  buffer_time_minutes INTEGER NOT NULL DEFAULT 15,
  min_notice_hours INTEGER NOT NULL DEFAULT 24,
  enable_breaks BOOLEAN NOT NULL DEFAULT false,
  break_duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user vacation periods table
CREATE TABLE public.user_vacation_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vacation_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_availability_settings
CREATE POLICY "Users can view their own availability settings" 
ON public.user_availability_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability settings" 
ON public.user_availability_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability settings" 
ON public.user_availability_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability settings" 
ON public.user_availability_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_vacation_periods
CREATE POLICY "Users can view their own vacation periods" 
ON public.user_vacation_periods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vacation periods" 
ON public.user_vacation_periods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vacation periods" 
ON public.user_vacation_periods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vacation periods" 
ON public.user_vacation_periods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_availability_settings_updated_at
BEFORE UPDATE ON public.user_availability_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_vacation_periods_updated_at
BEFORE UPDATE ON public.user_vacation_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();