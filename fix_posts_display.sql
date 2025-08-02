-- Fix posts display issues
-- This script will ensure the database is properly configured for posts to display

-- 1. Check and fix foreign key constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_user_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
        RAISE NOTICE 'Dropped existing posts_user_id_fkey constraint';
    END IF;
    
    -- Add the correct foreign key constraint
    ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added posts_user_id_fkey constraint';
END $$;

-- 2. Ensure RLS is enabled and policies are correct
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Create new policies
CREATE POLICY "Users can view all posts" ON posts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own posts" ON posts
    FOR INSERT TO authenticated 
    WITH CHECK (
        user_id = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE TO authenticated 
    USING (
        user_id = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE TO authenticated 
    USING (
        user_id = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

-- 3. Check if there are any posts without valid user_id references
SELECT 
    p.id as post_id,
    p.user_id,
    p.content,
    up.id as profile_id,
    up.name
FROM posts p
LEFT JOIN user_profiles up ON p.user_id = up.id
WHERE up.id IS NULL;

-- 4. Create a test post if none exist
DO $$
DECLARE
    test_user_id uuid;
    test_post_id uuid;
BEGIN
    -- Get the first user profile
    SELECT id INTO test_user_id FROM user_profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Check if there are any posts
        IF NOT EXISTS (SELECT 1 FROM posts LIMIT 1) THEN
            -- Create a test post
            INSERT INTO posts (user_id, content, created_at, updated_at)
            VALUES (test_user_id, 'This is a test post to verify the database is working!', NOW(), NOW())
            RETURNING id INTO test_post_id;
            
            RAISE NOTICE 'Created test post with ID: %', test_post_id;
        ELSE
            RAISE NOTICE 'Posts already exist, skipping test post creation';
        END IF;
    ELSE
        RAISE NOTICE 'No user profiles found, cannot create test post';
    END IF;
END $$;

-- 5. Verify the setup
SELECT 
    'Posts count' as metric,
    COUNT(*) as value
FROM posts
UNION ALL
SELECT 
    'User profiles count' as metric,
    COUNT(*) as value
FROM user_profiles
UNION ALL
SELECT 
    'Posts with valid user references' as metric,
    COUNT(*) as value
FROM posts p
JOIN user_profiles up ON p.user_id = up.id; 