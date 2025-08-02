-- Create Groups Tables Structure
-- Run this in your Supabase SQL Editor

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS group_post_media CASCADE;
DROP TABLE IF EXISTS group_posts CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- 2. Create groups table
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar text,
  cover_image text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT true,
  member_count integer DEFAULT 0,
  post_count integer DEFAULT 0,
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 3. Create group_members table
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT group_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT group_members_unique UNIQUE (group_id, user_id)
);

-- 4. Create group_posts table
CREATE TABLE public.group_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('photo', 'video', 'document')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  CONSTRAINT group_posts_pkey PRIMARY KEY (id),
  CONSTRAINT group_posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT group_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 5. Create group_post_media table
CREATE TABLE public.group_post_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  filename text,
  file_size integer,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT group_post_media_pkey PRIMARY KEY (id),
  CONSTRAINT group_post_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES group_posts(id) ON DELETE CASCADE
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS groups_created_by_idx ON groups(created_by);
CREATE INDEX IF NOT EXISTS groups_created_at_idx ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS groups_is_public_idx ON groups(is_public);

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_role_idx ON group_members(role);
CREATE INDEX IF NOT EXISTS group_members_joined_at_idx ON group_members(joined_at DESC);

CREATE INDEX IF NOT EXISTS group_posts_group_id_idx ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS group_posts_author_id_idx ON group_posts(author_id);
CREATE INDEX IF NOT EXISTS group_posts_created_at_idx ON group_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS group_posts_is_pinned_idx ON group_posts(is_pinned);

CREATE INDEX IF NOT EXISTS group_post_media_post_id_idx ON group_post_media(post_id);
CREATE INDEX IF NOT EXISTS group_post_media_type_idx ON group_post_media(type);

-- 7. Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_media ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for groups
-- View groups (public groups or if user is member)
CREATE POLICY "Users can view public groups or groups they are members of" ON groups
FOR SELECT TO authenticated
USING (
  is_public = true OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  )
);

-- Create groups (any authenticated user)
CREATE POLICY "Authenticated users can create groups" ON groups
FOR INSERT TO authenticated
WITH CHECK (
  created_by IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  )
);

-- Update groups (only group creator or admins)
CREATE POLICY "Group creators and admins can update groups" ON groups
FOR UPDATE TO authenticated
USING (
  created_by IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    AND group_members.role IN ('admin')
  )
);

-- Delete groups (only group creator)
CREATE POLICY "Only group creators can delete groups" ON groups
FOR DELETE TO authenticated
USING (
  created_by IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  )
);

-- 9. Create RLS policies for group_members
-- View members (if user is member of the group)
CREATE POLICY "Group members can view other members" ON group_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_members.group_id
    AND gm2.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  )
);

-- Join groups (any authenticated user can join public groups)
CREATE POLICY "Users can join public groups" ON group_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = group_members.group_id 
    AND groups.is_public = true
  )
);

-- Leave groups (users can leave groups they are members of)
CREATE POLICY "Users can leave groups they are members of" ON group_members
FOR DELETE TO authenticated
USING (
  user_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  )
);

-- Update member roles (only group creators and admins)
CREATE POLICY "Group creators and admins can update member roles" ON group_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id
    AND (
      g.created_by IN (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_id IN (
          SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
        AND gm.role IN ('admin')
      )
    )
  )
);

-- 10. Create RLS policies for group_posts
-- View posts (if user is member of the group)
CREATE POLICY "Group members can view posts" ON group_posts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_posts.group_id
    AND group_members.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  )
);

-- Create posts (group members can create posts)
CREATE POLICY "Group members can create posts" ON group_posts
FOR INSERT TO authenticated
WITH CHECK (
  author_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_posts.group_id
    AND group_members.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  )
);

-- Update posts (only post author, group creators, and admins)
CREATE POLICY "Post authors, group creators, and admins can update posts" ON group_posts
FOR UPDATE TO authenticated
USING (
  author_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_posts.group_id
    AND g.created_by IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  ) OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_posts.group_id
    AND group_members.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    AND group_members.role IN ('admin', 'moderator')
  )
);

-- Delete posts (only post author, group creators, and admins)
CREATE POLICY "Post authors, group creators, and admins can delete posts" ON group_posts
FOR DELETE TO authenticated
USING (
  author_id IN (
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_posts.group_id
    AND g.created_by IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  ) OR
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = group_posts.group_id
    AND group_members.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
    AND group_members.role IN ('admin', 'moderator')
  )
);

-- 11. Create RLS policies for group_post_media
-- View media (same as posts)
CREATE POLICY "Group members can view post media" ON group_post_media
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_posts gp
    JOIN group_members gm ON gm.group_id = gp.group_id
    WHERE gp.id = group_post_media.post_id
    AND gm.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  )
);

-- Create media (same as posts)
CREATE POLICY "Group members can create post media" ON group_post_media
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_posts gp
    JOIN group_members gm ON gm.group_id = gp.group_id
    WHERE gp.id = group_post_media.post_id
    AND gm.user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  )
);

-- Update media (same as posts)
CREATE POLICY "Post authors, group creators, and admins can update media" ON group_post_media
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_posts gp
    WHERE gp.id = group_post_media.post_id
    AND (
      gp.author_id IN (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = gp.group_id
        AND g.created_by IN (
          SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
      ) OR
      EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = gp.group_id
        AND gm.user_id IN (
          SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
        AND gm.role IN ('admin', 'moderator')
      )
    )
  )
);

-- Delete media (same as posts)
CREATE POLICY "Post authors, group creators, and admins can delete media" ON group_post_media
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_posts gp
    WHERE gp.id = group_post_media.post_id
    AND (
      gp.author_id IN (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = gp.group_id
        AND g.created_by IN (
          SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
      ) OR
      EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = gp.group_id
        AND gm.user_id IN (
          SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
        AND gm.role IN ('admin', 'moderator')
      )
    )
  )
);

-- 12. Create functions for updating counts
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups 
    SET member_count = member_count - 1 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_group_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups 
    SET post_count = post_count + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups 
    SET post_count = post_count - 1 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers for automatic count updates
CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

CREATE TRIGGER update_group_post_count_trigger
  AFTER INSERT OR DELETE ON group_posts
  FOR EACH ROW EXECUTE FUNCTION update_group_post_count();

-- 14. Create function to update group updated_at
CREATE OR REPLACE FUNCTION update_group_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_updated_at_trigger
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_group_updated_at();

-- 15. Verify everything was created correctly
SELECT 'Groups table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;

SELECT 'Group members table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'group_members'
ORDER BY ordinal_position;

SELECT 'Group posts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'group_posts'
ORDER BY ordinal_position;

SELECT 'Group post media table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'group_post_media'
ORDER BY ordinal_position;

SELECT 'Foreign key constraints:' as info;
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('groups', 'group_members', 'group_posts', 'group_post_media'); 