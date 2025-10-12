import { useState, useEffect, useCallback } from 'react';
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
  const [currentFilters, setCurrentFilters] = useState<GroupFilters>({
    searchQuery: '',
    category: '',
    type: 'all',
    membership: 'all',
    sortBy: 'activity',
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await DatabaseService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      setError('Failed to load user data');
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await DatabaseService.getCurrentUser();
      if (!user) {
        setCurrentUser(null);
        setGroups([]);
        setFilteredGroups([]);
        setError('User not authenticated');
        return;
      }
      setCurrentUser(user);

      const groupsWithCreators = await GroupsService.getGroupsWithCreators();
      const membershipsMap = await GroupsService.getUserMemberships(user.id);

      const processedGroups = groupsWithCreators.map(group => ({
        ...group,
        user_membership: membershipsMap[group.id] || null
      }));

      setGroups(processedGroups);
      applyFilters(currentFilters, processedGroups); // Застосовуємо фільтри до свіжих даних
    } catch (error) {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const applyFilters = useCallback((filters: GroupFilters, groupsToFilter = groups) => {
    setCurrentFilters(filters);
    const filtered = GroupsFilters.applyFilters(groupsToFilter, filters);
    setFilteredGroups(filtered);
  }, [groups]);

  const joinGroup = async (groupId: string) => {
    try {
      if (!currentUser) {
        setError('User not authenticated');
        return false;
      }

      await GroupsService.joinGroup(groupId, currentUser.id);
      
      const newGroups = groups.map(group =>
        group.id === groupId
          ? { ...group, user_membership: { role: 'member', joined_at: new Date().toISOString() }, member_count: (group.member_count || 0) + 1 }
          : group
      );
      setGroups(newGroups);
      applyFilters(currentFilters, newGroups);
      
      return true;
    } catch (error) {
      setError('Failed to join group');
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      if (!currentUser) {
        setError('User not authenticated');
        return false;
      }

      await GroupsService.leaveGroup(groupId, currentUser.id);
      
      const newGroups = groups.map(group =>
        group.id === groupId
          ? { ...group, user_membership: null, member_count: Math.max(0, (group.member_count || 0) - 1) }
          : group
      );
      setGroups(newGroups);
      applyFilters(currentFilters, newGroups);
      
      return true;
    } catch (error) {
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
      if (!currentUser) {
        setError('User not authenticated');
        return null;
      }

      const newGroup = await GroupsService.createGroup({
        ...groupData,
        created_by: currentUser.id
      });

      if (newGroup) {
        const updatedGroups = [
          {
            ...newGroup,
            creator: {
              name: currentUser.name,
              last_name: currentUser.last_name,
              avatar: currentUser.avatar
            },
            user_membership: { role: 'admin', joined_at: new Date().toISOString() }
          },
          ...groups
        ];
        setGroups(updatedGroups);
        applyFilters(currentFilters, updatedGroups);
      }

      return newGroup;
    } catch (error) {
      setError('Failed to create group');
      return null;
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchGroups();
  }, [fetchCurrentUser, fetchGroups]);

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