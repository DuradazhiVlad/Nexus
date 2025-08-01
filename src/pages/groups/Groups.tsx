import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { DatabaseService } from '../../lib/database';
import { 
  Search, 
  Plus, 
  Users, 
  Lock, 
  Globe, 
  Calendar,
  MapPin,
  Settings,
  UserPlus,
  Eye,
  MessageCircle,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Star,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ErrorNotification, useErrorNotifications } from '../../components/ErrorNotification';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  cover?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  member_count: number;
  post_count: number;
  category?: string;
  tags?: string[];
  location?: string;
  website?: string;
  rules?: string[];
  contactemail?: string;
  is_verified?: boolean;
  is_active?: boolean;
  last_activity?: string;
  creator?: {
    name: string;
    last_name: string;
    avatar?: string;
  };
  user_membership?: {
    role: string;
    joined_at: string;
  };
}

interface CreateGroupForm {
  name: string;
  description: string;
  is_private: boolean;
  category: string;
  location: string;
  website: string;
  contactemail: string;
  rules: string[];
  newRule: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'members' | 'activity' | 'created';

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('activity');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private'>('all');
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'member' | 'not_member'>('all');
  
  const [createForm, setCreateForm] = useState<CreateGroupForm>({
    name: '',
    description: '',
    is_private: false,
    category: '',
    location: '',
    website: '',
    contactemail: '',
    rules: [],
    newRule: ''
  });
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, addNotification, removeNotification } = useErrorNotifications();

  const categories = [
    'Технології',
    'Спорт',
    'Мистецтво',
    'Музика',
    'Освіта',
    'Бізнес',
    'Подорожі',
    'Кулінарія',
    'Фотографія',
    'Ігри',
    'Книги',
    'Фільми',
    'Здоров\'я',
    'Мода',
    'Інше'
  ];

  useEffect(() => {
    fetchCurrentUser();
  }, [location.key]);

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
    }
  }, [currentUser]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [groups, searchQuery, categoryFilter, typeFilter, membershipFilter, sortBy]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        addNotification({
          type: 'error',
          title: 'Помилка авторизації',
          message: 'Не вдалося отримати дані користувача'
        });
        navigate('/login');
        return;
      }

      const userProfile = await DatabaseService.getCurrentUserProfile();
      setCurrentUser(userProfile);
    } catch (error) {
      console.error('Error fetching current user:', error);
      addNotification({
        type: 'error',
        title: 'Помилка завантаження',
        message: 'Не вдалося завантажити дані користувача',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Отримуємо всі групи
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          creator:user_profiles!groups_created_by_fkey(name, last_name, avatar)
        `)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (groupsError) throw groupsError;

      // Отримуємо членство користувача в групах
      let userMemberships = [];
      if (currentUser) {
        const { data: membershipsData, error: membershipsError } = await supabase
          .from('group_members')
          .select('group_id, role, joined_at')
          .eq('user_id', currentUser.id);

        if (membershipsError) {
          console.error('Error fetching memberships:', membershipsError);
        } else {
          userMemberships = membershipsData || [];
        }
      }

      // Додаємо інформацію про членство до груп
      const groupsWithMembership = (groupsData || []).map(group => {
        const membership = userMemberships.find(m => m.group_id === group.id);
        return {
          ...group,
          user_membership: membership || null
        };
      });

      setGroups(groupsWithMembership);
    } catch (error) {
      console.error('Error fetching groups:', error);
      addNotification({
        type: 'error',
        title: 'Помилка завантаження',
        message: 'Не вдалося завантажити групи',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: fetchGroups
      });
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...groups];

    // Пошук
    if (searchQuery.trim()) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (group.category && group.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (group.location && group.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Фільтр по категорії
    if (categoryFilter) {
      filtered = filtered.filter(group => group.category === categoryFilter);
    }

    // Фільтр по типу
    if (typeFilter !== 'all') {
      filtered = filtered.filter(group => 
        typeFilter === 'public' ? !group.is_private : group.is_private
      );
    }

    // Фільтр по членству
    if (membershipFilter !== 'all') {
      filtered = filtered.filter(group => {
        const isMember = !!group.user_membership;
        return membershipFilter === 'member' ? isMember : !isMember;
      });
    }

    // Сортування
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b.member_count || 0) - (a.member_count || 0);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'activity':
        default:
          return new Date(b.last_activity || b.created_at).getTime() - new Date(a.last_activity || a.created_at).getTime();
      }
    });

    setFilteredGroups(filtered);
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      addNotification({
        type: 'warning',
        title: 'Не авторизовано',
        message: 'Для створення групи потрібно авторизуватися'
      });
      return;
    }

    if (!createForm.name.trim()) {
      addNotification({
        type: 'warning',
        title: 'Невірні дані',
        message: 'Назва групи є обов\'язковою'
      });
      return;
    }

    try {
      setCreating(true);

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          is_private: createForm.is_private,
          created_by: currentUser.id,
          category: createForm.category || null,
          location: createForm.location.trim() || null,
          website: createForm.website.trim() || null,
          contactemail: createForm.contactemail.trim() || null,
          rules: createForm.rules.length > 0 ? createForm.rules : null,
          member_count: 1,
          post_count: 0,
          is_active: true,
          last_activity: new Date().toISOString()
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Додаємо створювача як адміністратора
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupData.id,
          user_id: currentUser.id,
          role: 'admin'
        }]);

      if (memberError) throw memberError;

      addNotification({
        type: 'success',
        title: 'Успішно!',
        message: 'Група створена успішно!',
        autoClose: true,
        duration: 3000
      });

      setShowCreateModal(false);
      resetCreateForm();
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      addNotification({
        type: 'error',
        title: 'Помилка створення',
        message: 'Не вдалося створити групу',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: () => createGroup(e)
      });
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!currentUser) {
      addNotification({
        type: 'warning',
        title: 'Не авторизовано',
        message: 'Для приєднання до групи потрібно авторизуватися'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: currentUser.id,
          role: 'member'
        }]);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Успішно!',
        message: 'Ви приєдналися до групи!',
        autoClose: true,
        duration: 3000
      });

      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося приєднатися до групи',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: () => joinGroup(groupId)
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Успішно!',
        message: 'Ви покинули групу!',
        autoClose: true,
        duration: 3000
      });

      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося покинути групу',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      is_private: false,
      category: '',
      location: '',
      website: '',
      contactemail: '',
      rules: [],
      newRule: ''
    });
  };

  const addRule = () => {
    if (createForm.newRule.trim() && !createForm.rules.includes(createForm.newRule.trim())) {
      setCreateForm(prev => ({
        ...prev,
        rules: [...prev.rules, createForm.newRule.trim()],
        newRule: ''
      }));
    }
  };

  const removeRule = (rule: string) => {
    setCreateForm(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r !== rule)
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (categoryFilter) count++;
    if (typeFilter !== 'all') count++;
    if (membershipFilter !== 'all') count++;
    if (sortBy !== 'activity') count++;
    return count;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setTypeFilter('all');
    setMembershipFilter('all');
    setSortBy('activity');
  };

  const renderGroupCard = (group: Group) => {
    const isMember = !!group.user_membership;
    const isAdmin = group.user_membership?.role === 'admin';

    return (
      <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Group Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          {group.cover ? (
            <img src={group.cover} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          )}
          <div className="absolute top-3 right-3">
            {group.is_private ? (
              <Lock size={16} className="text-white" />
            ) : (
              <Globe size={16} className="text-white" />
            )}
          </div>
          {group.is_verified && (
            <div className="absolute top-3 left-3">
              <Star size={16} className="text-yellow-400 fill-current" />
            </div>
          )}
        </div>

        {/* Group Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-gray-600 font-semibold text-sm">
                    {getInitials(group.name)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 
                  className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  {group.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {group.member_count} учасників
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
            {group.description || 'Опис відсутній'}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center space-x-3">
              {group.category && (
                <span className="bg-gray-100 px-2 py-1 rounded-full">
                  {group.category}
                </span>
              )}
              {group.location && (
                <div className="flex items-center">
                  <MapPin size={12} className="mr-1" />
                  {group.location}
                </div>
              )}
            </div>
            <div className="flex items-center">
              <Calendar size={12} className="mr-1" />
              {formatDate(group.created_at)}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="flex items-center">
                <MessageCircle size={12} className="mr-1" />
                {group.post_count || 0}
              </div>
              <div className="flex items-center">
                <Eye size={12} className="mr-1" />
                {group.member_count}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!isMember ? (
                <button
                  onClick={() => joinGroup(group.id)}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <UserPlus size={14} className="mr-1" />
                  Приєднатися
                </button>
              ) : (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Eye size={14} className="mr-1" />
                    Переглянути
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => navigate(`/groups/${group.id}?tab=settings`)}
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      title="Керувати групою"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGroupList = (group: Group) => {
    const isMember = !!group.user_membership;
    const isAdmin = group.user_membership?.role === 'admin';

    return (
      <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            {group.avatar ? (
              <img src={group.avatar} alt={group.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-gray-600 font-semibold">
                {getInitials(group.name)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 
                className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                {group.name}
              </h3>
              {group.is_private ? (
                <Lock size={14} className="text-gray-500" />
              ) : (
                <Globe size={14} className="text-gray-500" />
              )}
              {group.is_verified && (
                <Star size={14} className="text-yellow-400 fill-current" />
              )}
            </div>
            
            <p className="text-gray-700 text-sm mb-2 line-clamp-1">
              {group.description || 'Опис відсутній'}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{group.member_count} учасників</span>
              <span>{group.post_count || 0} постів</span>
              {group.category && <span>{group.category}</span>}
              {group.location && (
                <div className="flex items-center">
                  <MapPin size={10} className="mr-1" />
                  {group.location}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isMember ? (
              <button
                onClick={() => joinGroup(group.id)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <UserPlus size={16} className="mr-2" />
                Приєднатися
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Eye size={16} className="mr-2" />
                  Переглянути
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate(`/groups/${group.id}?tab=settings`)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="Керувати групою"
                  >
                    <Settings size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Завантаження груп...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Error Notifications */}
        {notifications.map((notification) => (
          <ErrorNotification
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Групи</h1>
              <p className="text-gray-600">Знаходьте спільноти за інтересами та створюйте власні</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Створити групу
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Пошук груп..."
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

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Категорія</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Всі категорії</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Тип групи</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Всі</option>
                      <option value="public">Публічні</option>
                      <option value="private">Приватні</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Членство</label>
                    <select
                      value={membershipFilter}
                      onChange={(e) => setMembershipFilter(e.target.value as any)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Всі групи</option>
                      <option value="member">Мої групи</option>
                      <option value="not_member">Не член</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Сортувати за</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="activity">Активністю</option>
                      <option value="name">Назвою</option>
                      <option value="members">Кількістю учасників</option>
                      <option value="created">Датою створення</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Знайдено {filteredGroups.length} груп з {groups.length}
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

          {/* Results */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchQuery 
                ? `Знайдено ${filteredGroups.length} груп з ${groups.length}`
                : `Всього ${filteredGroups.length} груп`
              }
              {searchQuery && (
                <span> за запитом "<span className="font-semibold">{searchQuery}</span>"</span>
              )}
            </p>
          </div>

          {/* Groups Grid/List */}
          {filteredGroups.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {filteredGroups.map(group => 
                viewMode === 'grid' ? renderGroupCard(group) : renderGroupList(group)
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Груп не знайдено
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || getActiveFiltersCount() > 0
                  ? 'Спробуйте змінити критерії пошуку або фільтри'
                  : 'Поки що немає створених груп'
                }
              </p>
              {!searchQuery && getActiveFiltersCount() === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Створити першу групу
                </button>
              )}
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

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Створити нову групу</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={createGroup} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Назва групи *
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Введіть назву групи"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категорія
                    </label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Оберіть категорію</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Опис групи
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Розкажіть про вашу групу"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{createForm.description.length}/500</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Локація
                    </label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Місто, країна"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Веб-сайт
                    </label>
                    <input
                      type="url"
                      value={createForm.website}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email для зв'язку
                  </label>
                  <input
                    type="email"
                    value={createForm.contactemail}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, contactemail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Правила групи
                  </label>
                  <div className="space-y-2">
                    {createForm.rules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-700">{rule}</span>
                        <button
                          type="button"
                          onClick={() => removeRule(rule)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={createForm.newRule}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, newRule: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRule();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Додати правило"
                      />
                      <button
                        type="button"
                        onClick={addRule}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Додати
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={createForm.is_private}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, is_private: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Приватна група</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Приватні групи видимі тільки учасникам
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !createForm.name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Створення...' : 'Створити групу'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}