import { supabase } from '../../../lib/supabase';
import { Group } from '../types';

export class GroupsService {
  /**
   * Отримати всі групи з інформацією про створника
   */
  static async getAllGroups(): Promise<Group[]> {
    try {
      console.log('🔍 GroupsService: Fetching all groups...');
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('❌ GroupsService: Error fetching groups:', error);
        throw error;
      }

      console.log('✅ GroupsService: Raw groups data:', data);
      return data || [];
    } catch (error) {
      console.error('❌ GroupsService: Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Отримати інформацію про створників груп
   */
  static async getGroupCreators(groupIds: string[]): Promise<Record<string, any>> {
    if (groupIds.length === 0) return {};

    try {
      console.log('🔍 GroupsService: Fetching creators for groups:', groupIds);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar')
        .in('id', groupIds);

      if (error) {
        console.error('❌ GroupsService: Error fetching creators:', error);
        throw error;
      }

      const creatorsMap = (data || []).reduce((acc, creator) => {
        acc[creator.id] = creator;
        return acc;
      }, {} as Record<string, any>);

      console.log('✅ GroupsService: Creators map:', creatorsMap);
      return creatorsMap;
    } catch (error) {
      console.error('❌ GroupsService: Error fetching creators:', error);
      return {};
    }
  }

  /**
   * Отримати членство користувача в групах
   */
  static async getUserMemberships(userId: string): Promise<Record<string, any>> {
    try {
      console.log('🔍 GroupsService: Fetching memberships for user:', userId);
      
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, role, joined_at')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ GroupsService: Error fetching memberships:', error);
        throw error;
      }

      const membershipsMap = (data || []).reduce((acc, membership) => {
        acc[membership.group_id] = membership;
        return acc;
      }, {} as Record<string, any>);

      console.log('✅ GroupsService: Memberships map:', membershipsMap);
      return membershipsMap;
    } catch (error) {
      console.error('❌ GroupsService: Error fetching memberships:', error);
      return {};
    }
  }

  /**
   * Створити нову групу
   */
  static async createGroup(groupData: {
    name: string;
    description: string;
    is_private: boolean;
    category: string;
    location: string;
    website: string;
    contactemail: string;
    rules: string[];
    created_by: string;
  }): Promise<Group | null> {
    try {
      console.log('🔍 GroupsService: Creating group:', groupData);
      
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          ...groupData,
          member_count: 1,
          post_count: 0,
          is_active: true,
          last_activity: new Date().toISOString()
        }])
        .select()
        .single();

      if (groupError) {
        console.error('❌ GroupsService: Error creating group:', groupError);
        throw groupError;
      }

      console.log('✅ GroupsService: Group created:', group);
      return group;
    } catch (error) {
      console.error('❌ GroupsService: Error creating group:', error);
      throw error;
    }
  }

  /**
   * Приєднатися до групи
   */
  static async joinGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      console.log('🔍 GroupsService: Joining group:', groupId, 'for user:', userId);
      
      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('❌ GroupsService: Error joining group:', error);
        throw error;
      }

      console.log('✅ GroupsService: Successfully joined group');
      return true;
    } catch (error) {
      console.error('❌ GroupsService: Error joining group:', error);
      throw error;
    }
  }

  /**
   * Покинути групу
   */
  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      console.log('🔍 GroupsService: Leaving group:', groupId, 'for user:', userId);
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ GroupsService: Error leaving group:', error);
        throw error;
      }

      console.log('✅ GroupsService: Successfully left group');
      return true;
    } catch (error) {
      console.error('❌ GroupsService: Error leaving group:', error);
      throw error;
    }
  }
} 