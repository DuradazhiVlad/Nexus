import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  UserPlus, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Mail, 
  Filter,
  X,
  Users,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  auth_user_id: string;
  name: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birthDate?: string;
  date: string;
  privacy?: {
    profileVisibility: 'public' | 'friends' | 'private';
    showBirthDate: boolean;
    showEmail: boolean;
  };
}

interface Filters {
  city: string;
  sortBy: 'name' | 'date' | 'city';
  sortOrder: 'asc' | 'desc';
  showOnlyAvailable: boolean;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    city: '',
    sortBy: 'date',
    sortOrder: 'desc',
    showOnlyAvailable: false
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, users, filters]);

  const fetchUsers = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      setCurrentUser(authUser.id);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      // Фільтруємо поточного користувача зі списку
      let otherUsers = data?.filter(user => user.auth_user_id !== authUser.id) || [];
      // Додаємо фільтрацію: не показувати користувачів з помилками
      otherUsers = otherUsers.filter(user => 
        user && user.id && user.name && user.lastName && user.email
      );
      
      // Фільтруємо тільки публічні профілі або друзів
      const visibleUsers = otherUsers.filter(user => 
        !user.privacy || user.privacy.profileVisibility === 'public'
      );

      setUsers(visibleUsers);
      
      // Створюємо список унікальних міст
      const cities = [...new Set(visibleUsers
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
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredUsers(filtered);
  };

  const addFriend = async (friendId: string) => {
    try {
      if (!currentUser) return;

      // Перевіряємо чи вже є запит на дружбу
      const { data: existingRequest } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${currentUser},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser})`);

      if (existingRequest && existingRequest.length > 0) {
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
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Помилка при додаванні в друзі');
    }
  };

  const resetFilters = () => {
    setFilters({
      city: '',
      sortBy: 'date',
      sortOrder: 'desc',
      showOnlyAvailable: false
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

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.city) count++;
    if (filters.sortBy !== 'date' || filters.sortOrder !== 'desc') count++;
    if (filters.showOnlyAvailable) count++;
    return count;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Користувачі</h1>
            <p className="text-gray-600">Знайдіть нових друзів та розширте свою мережу</p>
          </div>

          {/* Пошук та фільтри */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Пошук за ім'ям, прізвищем, email, містом або біо"
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
            </div>

            {/* Панель фільтрів */}
            {showFilters && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Місто</label>
                    <select
                      value={filters.city}
                      onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Всі міста</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Сортувати за</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="date">Датою реєстрації</option>
                      <option value="name">Ім'ям</option>
                      <option value="city">Містом</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Порядок</label>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="desc">За спаданням</option>
                      <option value="asc">За зростанням</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showOnlyAvailable"
                      checked={filters.showOnlyAvailable}
                      onChange={(e) => setFilters(prev => ({ ...prev, showOnlyAvailable: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                    />
                    <label htmlFor="showOnlyAvailable" className="ml-2 text-sm text-gray-700">
                      Показувати тільки доступних користувачів
                    </label>
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
              Знайдено <span className="font-semibold">{filteredUsers.length}</span> {filteredUsers.length === 1 ? 'користувач' : 'користувачів'}
              {searchQuery && (
                <span> за запитом "<span className="font-semibold">{searchQuery}</span>"</span>
              )}
            </p>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group hover:scale-105"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
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
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {user.name} {user.lastName}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar size={14} className="mr-1 flex-shrink-0" />
                          <span className="truncate">Приєднався {formatDate(user.date)}</span>
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
                      {(!user.privacy || user.privacy.showEmail) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={e => { e.stopPropagation(); addFriend(user.auth_user_id); }}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <UserPlus size={16} className="mr-1" />
                        Додати
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/messages?user=${user.id}`); }}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Написати повідомлення"
                      >
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                {searchQuery || filters.city
                  ? 'Спробуйте змінити критерії пошуку або фільтри'
                  : 'Поки що немає зареєстрованих користувачів'
                }
              </p>
              {(searchQuery || filters.city || getActiveFiltersCount() > 0) && (
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