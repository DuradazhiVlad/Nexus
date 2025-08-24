import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { ErrorNotification, useErrorNotifications } from '../../components/ErrorNotification';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { DatingService } from './services/datingService';
import { DatingCard } from './components/DatingCard';
import { DatingFilters } from './components/DatingFilters';
import { DatingUser, DatingFilters as DatingFiltersType } from './types';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Filter } from 'lucide-react';

export function Dating() {
  const [users, setUsers] = useState<DatingUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DatingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DatingFiltersType>({
    gender: 'all',
    minAge: 18,
    maxAge: 65,
    city: '',
    hasPhoto: false,
    sortBy: 'newest'
  });
  
  const { showError } = useErrorNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDatingUsers();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

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
      console.error('Error checking auth:', error);
      navigate('/login');
    }
  };

  const fetchDatingUsers = async () => {
    try {
      setLoading(true);
      const datingUsers = await DatingService.getDatingUsers();
      setUsers(datingUsers);
    } catch (error) {
      console.error('Error fetching dating users:', error);
      showError('Помилка завантаження користувачів для знайомств');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(user => user.gender === filters.gender);
    }

    // Age filter
    filtered = filtered.filter(user => {
      if (!user.age) return false;
      return user.age >= filters.minAge && user.age <= filters.maxAge;
    });

    // City filter
    if (filters.city) {
      filtered = filtered.filter(user =>
        user.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Has photo filter
    if (filters.hasPhoto) {
      filtered = filtered.filter(user => user.avatar);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return `${a.name} ${a.last_name || ''}`.localeCompare(`${b.name} ${b.last_name || ''}`);
        case 'age':
          return (a.age || 0) - (b.age || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredUsers(filtered);
  };

  const resetFilters = () => {
    setFilters({
      gender: 'all',
      minAge: 18,
      maxAge: 65,
      city: '',
      hasPhoto: false,
      sortBy: 'newest'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.gender !== 'all') count++;
    if (filters.minAge !== 18 || filters.maxAge !== 65) count++;
    if (filters.city) count++;
    if (filters.hasPhoto) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

  const handleLike = async (userId: string) => {
    try {
      await DatingService.likeUser(userId);
      // Remove liked user from the list
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error liking user:', error);
      showError('Помилка при лайку');
    }
  };

  const handlePass = async (userId: string) => {
    try {
      await DatingService.passUser(userId);
      // Remove passed user from the list
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error passing user:', error);
      showError('Помилка при пропуску');
    }
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
      <div className="flex-1 overflow-y-auto ml-64">
        <div className="max-w-7xl mx-auto p-6">
          <ErrorNotification />
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-pink-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Знайомства
              </h1>
            </div>
            <p className="text-gray-600">
              Знайдіть свою другу половинку серед {filteredUsers.length} користувачів
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    showFilters
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Фільтри
                  {getActiveFiltersCount() > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
                
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Скинути фільтри
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                {filteredUsers.length} користувачів
              </div>
            </div>

            {showFilters && (
              <DatingFilters
                filters={filters}
                onFiltersChange={setFilters}
                onResetFilters={resetFilters}
              />
            )}
          </div>

          {/* Dating Cards */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Немає користувачів
              </h3>
              <p className="text-gray-600 mb-4">
                {users.length === 0
                  ? 'Наразі немає користувачів, які шукають знайомства'
                  : 'Спробуйте змінити фільтри для пошуку'}
              </p>
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Скинути фільтри
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user) => (
                <DatingCard
                  key={user.id}
                  user={user}
                  onLike={() => handleLike(user.id)}
                  onPass={() => handlePass(user.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}