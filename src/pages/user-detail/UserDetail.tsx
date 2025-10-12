import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { ErrorNotification, useErrorNotifications } from '../../components/ErrorNotification';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { UserService } from './services/userService';
import { UserHeader } from './components/UserHeader';
import { UserTabs } from './components/UserTabs';
import { UserPosts } from './components/UserPosts';
import { UserFriends } from './components/UserFriends';
import { UserAbout } from './components/UserAbout';
import { UserDetail, UserPost, ViewMode } from './types';
import { supabase } from '../../lib/supabase';

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showError } = useErrorNotifications();

  // State
  const [user, setUser] = useState<UserDetail | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [friends, setFriends] = useState<UserDetail[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'friends' | 'pending' | 'none'>('none');
  const [activeTab, setActiveTab] = useState<ViewMode>('posts');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Load current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        // Error getting current user
      }
    };

    getCurrentUser();
  }, []);

  // Load user data
  useEffect(() => {
    if (!userId) return;

    const loadUserData = async () => {
      try {
        setLoading(true);

        // Load user detail
        const userData = await UserService.getUserDetail(userId);
        if (!userData) {
          showError('Користувача не знайдено');
          navigate('/people');
          return;
        }
        setUser(userData);

        // Load friendship status if current user exists
        if (currentUserId && currentUserId !== userId) {
          const status = await UserService.getFriendshipStatus(currentUserId, userId);
          setFriendshipStatus(status);
        }

      } catch (error) {
        showError('Помилка завантаження даних користувача');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, currentUserId, showError, navigate]);

  // Load posts
  useEffect(() => {
    if (!userId || activeTab !== 'posts') return;

    const loadPosts = async () => {
      try {
        setPostsLoading(true);
        
        const postsData = await UserService.getUserPosts(userId);
        setPosts(postsData);
        
      } catch (error) {
        showError('Помилка завантаження постів');
      } finally {
        setPostsLoading(false);
      }
    };

    loadPosts();
  }, [userId, activeTab, showError]);

  // Load friends
  useEffect(() => {
    if (!userId || activeTab !== 'friends') return;

    const loadFriends = async () => {
      try {
        setFriendsLoading(true);
        
        const friendsData = await UserService.getUserFriends(userId);
        setFriends(friendsData);
        
      } catch (error) {
        showError('Помилка завантаження друзів');
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriends();
  }, [userId, activeTab, showError]);

  // Handlers
  const handleSendFriendRequest = async () => {
    if (!userId || !currentUserId) return;

    try {
      await UserService.sendFriendRequest(userId);
      setFriendshipStatus('pending');
      showError('Запит на дружбу відправлено', 'success');
    } catch (error) {
      showError('Помилка відправки запиту на дружбу');
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!userId || !currentUserId) return;

    try {
      await UserService.acceptFriendRequest(userId);
      setFriendshipStatus('friends');
      showError('Запит на дружбу прийнято', 'success');
    } catch (error) {
      showError('Помилка прийняття запиту на дружбу');
    }
  };

  const handleRejectFriendRequest = async () => {
    if (!userId || !currentUserId) return;

    try {
      await UserService.rejectFriendRequest(userId);
      setFriendshipStatus('none');
      showError('Запит на дружбу відхилено', 'success');
    } catch (error) {
      showError('Помилка відхилення запиту на дружбу');
    }
  };

  const handleRemoveFriend = async () => {
    if (!userId || !currentUserId) return;

    try {
      await UserService.removeFriend(userId);
      setFriendshipStatus('none');
      showError('Друга видалено', 'success');
    } catch (error) {
      showError('Помилка видалення друга');
    }
  };

  const handleSendMessage = () => {
    navigate(`/messages?user=${userId}`);
  };

  const handleTabChange = (tab: ViewMode) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Користувача не знайдено
            </h2>
            <button
              onClick={() => navigate('/people')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Повернутися до списку користувачів
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto lg:ml-64">
        <div className="max-w-4xl mx-auto p-6">
          <ErrorNotification />
          
          {/* User Header */}
          <UserHeader
            user={user}
            currentUserId={currentUserId || ''}
            friendshipStatus={friendshipStatus}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onRejectFriendRequest={handleRejectFriendRequest}
            onRemoveFriend={handleRemoveFriend}
            onSendMessage={handleSendMessage}
          />

          {/* Tabs */}
          <UserTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            postsCount={posts.length}
            friendsCount={friends.length}
            photosCount={0} // TODO: Implement photos count
          />

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'posts' && (
              <UserPosts 
                posts={posts} 
                loading={postsLoading} 
              />
            )}
            
            {activeTab === 'friends' && (
              <UserFriends
                friends={friends}
                loading={friendsLoading}
                onSendMessage={(friendId) => navigate(`/messages?user=${friendId}`)}
                onAddFriend={(friendId) => {
                  // TODO: Implement add friend functionality
                }}
              />
            )}
            
            {activeTab === 'photos' && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Фото поки що недоступні
                </h3>
                <p className="text-gray-500">
                  Функція перегляду фото буде додана пізніше
                </p>
              </div>
            )}
            
            {activeTab === 'about' && (
              <UserAbout user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}