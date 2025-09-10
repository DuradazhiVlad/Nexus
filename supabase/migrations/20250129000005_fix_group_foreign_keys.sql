-- Виправлення foreign key relationships для груп

-- Спочатку видаляємо існуючі foreign key constraints якщо вони є
ALTER TABLE IF EXISTS group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE IF EXISTS group_posts DROP CONSTRAINT IF EXISTS group_posts_author_id_fkey;
ALTER TABLE IF EXISTS groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- Додаємо правильні foreign key constraints
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE group_posts 
ADD CONSTRAINT group_posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE groups 
ADD CONSTRAINT groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Оновлюємо RLS політики для group_members
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
CREATE POLICY "Users can view group members" ON group_members
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups" ON group_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = group_members.user_id 
    AND auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups" ON group_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = group_members.user_id 
    AND auth_user_id = auth.uid()
  )
);

-- Оновлюємо RLS політики для group_posts
DROP POLICY IF EXISTS "Users can view group posts" ON group_posts;
CREATE POLICY "Users can view group posts" ON group_posts
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create group posts" ON group_posts;
CREATE POLICY "Users can create group posts" ON group_posts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = group_posts.author_id 
    AND auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own group posts" ON group_posts;
CREATE POLICY "Users can update their own group posts" ON group_posts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = group_posts.author_id 
    AND auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own group posts" ON group_posts;
CREATE POLICY "Users can delete their own group posts" ON group_posts
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = group_posts.author_id 
    AND auth_user_id = auth.uid()
  )
);

-- Оновлюємо RLS політики для groups
DROP POLICY IF EXISTS "Users can view groups" ON groups;
CREATE POLICY "Users can view groups" ON groups
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups" ON groups
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = groups.created_by 
    AND auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own groups" ON groups;
CREATE POLICY "Users can update their own groups" ON groups
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = groups.created_by 
    AND auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own groups" ON groups;
CREATE POLICY "Users can delete their own groups" ON groups
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = groups.created_by 
    AND auth_user_id = auth.uid()
  )
);