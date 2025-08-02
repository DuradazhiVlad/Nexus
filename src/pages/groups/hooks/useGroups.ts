import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { DatabaseService } from '../../../lib/database';
import { Group, GroupFilters } from '../types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const user = await DatabaseService.getCurrentUserProfile();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError('Failed to load user data');
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user first
      const user = await DatabaseService.getCurrentUserProfile();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      console.log('🔍 Fetching groups for user:', user.id);

      // Fetch all groups with creator info
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          creator:user_profiles!groups_created_by_fkey (
            id,
            name,
            last_name,
            avatar
          )
        `)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (groupsError) {
        console.error('❌ Error fetching groups:', groupsError);
        setError('Failed to load groups');
        return;
      }

      console.log('✅ Raw groups data:', groupsData);

      // Fetch user memberships separately
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('group_members')
        .select('group_id, role, joined_at')
        .eq('user_id', user.id);

      if (membershipsError) {
        console.error('❌ Error fetching memberships:', membershipsError);
      }

      console.log('✅ User memberships:', membershipsData);

      // Process groups data and add membership info
      const processedGroups = (groupsData || []).map(group => {
        const membership = membershipsData?.find(m => m.group_id === group.id);
        return {
          ...group,
          creator: group.creator,
          user_membership: membership || null
        };
      });

      console.log('✅ Processed groups:', processedGroups);
      setGroups(processedGroups);
      setFilteredGroups(processedGroups);
    } catch (error) {
      console.error('❌ Unexpected error in fetchGroups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (filters: GroupFilters) => {
    let filtered = [...groups];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query) ||
        group.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.categoryFilter) {
      filtered = filtered.filter(group => group.category === filters.categoryFilter);
    }

    // Type filter
    if (filters.typeFilter !== 'all') {
      filtered = filtered.filter(group => {
        if (filters.typeFilter === 'public') return !group.is_private;
        if (filters.typeFilter === 'private') return group.is_private;
        return true;
      });
    }

    // Membership filter
    if (filters.membershipFilter !== 'all') {
      filtered = filtered.filter(group => {
        const isMember = group.user_membership !== null;
        if (filters.membershipFilter === 'member') return isMember;
        if (filters.membershipFilter === 'not_member') return !isMember;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.member_count - a.member_count;
        case 'activity':
          return new Date(b.last_activity || b.created_at).getTime() - 
                 new Date(a.last_activity || a.created_at).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredGroups(filtered);
  };

  const joinGroup = async (groupId: string) => {
    try {
      const user = await DatabaseService.getCurrentUserProfile();
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      console.log('🔍 Joining group:', groupId, 'for user:', user.id);

      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('❌ Error joining group:', error);
        setError('Failed to join group');
        return false;
      }

      console.log('✅ Successfully joined group');
      
      // Refresh groups
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('❌ Unexpected error joining group:', error);
      setError('Failed to join group');
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const user = await DatabaseService.getCurrentUserProfile();
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      console.log('🔍 Leaving group:', groupId, 'for user:', user.id);

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error leaving group:', error);
        setError('Failed to leave group');
        return false;
      }

      console.log('✅ Successfully left group');
      
      // Refresh groups
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('❌ Unexpected error leaving group:', error);
      setError('Failed to leave group');
      return false;
    }
  };

  const createGroup = async (groupData: {
    name: string;
    description: string;
    is_private: boolean;
    category: string;
    location: string;
    website: string;
    contactemail: string;
    rules: string[];
  }) => {
    try {
      const user = await DatabaseService.getCurrentUserProfile();
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      console.log('🔍 Creating group:', groupData, 'for user:', user.id);

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          ...groupData,
          created_by: user.id,
          member_count: 1,
          post_count: 0,
          is_active: true,
          last_activity: new Date().toISOString()
        }])
        .select()
        .single();

      if (groupError) {
        console.error('❌ Error creating group:', groupError);
        setError('Failed to create group');
        return null;
      }

      console.log('✅ Group created:', group);

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
          joined_at: new Date().toISOString()
        }]);

      if (memberError) {
        console.error('❌ Error adding creator as member:', memberError);
        // Group was created but member wasn't added - this is still a partial success
      }

      console.log('✅ Creator added as admin member');
      
      // Refresh groups
      await fetchGroups();
      return group;
    } catch (error) {
      console.error('❌ Unexpected error creating group:', error);
      setError('Failed to create group');
      return null;
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchGroups();
  }, []);

  return {
    groups,
    filteredGroups,
    loading,
    currentUser,
    error,
    fetchGroups,
    applyFilters,
    joinGroup,
    leaveGroup,
    createGroup
  };
} 