import { useState, useEffect } from 'react';
import { DatabaseService } from '../../../lib/database';
import { GroupsService } from '../services/groupsService';
import { GroupsFilters } from '../utils/groupsFilters';
import { Group, GroupFilters } from '../types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const user = await DatabaseService.getCurrentUser();
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
      const user = await DatabaseService.getCurrentUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      console.log('🔍 useGroups: Fetching groups for user:', user.id);

      // Use the new method that doesn't rely on foreign key relationships
      const groupsWithCreators = await GroupsService.getGroupsWithCreators();
      console.log('✅ useGroups: Groups with creators:', groupsWithCreators);

      // Fetch user memberships
      const membershipsMap = await GroupsService.getUserMemberships(user.id);
      console.log('✅ useGroups: Memberships map:', membershipsMap);

      // Add membership info to groups
      const processedGroups = groupsWithCreators.map(group => ({
        ...group,
        user_membership: membershipsMap[group.id] || null
      }));

      console.log('✅ useGroups: Final processed groups:', processedGroups);
      setGroups(processedGroups);
      setFilteredGroups(processedGroups);
    } catch (error) {
      console.error('❌ useGroups: Unexpected error in fetchGroups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (filters: GroupFilters) => {
    const filtered = GroupsFilters.applyFilters(groups, filters);
    setFilteredGroups(filtered);
  };

  const joinGroup = async (groupId: string) => {
    try {
      const user = await DatabaseService.getCurrentUser();
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      await GroupsService.joinGroup(groupId, user.id);
      
      // Refresh groups
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('❌ useGroups: Error joining group:', error);
      setError('Failed to join group');
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const user = await DatabaseService.getCurrentUser();
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      await GroupsService.leaveGroup(groupId, user.id);
      
      // Refresh groups
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('❌ useGroups: Error leaving group:', error);
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
      const user = await DatabaseService.getCurrentUser();
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      const newGroup = await GroupsService.createGroup({
        ...groupData,
        created_by: user.id
      });

      if (newGroup) {
        // Refresh groups
        await fetchGroups();
      }

      return newGroup;
    } catch (error) {
      console.error('❌ useGroups: Error creating group:', error);
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