import { useState, useEffect } from 'react';
import { FriendsService } from '../../../lib/friendsService';
import { supabase } from '../../../lib/supabase';

export type FriendshipStatus = 'none' | 'pending' | 'accepted' | 'sent';

export const useFriendship = (profileId: string | undefined) => {
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Отримуємо поточного користувача
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Отримуємо ID користувача з таблиці user_profiles
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

  // Перевіряємо статус дружби
  useEffect(() => {
    const checkFriendshipStatus = async () => {
      if (!currentUserId || !profileId || currentUserId === profileId) {
        setFriendshipStatus('none');
        return;
      }

      try {
        setLoading(true);
        
        // Спочатку перевіряємо чи є підтверджена дружба
        const { data: friendship } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${profileId}),and(user1_id.eq.${profileId},user2_id.eq.${currentUserId})`)
          .single();

        if (friendship) {
          setFriendshipStatus('accepted');
          return;
        }

        // Якщо дружби немає, перевіряємо запити на дружбу
        const { data: request } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${currentUserId})`)
          .eq('status', 'pending')
          .single();

        if (request) {
          // Якщо поточний користувач відправив запит
          if (request.user_id === currentUserId) {
            setFriendshipStatus('sent');
          } else {
            // Якщо поточний користувач отримав запит
            setFriendshipStatus('pending');
          }
        } else {
          setFriendshipStatus('none');
        }
      } catch (error) {
        console.error('Error checking friendship status:', error);
        setFriendshipStatus('none');
      } finally {
        setLoading(false);
      }
    };

    checkFriendshipStatus();
  }, [currentUserId, profileId]);

  // Відправити запит на дружбу
  const sendFriendRequest = async () => {
    if (!currentUserId || !profileId) return false;

    try {
      setLoading(true);
      
      // Перевіряємо чи не існує вже запит
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('id')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${currentUserId})`)
        .single();

      if (existing) {
        console.log('Friend request already exists');
        return false;
      }

      // Створюємо новий запит на дружбу
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          user_id: currentUserId,
          friend_id: profileId,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        return false;
      }

      setFriendshipStatus('sent');
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Прийняти запит на дружбу
  const acceptFriendRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const success = await FriendsService.acceptFriendRequest(requestId);
      if (success) {
        setFriendshipStatus('accepted');
      }
      return success;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Відхилити запит на дружбу
  const rejectFriendRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const success = await FriendsService.rejectFriendRequest(requestId);
      if (success) {
        setFriendshipStatus('none');
      }
      return success;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Видалити з друзів
  const removeFriend = async () => {
    if (!currentUserId || !profileId) return false;

    try {
      setLoading(true);
      // Знаходимо дружбу
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${profileId}),and(user1_id.eq.${profileId},user2_id.eq.${currentUserId})`)
        .single();

      if (friendship) {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendship.id);

        if (!error) {
          setFriendshipStatus('none');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    friendshipStatus,
    loading,
    currentUserId,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  };
};