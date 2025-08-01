/*
  # Create groups functionality

  1. New Tables
    - groups
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - avatar (text)
      - created_by (uuid, foreign key to users)
      - created_at (timestamp)
      - privacy (text: 'public', 'private')
      - member_count (integer)
    
    - group_members
      - id (uuid, primary key)
      - group_id (uuid, foreign key to groups)
      - user_id (uuid, foreign key to users)
      - role (text: 'admin', 'member')
      - joined_at (timestamp)
    
    - group_posts
      - id (uuid, primary key)
      - group_id (uuid, foreign key to groups)
      - user_id (uuid, foreign key to users)
      - content (text)
      - media_url (text)
      - media_type (text: 'photo', 'video', 'text')
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for group access and content management
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  avatar text,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  privacy text DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  member_count integer DEFAULT 1
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_posts table
CREATE TABLE IF NOT EXISTS group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text DEFAULT '',
  media_url text,
  media_type text CHECK (media_type IN ('photo', 'video', 'text')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view public groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    privacy = 'public' OR
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Group admins can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email' AND gm.role = 'admin'
    )
  );

-- Group members policies
CREATE POLICY "Users can view group members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE privacy = 'public'
    ) OR
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Group admins can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email' AND gm.role = 'admin'
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

-- Group posts policies
CREATE POLICY "Users can view group posts"
  ON group_posts
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE privacy = 'public'
    ) OR
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Group members can create posts"
  ON group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email') AND
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can manage their own posts"
  ON group_posts
  FOR ALL
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_privacy ON groups(privacy);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON group_posts(created_at DESC);

-- Function to update member count
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

-- Create trigger for member count
DROP TRIGGER IF EXISTS trigger_update_member_count ON group_members;
CREATE TRIGGER trigger_update_member_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();