-- Create usage_logs table to track user generations
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS usage_logs_user_id_idx ON public.usage_logs(user_id);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS usage_logs_timestamp_idx ON public.usage_logs(timestamp);

-- RLS Policies

-- Enable RLS on the usage_logs table
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own usage logs
CREATE POLICY "Users can insert their own usage logs"
  ON public.usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own usage logs
CREATE POLICY "Users can view their own usage logs"
  ON public.usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to count daily usage
CREATE OR REPLACE FUNCTION public.get_daily_usage(user_uuid UUID, day DATE)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.usage_logs
  WHERE 
    user_id = user_uuid AND 
    timestamp::DATE = day;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create a function to check if a user has reached their daily limit
CREATE OR REPLACE FUNCTION public.has_reached_daily_limit(user_uuid UUID, limit_count INTEGER)
RETURNS BOOLEAN AS $$
  SELECT (
    SELECT COUNT(*)
    FROM public.usage_logs
    WHERE 
      user_id = user_uuid AND 
      timestamp::DATE = CURRENT_DATE
  ) >= limit_count;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Cleanup function to delete old anonymous users (can be scheduled with pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_users()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find anonymous users older than 30 days with no activity
  FOR user_record IN 
    SELECT u.id
    FROM auth.users u
    LEFT JOIN public.usage_logs l ON u.id = l.user_id AND l.timestamp > NOW() - INTERVAL '30 days'
    WHERE 
      u.raw_user_meta_data->>'is_anonymous' = 'true'
      AND u.created_at < NOW() - INTERVAL '30 days'
      AND l.id IS NULL
  LOOP
    -- Delete the user
    DELETE FROM auth.users WHERE id = user_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 