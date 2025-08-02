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

      console.log('🔍 useGroups: Fetching groups for user:', user.id);

      // Fetch all groups
      const groupsData = await GroupsService.getAllGroups();
      console.log('✅ useGroups: Raw groups data:', groupsData);

      // Get unique creator IDs
      const creatorIds = [...new Set(groupsData.map(group => group.created_by))];
      console.log('🔍 useGroups: Creator IDs:', creatorIds);

      // Fetch creators information
      const creatorsMap = await GroupsService.getGroupCreators(creatorIds);
      console.log('✅ useGroups: Creators map:', creatorsMap);

      // Fetch user memberships
      const membershipsMap = await GroupsService.getUserMemberships(user.id);
      console.log('✅ useGroups: Memberships map:', membershipsMap);

      // Process groups data and add creator and membership info
      const processedGroups = groupsData.map(group => ({
        ...group,
        creator: creatorsMap[group.created_by] || null,
        user_membership: membershipsMap[group.id] || null
      }));

      console.log('✅ useGroups: Processed groups:', processedGroups);
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
      const user = await DatabaseService.getCurrentUserProfile();
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
      const user = await DatabaseService.getCurrentUserProfile();
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
      const user = await DatabaseService.getCurrentUserProfile();
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      const group = await GroupsService.createGroup({
        ...groupData,
        created_by: user.id
      });

      // Add creator as admin member
      try {
        await GroupsService.joinGroup(group.id, user.id);
      } catch (memberError) {
        console.error('❌ useGroups: Error adding creator as member:', memberError);
        // Group was created but member wasn't added - this is still a partial success
      }

      // Refresh groups
      await fetchGroups();
      return group;
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