import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { ErrorNotification, useErrorNotifications } from '../../components/ErrorNotification';
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

  // Check authentication and load data on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchFriendRequests();
    }
  }, [isAuthenticated]);
  
  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
        setIsAuthenticated(true);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      navigate('/login');
    }
  };

  // Apply filters when data or filters change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [users, searchQuery, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users...');
      
      const usersData = await PeopleService.getAllUsers();
      setUsers(usersData);
      
      console.log('✅ Users fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      addNotification({ type: 'error', title: 'Помилка', message: 'Помилка завантаження користувачів' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      console.log('🔍 Fetching friend requests...');
      
      const requestsData = await PeopleService.getFriendRequests();
      setFriendRequests(requestsData);
      
      console.log('✅ Friend requests fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching friend requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Помилка завантаження запитів на дружбу';
      addNotification({ type: 'error', title: 'Помилка', message: errorMessage });
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...users];

    // Exclude current user
    if (currentUser) {
      filtered = filtered.filter(user => user.auth_user_id !== currentUser);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.city?.toLowerCase().includes(query)
      );
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(user =>
        user.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Online status filter
    if (filters.onlineStatus !== 'all') {
      filtered = filtered.filter(user => {
        if (filters.onlineStatus === 'online') return user.isOnline;
        if (filters.onlineStatus === 'offline') return !user.isOnline;
        return true;
      });
    }

    // Has avatar filter
    if (filters.hasAvatar) {
      filtered = filtered.filter(user => user.avatar);
    }

    // Has bio filter
    if (filters.hasBio) {
      filtered = filtered.filter(user => user.bio && user.bio.trim().length > 0);
    }

    // Sort
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
  };

  const addFriend = async (friendId: string) => {
    try {
      console.log('🔍 Adding friend:', friendId);
      await PeopleService.sendFriendRequest(friendId);
      await fetchFriendRequests(); // Refresh friend requests
      addNotification({ type: 'success', title: 'Успіх', message: 'Запит на дружбу відправлено' });
      console.log('✅ Friend request sent successfully');
    } catch (error) {
      console.error('❌ Error adding friend:', error);
      const errorMessage = error instanceof Error ? error.message : 'Помилка відправки запиту на дружбу';
      addNotification({ type: 'error', title: 'Помилка', message: errorMessage });
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      console.log('🔍 Handling friend request:', requestId, action);
      
      if (action === 'accept') {
        await PeopleService.acceptFriendRequest(requestId);
        addNotification({ type: 'success', title: 'Успіх', message: 'Запит на дружбу прийнято' });
      } else {
        await PeopleService.rejectFriendRequest(requestId);
        addNotification({ type: 'success', title: 'Успіх', message: 'Запит на дружбу відхилено' });
      }
      
      await fetchFriendRequests(); // Refresh friend requests
      console.log('✅ Friend request handled successfully');
    } catch (error) {
      console.error('❌ Error handling friend request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Помилка обробки запиту на дружбу';
      addNotification({ type: 'error', title: 'Помилка', message: errorMessage });
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      console.log('🔍 Removing friend:', friendId);
      await PeopleService.removeFriend(friendId);
      addNotification({ type: 'success', title: 'Успіх', message: 'Друга видалено' });
      console.log('✅ Friend removed successfully');
    } catch (error) {
      console.error('❌ Error removing friend:', error);
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
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto lg:ml-64">
        <div className="max-w-7xl mx-auto p-6">
          <ErrorNotification />
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Користувачі
            </h1>
            <p className="text-gray-600">
              Знайдіть нових друзів та знайомих
            </p>
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

          {/* Users Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-4'}>
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={currentUser}
                friendRequests={friendRequests}
                onAddFriend={addFriend}
                onAcceptFriendRequest={(requestId) => handleFriendRequest(requestId, 'accept')}
                onRejectFriendRequest={(requestId) => handleFriendRequest(requestId, 'reject')}
                onRemoveFriend={removeFriend}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Користувачів не знайдено
              </h3>
              <p className="text-gray-500">
                Спробуйте змінити фільтри або пошуковий запит
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}