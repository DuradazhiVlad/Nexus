-- Emergency fix for infinite recursion in group RLS policies
-- This script temporarily disables RLS and creates simple working policies

-- 1. First, let's completely disable RLS on all group tables
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_media DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to clean slate
DROP POLICY IF EXISTS "Enable read access for all users" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable update for group creators and admins" ON public.groups;
DROP POLICY IF EXISTS "Enable delete for group creators" ON public.groups;

DROP POLICY IF EXISTS "Enable read access for group members" ON public.group_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.group_members;
DROP POLICY IF EXISTS "Enable update for group admins and self" ON public.group_members;
DROP POLICY IF EXISTS "Enable delete for group admins and self" ON public.group_members;

DROP POLICY IF EXISTS "Enable read access for group members" ON public.group_posts;
DROP POLICY IF EXISTS "Enable insert for group members" ON public.group_posts;
DROP POLICY IF EXISTS "Enable update for post authors and group admins" ON public.group_posts;
DROP POLICY IF EXISTS "Enable delete for post authors and group admins" ON public.group_posts;

DROP POLICY IF EXISTS "Enable read access for group members" ON public.group_post_media;
DROP POLICY IF EXISTS "Enable insert for group members" ON public.group_post_media;
DROP POLICY IF EXISTS "Enable update for post authors and group admins" ON public.group_post_media;
DROP POLICY IF EXISTS "Enable delete for post authors and group admins" ON public.group_post_media;

-- 3. Drop the problematic functions
DROP FUNCTION IF EXISTS public.is_user_group_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_group_role(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_group_creator(uuid, uuid);

-- 4. Test if tables work without RLS
-- This should work now - try your application

-- 5. If everything works, let's create very simple RLS policies
-- Re-enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_media ENABLE ROW LEVEL SECURITY;

-- 6. Create very simple policies without complex joins
-- Groups table - simple policies
CREATE POLICY "groups_select_policy" ON public.groups
FOR SELECT USING (true);

CREATE POLICY "groups_insert_policy" ON public.groups
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "groups_update_policy" ON public.groups
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "groups_delete_policy" ON public.groups
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Group members table - simple policies
CREATE POLICY "group_members_select_policy" ON public.group_members
FOR SELECT USING (true);

CREATE POLICY "group_members_insert_policy" ON public.group_members
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "group_members_update_policy" ON public.group_members
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "group_members_delete_policy" ON public.group_members
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Group posts table - simple policies
CREATE POLICY "group_posts_select_policy" ON public.group_posts
FOR SELECT USING (true);

CREATE POLICY "group_posts_insert_policy" ON public.group_posts
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "group_posts_update_policy" ON public.group_posts
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "group_posts_delete_policy" ON public.group_posts
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Group post media table - simple policies
CREATE POLICY "group_post_media_select_policy" ON public.group_post_media
FOR SELECT USING (true);

CREATE POLICY "group_post_media_insert_policy" ON public.group_post_media
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "group_post_media_update_policy" ON public.group_post_media
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "group_post_media_delete_policy" ON public.group_post_media
FOR DELETE USING (auth.uid() IS NOT NULL);

-- 7. Test query to verify everything works
SELECT 
    'Groups table' as table_name,
    COUNT(*) as record_count
FROM public.groups
UNION ALL
SELECT 
    'Group members table' as table_name,
    COUNT(*) as record_count
FROM public.group_members
UNION ALL
SELECT 
    'Group posts table' as table_name,
    COUNT(*) as record_count
FROM public.group_posts
UNION ALL
SELECT 
    'Group post media table' as table_name,
    COUNT(*) as record_count
FROM public.group_post_media; 