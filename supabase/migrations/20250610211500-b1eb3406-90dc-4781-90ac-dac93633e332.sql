
-- Create users table for storing user data
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id bigint NOT NULL UNIQUE,
  username text,
  first_name text,
  last_name text,
  language_code text DEFAULT 'en',
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_subscriptions table for tracking channel subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  is_subscribed boolean DEFAULT false,
  checked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create horoscope_requests table for tracking daily horoscope requests
CREATE TABLE public.horoscope_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  zodiac_sign text NOT NULL,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  response text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, request_date)
);

-- Create fortune_requests table for tracking daily fortune cookie requests
CREATE TABLE public.fortune_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  response text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, request_date)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horoscope_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fortune_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" 
  ON public.users 
  FOR SELECT 
  USING (telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id');

CREATE POLICY "Users can update their own data" 
  ON public.users 
  FOR UPDATE 
  USING (telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id');

CREATE POLICY "Users can insert their own data" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id');

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.user_subscriptions 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.users WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'));

CREATE POLICY "Users can manage their own subscriptions" 
  ON public.user_subscriptions 
  FOR ALL 
  USING (user_id IN (SELECT id FROM public.users WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'));

-- Create RLS policies for horoscope_requests
CREATE POLICY "Users can view their own horoscope requests" 
  ON public.horoscope_requests 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.users WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'));

CREATE POLICY "Users can manage their own horoscope requests" 
  ON public.horoscope_requests 
  FOR ALL 
  USING (user_id IN (SELECT id FROM public.users WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'));

-- Create RLS policies for fortune_requests
CREATE POLICY "Users can view their own fortune requests" 
  ON public.fortune_requests 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.users WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'));

CREATE POLICY "Users can manage their own fortune requests" 
  ON public.fortune_requests 
  FOR ALL 
  USING (user_id IN (SELECT id FROM public.users WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
