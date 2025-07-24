/*
  # Ensure users table structure matches requirements

  1. Drop existing table if needed and recreate with exact structure
  2. Add proper constraints and indexes
  3. Set up RLS policies
*/

-- First, ensure the table has the correct structure
-- Drop table if exists to recreate with exact structure
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Create the users table with exact structure as provided
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  lastname text NULL,
  avatar text NULL,
  bio text NULL,
  city text NULL,
  birthdate date NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  notifications jsonb NULL DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
  privacy jsonb NULL DEFAULT '{"showEmail": false, "showBirthDate": true, "profileVisibility": "public"}'::jsonb
);

-- Add foreign key constraint to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes as specified
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS users_name_idx ON public.users USING btree (name);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users USING btree (created_at);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;

-- Create new RLS policies that work with the structure
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Authenticated users can view all profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);