-- Create dating_likes table
CREATE TABLE IF NOT EXISTS dating_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Create dating_passes table
CREATE TABLE IF NOT EXISTS dating_passes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Create dating_matches table
CREATE TABLE IF NOT EXISTS dating_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_mutual BOOLEAN DEFAULT true,
    UNIQUE(user1_id, user2_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dating_likes_from_user ON dating_likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_dating_likes_to_user ON dating_likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_dating_likes_created_at ON dating_likes(created_at);

CREATE INDEX IF NOT EXISTS idx_dating_passes_from_user ON dating_passes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_dating_passes_to_user ON dating_passes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_dating_passes_created_at ON dating_passes(created_at);

CREATE INDEX IF NOT EXISTS idx_dating_matches_user1 ON dating_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_dating_matches_user2 ON dating_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_dating_matches_created_at ON dating_matches(created_at);
CREATE INDEX IF NOT EXISTS idx_dating_matches_mutual ON dating_matches(is_mutual);

-- Enable Row Level Security
ALTER TABLE dating_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dating_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dating_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dating_likes
CREATE POLICY "Users can view their own likes" ON dating_likes
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create likes" ON dating_likes
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own likes" ON dating_likes
    FOR DELETE USING (auth.uid() = from_user_id);

-- RLS Policies for dating_passes
CREATE POLICY "Users can view their own passes" ON dating_passes
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create passes" ON dating_passes
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own passes" ON dating_passes
    FOR DELETE USING (auth.uid() = from_user_id);

-- RLS Policies for dating_matches
CREATE POLICY "Users can view their own matches" ON dating_matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches" ON dating_matches
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own matches" ON dating_matches
    FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their own matches" ON dating_matches
    FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Update the get_dating_users function to exclude users who have been liked or passed
CREATE OR REPLACE FUNCTION get_dating_users(current_user_id UUID)
RETURNS TABLE (
    id UUID,
    auth_user_id UUID,
    name TEXT,
    last_name TEXT,
    avatar TEXT,
    age INTEGER,
    gender TEXT,
    city TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.auth_user_id,
        up.name,
        up.last_name,
        up.avatar,
        up.age,
        up.gender,
        up.city,
        up.bio,
        up.created_at
    FROM user_profiles up
    WHERE 
        up.auth_user_id != current_user_id
        AND up.looking_for_relationship = true
        AND up.auth_user_id NOT IN (
            -- Exclude users we've already liked
            SELECT to_user_id FROM dating_likes WHERE from_user_id = current_user_id
            UNION
            -- Exclude users we've already passed
            SELECT to_user_id FROM dating_passes WHERE from_user_id = current_user_id
        )
    ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON dating_likes TO authenticated;
GRANT ALL ON dating_passes TO authenticated;
GRANT ALL ON dating_matches TO authenticated;
GRANT EXECUTE ON FUNCTION get_dating_users(UUID) TO authenticated;