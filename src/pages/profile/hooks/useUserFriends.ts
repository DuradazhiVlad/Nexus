import { useState, useEffect } from 'react';
import { FriendsService } from '../../../lib/friendsService';
import { supabase } from '../../../lib/supabase';

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  mutual_friends_count?: number;
}

export const useUserFriends = (profileId: string | undefined) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingSuggestedFriends, setLoadingSuggestedFriends] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Отримуємо ID поточного користувача
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();
          
          if (userProfile) {
            setCurrentUserId(userProfile.id);
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  const loadFriends = async (limit: number = 6) => {
    if (!profileId) return;
    
    setLoadingFriends(true);
    try {
      const friendsList = await FriendsService.loadUserFriends(profileId, limit);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadSuggestedFriends = async (limit: number = 5) => {
    if (!profileId) return;
    
    setLoadingSuggestedFriends(true);
    try {
      const suggestions = await FriendsService.loadSuggestedFriends(profileId, limit);
      setSuggestedFriends(suggestions);
    } catch (error) {
      console.error('Error loading suggested friends:', error);
    } finally {
      setLoadingSuggestedFriends(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUserId) {
        console.error('Current user ID is not available.');
        return;
    }
    try {
      await FriendsService.sendFriendRequest(currentUserId, friendId);
      setSuggestedFriends(prev => prev.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await FriendsService.acceptFriendRequest(requestId);
      await loadFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await FriendsService.rejectFriendRequest(requestId);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      await FriendsService.removeFriend(friendshipId);
      await loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (profileId) {
      loadFriends();
      loadSuggestedFriends();
    }
  }, [profileId]);

  return {
    friends,
    suggestedFriends,
    loadingFriends,
    loadingSuggestedFriends,
    loadFriends,
    loadSuggestedFriends,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshFriends: loadFriends
  };
};