/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `auth_user_id` (uuid, references auth.users, unique)
      - `name` (text, not null)
      - `lastName` (text, not null) 
      - `email` (text, unique, not null)
      - `avatar` (text, nullable)
      - `bio` (text, nullable)
      - `city` (text, nullable)
      - `birthDate` (date, nullable)
      - `date` (timestamp with time zone, default now)
      - `notifications` (jsonb, default empty object)
      - `privacy` (jsonb, default empty object)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to view their own profile
    - Add policy for users to update their own profile  
    - Add policy for users to insert their own profile
    - Add policy for authenticated users to view all profiles (for People/Friends features)
*/

-- Enable the uuid-ossp extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  bio TEXT,
  city TEXT,
  birthDate DATE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notifications JSONB DEFAULT '{}'::jsonb,
  privacy JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS) on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth_user_id = auth.uid());

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Policy to allow users to insert their own profile upon registration
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- Policy to allow authenticated users to view all other users' profiles (for features like 'People' and 'Friends')
CREATE POLICY "Authenticated users can view all profiles"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');