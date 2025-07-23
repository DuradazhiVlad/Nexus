import { supabase } from '../src/lib/supabase';
import { DatabaseService } from './database';
import { Group, GroupMember, GroupPost } from '../types/groups';

export class GroupsService {
  // Get all public groups and user's groups
  static async getAllGroups(): Promise<Group[]> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  // Get group by ID with detailed info
  static async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  }

  // Create new group
  static async createGroup(groupData: {
    name: string;
    description: string;
    privacy: 'public' | 'private';
    avatar?: string;
  }): Promise<Group | null> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return null;

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          ...groupData,
          created_by: currentUser.id.toString(),
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          user_id: currentUser.id.toString(),
          role: 'admin',
        }]);

      if (memberError) throw memberError;

      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }

  // Join group
  static async joinGroup(groupId: string): Promise<boolean> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return false;

      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: currentUser.id.toString(),
          role: 'member',
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  }

  // Leave group
  static async leaveGroup(groupId: string): Promise<boolean> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return false;

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id.toString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  }

  // Get group members
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users!group_members_user_id_fkey (
            name,
            lastName,
            avatar,
            email
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  }

  // Check if user is member of group
  static async isGroupMember(groupId: string): Promise<{ isMember: boolean; role?: string }> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return { isMember: false };

      const { data, error } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id.toString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { isMember: false };
        }
        throw error;
      }

      return { isMember: true, role: data.role };
    } catch (error) {
      console.error('Error checking group membership:', error);
      return { isMember: false };
    }
  }

  // Get group posts
  static async getGroupPosts(groupId: string): Promise<GroupPost[]> {
    try {
      const { data, error } = await supabase
        .from('group_posts')
        .select(`
          *,
          user:users!group_posts_user_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group posts:', error);
      return [];
    }
  }

  // Create group post
  static async createGroupPost(postData: {
    group_id: string;
    content: string;
    media_url?: string;
    media_type?: 'photo' | 'video' | 'text';
  }): Promise<GroupPost | null> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return null;

      const { data, error } = await supabase
        .from('group_posts')
        .insert([{
          ...postData,
          user_id: currentUser.id.toString(),
        }])
        .select(`
          *,
          user:users!group_posts_user_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating group post:', error);
      return null;
    }
  }

  // Delete group post
  static async deleteGroupPost(postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('group_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting group post:', error);
      return false;
    }
  }
}