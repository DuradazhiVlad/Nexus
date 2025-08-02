-- Fix infinite recursion in group RLS policies
-- This script creates SECURITY DEFINER functions to break circular dependencies

-- Drop existing policies first
DROP POLICY IF EXISTS "Enable read access for group members" ON public.groups;
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

-- Create SECURITY DEFINER functions to bypass RLS for membership checks
CREATE OR REPLACE FUNCTION public.is_user_group_member(group_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = is_user_group_member.group_id 
    AND group_members.user_id = is_user_group_member.user_id
    AND group_members.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_group_role(group_id uuid, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.group_members 
    WHERE group_members.group_id = get_user_group_role.group_id 
    AND group_members.user_id = get_user_group_role.user_id
    AND group_members.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(group_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = is_group_creator.group_id 
    AND groups.created_by = is_group_creator.user_id
  );
END;
$$;

-- Create new RLS policies using the SECURITY DEFINER functions

-- Groups table policies
CREATE POLICY "Enable read access for all users" ON public.groups
FOR SELECT USING (
  is_public = true 
  OR public.is_user_group_member(id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
  OR public.is_group_creator(id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
);

CREATE POLICY "Enable insert for authenticated users" ON public.groups
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Enable update for group creators and admins" ON public.groups
FOR UPDATE USING (
  public.is_group_creator(id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
  OR public.get_user_group_role(id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())) = 'admin'
);

CREATE POLICY "Enable delete for group creators" ON public.groups
FOR DELETE USING (
  public.is_group_creator(id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
);

-- Group members table policies
CREATE POLICY "Enable read access for group members" ON public.group_members
FOR SELECT USING (
  public.is_user_group_member(group_id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
  OR public.is_group_creator(group_id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
);

CREATE POLICY "Enable insert for authenticated users" ON public.group_members
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Enable update for group admins and self" ON public.group_members
FOR UPDATE USING (
  public.get_user_group_role(group_id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())) = 'admin'
  OR user_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Enable delete for group admins and self" ON public.group_members
FOR DELETE USING (
  public.get_user_group_role(group_id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())) = 'admin'
  OR user_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
);

-- Group posts table policies
CREATE POLICY "Enable read access for group members" ON public.group_posts
FOR SELECT USING (
  public.is_user_group_member(group_id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
);

CREATE POLICY "Enable insert for group members" ON public.group_posts
FOR INSERT WITH CHECK (
  public.is_user_group_member(group_id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
);

CREATE POLICY "Enable update for post authors and group admins" ON public.group_posts
FOR UPDATE USING (
  author_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  OR public.get_user_group_role(group_id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())) = 'admin'
);

CREATE POLICY "Enable delete for post authors and group admins" ON public.group_posts
FOR DELETE USING (
  author_id = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  OR public.get_user_group_role(group_id, (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())) = 'admin'
);

-- Group post media table policies
CREATE POLICY "Enable read access for group members" ON public.group_post_media
FOR SELECT USING (
  public.is_user_group_member(
    (SELECT group_id FROM public.group_posts WHERE id = group_post_media.post_id), 
    (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Enable insert for group members" ON public.group_post_media
FOR INSERT WITH CHECK (
  public.is_user_group_member(
    (SELECT group_id FROM public.group_posts WHERE id = group_post_media.post_id), 
    (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Enable update for post authors and group admins" ON public.group_post_media
FOR UPDATE USING (
  (SELECT author_id FROM public.group_posts WHERE id = group_post_media.post_id) = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  OR public.get_user_group_role(
    (SELECT group_id FROM public.group_posts WHERE id = group_post_media.post_id), 
    (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  ) = 'admin'
);

CREATE POLICY "Enable delete for post authors and group admins" ON public.group_post_media
FOR DELETE USING (
  (SELECT author_id FROM public.group_posts WHERE id = group_post_media.post_id) = (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  OR public.get_user_group_role(
    (SELECT group_id FROM public.group_posts WHERE id = group_post_media.post_id), 
    (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid())
  ) = 'admin'
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_user_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_group_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO authenticated; 