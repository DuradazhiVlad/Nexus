-- Fix users table and related issues
-- Execute this script in Supabase Dashboard SQL Editor

-- First, let's check what tables exist and their structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'user_profiles', 'group_members', 'groups')
ORDER BY table_name, ordinal_position;

-- Check if users table exists and has the right structure
DO $$
BEGIN
    -- If users table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE public.users (
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
        ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
        
        -- Create indexes
        CREATE INDEX users_email_idx ON public.users USING btree (email);
        CREATE INDEX users_name_idx ON public.users USING btree (name);
        CREATE INDEX users_created_at_idx ON public.users USING btree (created_at);
        
        -- Enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
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
    END IF;
END $$;

-- Now let's check if we need to sync data between users and user_profiles
-- This will help if there are inconsistencies between the two tables
INSERT INTO public.users (id, email, name, lastname, avatar, bio, city, birthdate, created_at, notifications, privacy)
SELECT 
    up.auth_user_id as id,
    up.email,
    up.name,
    up.last_name as lastname,
    up.avatar,
    up.bio,
    up.city,
    up.birth_date as birthdate,
    up.created_at,
    up.notifications,
    up.privacy
FROM public.user_profiles up
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = up.auth_user_id
)
ON CONFLICT (id) DO NOTHING;

-- Update foreign key constraints to use the correct table
-- First, let's check what the current constraints are
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('group_members', 'groups')
    AND tc.constraint_type = 'FOREIGN KEY';

-- Now let's fix the foreign key constraints
-- We'll make group_members.user_id reference user_profiles.id instead of users.id
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- Add new constraints that reference user_profiles
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE groups 
ADD CONSTRAINT groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Verify the changes
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('group_members', 'groups')
    AND tc.constraint_type = 'FOREIGN KEY'; 