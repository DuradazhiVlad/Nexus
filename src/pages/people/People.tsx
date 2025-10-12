import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { useErrorNotifications } from '../../components/ErrorNotification';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PeopleService } from './services/peopleService';
import { UserCard } from './components/UserCard';
import { PeopleFilters } from './components/PeopleFilters';
import { User, FriendRequest, Filters, ViewMode } from './types';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function People() {
  const { addNotification } = useErrorNotifications();
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<Filters>({
    city: '',
    onlineStatus: 'all',
    friendStatus: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    hasAvatar: false,
    hasBio: false
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersData = await PeopleService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification({ type: 'error', title: 'Помилка', message: 'Помилка завантаження користувачів' });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const fetchFriendRequests = useCallback(async () => {
    try {
      const requestsData = await PeopleService.getFriendRequests();
      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Помилка завантаження запитів на дружбу';
      addNotification({ type: 'error', title: 'Помилка', message: errorMessage });
    }
  }, [addNotification]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        setCurrentUser(userProfile?.id || null);
        setIsAuthenticated(true);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchFriendRequests();
    }
  }, [isAuthenticated, fetchUsers, fetchFriendRequests]);

  const applyFiltersAndSearch = useCallback(() => {
    let filtered = [...users];

    if (currentUser) {
      filtered = filtered.filter(user => user.id !== currentUser);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.city?.toLowerCase().includes(query)
      );
    }

    if (filters.city) {
      filtered = filtered.filter(user =>
        user.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.onlineStatus !== 'all') {
      filtered = filtered.filter(user => {
        // Assume user.isOnline is set elsewhere, e.g., via a real-time presence channel
        return (filters.onlineStatus === 'online' && user.isOnline) || (filters.onlineStatus === 'offline' && !user.isOnline);
      });
    }

    if (filters.friendStatus !== 'all') {
      filtered = filtered.filter(user => {
        const friendStatus = getFriendStatus(user.id);
        if (filters.friendStatus === 'friends') return friendStatus === 'friends';
        if (filters.friendStatus === 'not_friends') return friendStatus === 'not_friends';
        if (filters.friendStatus === 'sent') return friendStatus === 'sent';
        if (filters.friendStatus === 'received') return friendStatus === 'received';
        return true;
      });
    }

    if (filters.hasAvatar) {
      filtered = filtered.filter(user => user.avatar);
    }

    if (filters.hasBio) {
      filtered = filtered.filter(user => user.bio && user.bio.trim().length > 0);
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = `${a.name} ${a.last_name || ''}`.toLowerCase();
          bValue = `${b.name} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.created_at || '').getTime();
          bValue = new Date(b.created_at || '').getTime();
          break;
        case 'city':
          aValue = a.city?.toLowerCase() || '';
          bValue = b.city?.toLowerCase() || '';
          break;
        case 'lastSeen':
          aValue = new Date(a.lastSeen || '').getTime();
          bValue = new Date(b.lastSeen || '').getTime();
          break;
        case 'popularity':
          aValue = (a.friendsCount || 0) + (a.postsCount || 0);
          bValue = (b.friendsCount || 0) + (b.postsCount || 0);
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchQuery, filters, currentUser, friendRequests]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [users, searchQuery, filters, applyFiltersAndSearch, friendRequests]);

  const getFriendStatus = useCallback((userId: string) => {
    if (!currentUser || !friendRequests) return 'not_friends';

    const sentRequest = friendRequests.find(req =>
      req.user_id === currentUser && req.friend_id === userId && req.status === 'pending'
    );

    const receivedRequest = friendRequests.find(req =>
      req.user_id === userId && req.friend_id === currentUser && req.status === 'pending'
    );

    const acceptedRequest = friendRequests.find(req =>
      (req.user_id === currentUser && req.friend_id === userId) ||
      (req.user_id === userId && req.friend_id === currentUser) &&
      req.status === 'accepted'
    );

    if (acceptedRequest) return 'friends';
    if (sentRequest) return 'sent';
    if (receivedRequest) return 'received';
    return 'not_friends';
  }, [currentUser, friendRequests]);

  const handleAddFriend = async (friendId: string) => {
    try {
      await PeopleService.sendFriendRequest(friendId);
      await fetchFriendRequests();
      addNotification({ type: 'success', title: 'Успіх', message: 'Запит на дружбу відправлено' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Помилка відправки запиту на дружбу';
      addNotification({ type: 'error', title: 'Помилка', message: errorMessage });
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await PeopleService.acceptFriendRequest(requestId);
        addNotification({ type: 'success', title: 'Успіх', message: 'Запит на дружбу прийнято' });
      } else {
        await PeopleService.rejectFriendRequest(requestId);
        addNotification({ type: 'success', title: 'Успіх', message: 'Запит на дружбу відхилено' });
      }
      await fetchFriendRequests();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Помилка обробки запиту на дружбу';
      addNotification({ type: 'error', title: 'Помилка', message: errorMessage });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await PeopleService.removeFriend(friendId);
      await fetchFriendRequests();
      addNotification({ type: 'success', title: 'Успіх', message: 'Друга видалено' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Помилка видалення друга';
      addNotification({ type: 'error', title: 'Помилка', message: errorMessage });
    }
  };

  const resetFilters = () => {
    setFilters({
      city: '',
      onlineStatus: 'all',
      friendStatus: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      hasAvatar: false,
      hasBio: false
    });
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.city) count++;
    if (filters.onlineStatus !== 'all') count++;
    if (filters.friendStatus !== 'all') count++;
    if (filters.hasAvatar) count++;
    if (filters.hasBio) count++;
    return count;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto lg:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2">
                Користувачі
              </h1>
              <p className="text-gray-500 text-base sm:text-lg">
                Знайдіть нових друзів та знайомих 👥
              </p>
            </div>
          </div>

          {/* Filters */}
          <PeopleFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onResetFilters={resetFilters}
            activeFiltersCount={getActiveFiltersCount()}
          />

          {loading ? (
            <div className="flex justify-center items-center h-[50vh]">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Users Grid/List */}
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-6'}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="animate-fadeIn"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <UserCard
                        user={user}
                        currentUserId={currentUser}
                        friendRequests={friendRequests}
                        onAddFriend={handleAddFriend}
                        onAcceptFriendRequest={(requestId) => handleFriendRequest(requestId, 'accept')}
                        onRejectFriendRequest={(requestId) => handleFriendRequest(requestId, 'reject')}
                        onRemoveFriend={handleRemoveFriend}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200 max-w-md mx-auto">
                      <div className="text-gray-400 mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto flex items-center justify-center shadow-lg">
                          <span className="text-4xl">🤷‍♂️</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Користувачів не знайдено
                      </h3>
                      <p className="text-gray-600">
                        Спробуйте змінити фільтри або пошуковий запит.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}