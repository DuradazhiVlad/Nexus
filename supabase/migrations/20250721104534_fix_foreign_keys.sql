/*
  # Fix foreign key constraints for group tables

  1. Problem
    - group_members.user_id references users.id but should reference user_profiles.id
    - groups.created_by references users.id but should reference user_profiles.id
    - This causes foreign key constraint violations

  2. Solution
    - Drop existing foreign key constraints
    - Add new constraints that reference user_profiles table
    - Ensure data consistency
*/

-- Drop existing foreign key constraints
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- Add new foreign key constraints that reference user_profiles
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE groups 
ADD CONSTRAINT groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Verify the constraints are properly set
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