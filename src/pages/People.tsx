import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../lib/database';
import { 
  Search, 
  UserPlus, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Mail, 
  UserCircle,
  Users,
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
  Globe,
  Lock,
  UserCheck,
  UserX,
  Clock,
  Eye,
  Grid,
  List,
  Sort,
  ArrowUpDown,
  Heart,
  Star,
  Camera,
  MoreHorizontal,
  Share2,
  Flag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  auth_user_id?: string;
  name: string;
  lastName?: string;
  lastname?: string; // New field from database
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birthDate?: string;
  birthdate?: string; // New field from database
  date?: string;
  created_at?: string; // New field from database
  isOnline?: boolean;
  lastSeen?: string;
  friendsCount?: number;
  postsCount?: number;
  mutualFriends?: number;
  canAddToFriend?: boolean;
  privacy?: {
    profileVisibility: 'public' | 'friends' | 'private';
    showBirthDate: boolean;
    showEmail: boolean;
    showOnlineStatus?: boolean;
  };
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface Filters {
  city: string;
  onlineStatus: 'all' | 'online' | 'offline';
  friendStatus: 'all' | 'friends' | 'not_friends' | 'pending';
  sortBy: 'name' | 'date' | 'city' | 'lastSeen' | 'popularity';
  sortOrder: 'asc' | 'desc';
  hasAvatar: boolean;
  hasBio: boolean;
}

type ViewMode = 'grid' | 'list';

export function People() {
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
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, users, filters, friendRequests]);

  const fetchUsers = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        // Використовуємо демо дані якщо користувач не авторизований
        const demoUsers: User[] = [
          {
            id: '1',
            name: 'Анна',
            lastName: 'Петренко',
            avatar: undefined,
            email: 'anna@example.com',
            city: 'Київ',
            isOnline: true,
            lastSeen: new Date().toISOString(),
            mutualFriends: 12,
            canAddToFriend: true,
          },
          {
            id: '2',
            name: 'Максим',
            lastName: 'Іваненко',
            avatar: undefined,
            email: 'maxim@example.com',
            city: 'Львів',
            isOnline: false,
            lastSeen: new Date(Date.now() - 3600000).toISOString(),
            mutualFriends: 8,
            canAddToFriend: true,
          }
        ];
        setUsers(demoUsers);
        setFilteredUsers(demoUsers);
        return;
      }

      setCurrentUser(authUser.id);

      // Використовуємо новий метод з DatabaseService
      let allUsers = await DatabaseService.getAllUsers();
      
      // Додаємо фільтрацію: не показувати користувачів з помилками
      allUsers = allUsers.filter(user => 
        user && user.id && user.name && (user.lastname || user.lastName) && user.email
      );

      // Симулюємо онлайн статус та додаткові дані
      const mappedUsers: User[] = allUsers.map(user => ({
        ...user,
        lastName: user.lastname || user.lastName,
        lastname: user.lastname,
        birthDate: user.birthdate,
        date: user.created_at || user.date,
        isOnline: Math.random() > 0.7, // 30% онлайн
        lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        friendsCount: Math.floor(Math.random() * 100),
        postsCount: Math.floor(Math.random() * 50),
        mutualFriends: Math.floor(Math.random() * 20),
        canAddToFriend: user.id !== authUser.id, // Не можна додати себе в друзі
      }));

      setUsers(mappedUsers);
      
      // Створюємо список унікальних міст
      const cities = [...new Set(mappedUsers
        .filter(user => user.city)
        .map(user => user.city!)
      )].sort();
      setAvailableCities(cities);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${authUser.id},friend_id.eq.${authUser.id}`);

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const getFriendStatus = (userId: string) => {
    if (!currentUser) return 'not_friends';
    if (userId === currentUser) return 'self';

    const request = friendRequests.find(req => 
      (req.user_id === currentUser && req.friend_id === userId) ||
      (req.user_id === userId && req.friend_id === currentUser)
    );

    if (!request) return 'not_friends';
    if (request.status === 'accepted') return 'friends';
    if (request.status === 'pending') {
      return request.user_id === currentUser ? 'sent' : 'received';
    }
    return 'not_friends';
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...users];

    // Пошук
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.city && user.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Фільтр по місту
    if (filters.city) {
      filtered = filtered.filter(user => user.city === filters.city);
    }

    // Фільтр по онлайн статусу
    if (filters.onlineStatus !== 'all') {
      filtered = filtered.filter(user => 
        filters.onlineStatus === 'online' ? user.isOnline : !user.isOnline
      );
    }

    // Фільтр по статусу дружби
    if (filters.friendStatus !== 'all') {
      filtered = filtered.filter(user => {
        const status = getFriendStatus(user.auth_user_id);
        switch (filters.friendStatus) {
          case 'friends': return status === 'friends';
          case 'not_friends': return status === 'not_friends';
          case 'pending': return status === 'sent' || status === 'received';
          default: return true;
        }
      });
    }

    // Фільтр по аватару
    if (filters.hasAvatar) {
      filtered = filtered.filter(user => user.avatar);
    }

    // Фільтр по біо
    if (filters.hasBio) {
      filtered = filtered.filter(user => user.bio && user.bio.trim() !== '');
    }

    // Сортування
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = `${a.name} ${a.lastName}`.localeCompare(`${b.name} ${b.lastName}`);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
        case 'lastSeen':
          if (a.isOnline && !b.isOnline) comparison = -1;
          else if (!a.isOnline && b.isOnline) comparison = 1;
          else comparison = new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime();
          break;
        case 'popularity':
          comparison = (b.friendsCount || 0) - (a.friendsCount || 0);
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredUsers(filtered);
  };

  const addFriend = async (friendId: string) => {
    try {
      if (!currentUser) return;

      if (friendId === currentUser) {
        alert('Ви не можете додати себе в друзі!');
        return;
      }

      const existingRequest = friendRequests.find(req => 
        (req.user_id === currentUser && req.friend_id === friendId) ||
        (req.user_id === friendId && req.friend_id === currentUser)
      );

      if (existingRequest) {
        alert('Запит на дружбу вже існує!');
        return;
      }

      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: currentUser, friend_id: friendId, status: 'pending' }
        ]);

      if (error) throw error;

      alert('Запит на дружбу надіслано!');
      fetchFriendRequests();
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Помилка при додаванні в друзі');
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      alert(action === 'accept' ? 'Запит прийнято!' : 'Запит відхилено!');
      fetchFriendRequests();
    } catch (error) {
      console.error('Error handling friend request:', error);
      alert('Помилка при обробці запиту');
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      if (!currentUser) return;

      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${currentUser},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser})`);

      if (error) throw error;

      alert('Користувача видалено з друзів!');
      fetchFriendRequests();
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Помилка при видаленні з друзів');
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
    setShowBulkActions(false);
  };

  const bulkAddFriends = async () => {
    for (const userId of selectedUsers) {
      await addFriend(userId);
    }
    clearSelection();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastSeen = (lastSeen?: string, isOnline?: boolean) => {
    if (isOnline) return 'Онлайн';
    if (!lastSeen) return 'Давно не з\'являвся';
    
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} хв тому`;
    if (hours < 24) return `${hours} год тому`;
    return `${days} дн тому`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.city) count++;
    if (filters.onlineStatus !== 'all') count++;
    if (filters.friendStatus !== 'all') count++;
    if (filters.sortBy !== 'date' || filters.sortOrder !== 'desc') count++;
    if (filters.hasAvatar) count++;
    if (filters.hasBio) count++;
    return count;
  };

  const renderUserCard = (user: User) => {
    const friendStatus = getFriendStatus(user.auth_user_id);
    const isSelected = selectedUsers.has(user.id);

    if (viewMode === 'list') {
      return (
        <div
          key={user.id}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleUserSelection(user.id)}
                className="absolute top-0 left-0 w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden ml-6">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>
                    {user.name[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
                  </span>
                )}
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {user.name} {user.lastName}
                </h3>
                {user.privacy?.profileVisibility === 'private' && (
                  <Lock size={16} className="text-gray-400" />
                )}
                {friendStatus === 'friends' && (
                  <UserCheck size={16} className="text-green-500" />
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {formatDate(user.date)}
                </div>
                {user.city && (
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1" />
                    {user.city}
                  </div>
                )}
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  {formatLastSeen(user.lastSeen, user.isOnline)}
                </div>
              </div>

              {user.bio && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {user.bio}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                <span>{user.friendsCount} друзів</span>
                <span>{user.postsCount} постів</span>
              </div>
            </div>

            <div className="flex space-x-2">
              {friendStatus === 'self' ? (
                <button
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium cursor-default"
                  disabled
                >
                  Це ви
                </button>
              ) : friendStatus === 'friends' ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => removeFriend(user.auth_user_id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Видалити з друзів
                  </button>
                  <button
                    onClick={() => navigate(`/messages?user=${user.id}`)}
                    className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              ) : friendStatus === 'sent' ? (
                <button
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium cursor-default"
                  disabled
                >
                  Запит надіслано
                </button>
              ) : friendStatus === 'received' ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const request = friendRequests.find(req => req.user_id === user.auth_user_id);
                      if (request) handleFriendRequest(request.id, 'accept');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Прийняти
                  </button>
                  <button
                    onClick={() => {
                      const request = friendRequests.find(req => req.user_id === user.auth_user_id);
                      if (request) handleFriendRequest(request.id, 'reject');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Відхилити
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => addFriend(user.auth_user_id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Додати в друзі
                  </button>
                  <button
                    onClick={() => navigate(`/messages?user=${user.id}`)}
                    className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              )}
              
              <button
                className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Grid view
    return (
      <div
        key={user.id}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group hover:scale-105 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => navigate(`/profile/${user.id}`)}
      >
        <div className="relative">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleUserSelection(user.id);
            }}
            className="absolute top-3 left-3 w-4 h-4 rounded border-gray-300 text-blue-600 z-10"
          />
          
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>
                    {user.name[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
                  </span>
                )}
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {user.name} {user.lastName}
                  </h3>
                  {user.privacy?.profileVisibility === 'private' && (
                    <Lock size={16} className="text-gray-400" />
                  )}
                  {friendStatus === 'friends' && (
                    <UserCheck size={16} className="text-green-500" />
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock size={14} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{formatLastSeen(user.lastSeen, user.isOnline)}</span>
                </div>
              </div>
            </div>

            {user.bio && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {user.bio}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {user.city && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{user.city}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">Приєднався {formatDate(user.date)}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{user.friendsCount} друзів</span>
                <span>{user.postsCount} постів</span>
              </div>
            </div>

            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
              {friendStatus === 'self' ? (
                <button
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium cursor-default"
                  disabled
                >
                  <UserCircle size={16} className="mr-1" />
                  Це ви
                </button>
              ) : friendStatus === 'friends' ? (
                <button
                  onClick={() => removeFriend(user.auth_user_id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  <UserX size={16} className="mr-1" />
                  Видалити
                </button>
              ) : friendStatus === 'sent' ? (
                <button
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium cursor-default"
                  disabled
                >
                  <Clock size={16} className="mr-1" />
                  Надіслано
                </button>
              ) : friendStatus === 'received' ? (
                <button
                  onClick={() => {
                    const request = friendRequests.find(req => req.user_id === user.auth_user_id);
                    if (request) handleFriendRequest(request.id, 'accept');
                  }}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <UserCheck size={16} className="mr-1" />
                  Прийняти
                </button>
              ) : (
                <button
                  onClick={() => addFriend(user.auth_user_id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <UserPlus size={16} className="mr-1" />
                  Додати
                </button>
              )}
              
              {friendStatus !== 'self' && (
                <button
                  onClick={() => navigate(`/messages?user=${user.id}`)}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Написати повідомлення"
                >
                  <MessageCircle size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Завантаження користувачів...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Заголовок */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Всі користувачі</h1>
            <p className="text-gray-600">Перегляньте всіх зареєстрованих користувачів нашої соціальної мережі</p>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">
                  Обрано {selectedUsers.size} користувачів
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={bulkAddFriends}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Додати всіх в друзі
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Пошук та фільтри */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Пошук серед всіх користувачів..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-3 border rounded-lg transition-colors relative ${
                  showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal size={20} className="mr-2" />
                Фільтри
                {getActiveFiltersCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
                <ChevronDown size={16} className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* Панель фільтрів */}
            {showFilters && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Місто</label>
                    <select
                      value={filters.city}
                      onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Всі міста</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Онлайн статус</label>
                    <select
                      value={filters.onlineStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, onlineStatus: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Всі</option>
                      <option value="online">Онлайн</option>
                      <option value="offline">Офлайн</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Статус дружби</label>
                    <select
                      value={filters.friendStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, friendStatus: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Всі</option>
                      <option value="friends">Друзі</option>
                      <option value="not_friends">Не друзі</option>
                      <option value="pending">Очікуючі запити</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Сортувати за</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="date">Датою реєстрації</option>
                      <option value="name">Ім'ям</option>
                      <option value="city">Містом</option>
                      <option value="lastSeen">Останньою активністю</option>
                      <option value="popularity">Популярністю</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasAvatar}
                        onChange={(e) => setFilters(prev => ({ ...prev, hasAvatar: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm text-gray-700">Тільки з фото</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasBio}
                        onChange={(e) => setFilters(prev => ({ ...prev, hasBio: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm text-gray-700">Тільки з біографією</span>
                    </label>

                    <button
                      onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ArrowUpDown size={16} className="mr-1" />
                      {filters.sortOrder === 'asc' ? 'За зростанням' : 'За спаданням'}
                    </button>
                  </div>
                  
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Скинути фільтри
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Результати */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchQuery 
                ? `Знайдено ${filteredUsers.length} користувачів з ${users.length}`
                : `Всього ${filteredUsers.length} користувачів`
              }
              {searchQuery && (
                <span> за запитом "<span className="font-semibold">{searchQuery}</span>"</span>
              )}
            </p>
            
            {selectedUsers.size > 0 && (
              <button
                onClick={() => {
                  if (selectedUsers.size === filteredUsers.length) {
                    clearSelection();
                  } else {
                    setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                    setShowBulkActions(true);
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedUsers.size === filteredUsers.length ? 'Скасувати вибір' : 'Обрати всіх'}
              </button>
            )}
          </div>

          {filteredUsers.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {filteredUsers.map(renderUserCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Користувачів не знайдено
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || getActiveFiltersCount() > 0
                  ? 'Спробуйте змінити критерії пошуку або фільтри'
                  : 'Поки що немає зареєстрованих користувачів'
                }
              </p>
              {(searchQuery || getActiveFiltersCount() > 0) && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Скинути всі фільтри
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}