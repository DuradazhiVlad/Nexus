import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { VideoUploadModal } from '../../components/VideoUploadModal';
import { 
  Search, 
  Plus, 
  Users, 
  Lock, 
  Globe, 
  Calendar,
  User,
  X,
  Upload,
  Image as ImageIcon,
  Filter,
  ChevronDown,
  SlidersHorizontal,
  Grid,
  List,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  UserPlus,
  UserCheck,
  Crown,
  Shield,
  Star,
  TrendingUp,
  Clock,
  MapPin,
  Hash,
  Settings,
  ExternalLink,
  Copy,
  Flag,
  AlertCircle,
  CheckCircle,
  Activity,
  Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  cover?: string;
  is_private: boolean;
  created_at: string;
  created_by: string;
  member_count: number;
  post_count: number;
  category: string;
  tags: string[];
  location?: string;
  rules?: string[];
  is_verified?: boolean;
  is_active?: boolean;
  last_activity?: string;
  website?: string;
  contactemail?: string;
  creator?: {
    id: string;
    name: string;
    last_name: string;
    avatar: string;
  };
}

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at?: string;
  user?: {
    id: string;
    name: string;
    last_name: string;
    avatar: string;
  };
}

interface Filters {
  category: string;
          member_count: 'all' | 'small' | 'medium' | 'large';
  privacy: 'all' | 'public' | 'private';
  activity: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'members' | 'activity' | 'created' | 'popularity';
  sortOrder: 'asc' | 'desc';
  hasAvatar: boolean;
      is_verified: boolean;
}

type ViewMode = 'grid' | 'list';
type TabType = 'explore' | 'my-groups' | 'joined' | 'managed' | 'invitations';

const CATEGORIES = [
  'Технології',
  'Мистецтво',
  'Спорт',
  'Музика',
  'Освіта',
  'Бізнес',
  'Подорожі',
  'Їжа',
  'Фотографія',
  'Ігри',
  'Книги',
  'Фільми',
  'Наука',
  'Природа',
  'Мода',
  'Здоров\'я',
  'Інше'
];

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [managedGroups, setManagedGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [selectedGroupForVideo, setSelectedGroupForVideo] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const [filters, setFilters] = useState<Filters>({
    category: '',
    member_count: 'all',
    privacy: 'all',
    activity: 'all',
    sortBy: 'activity',
    sortOrder: 'desc',
    hasAvatar: false,
    is_verified: false
  });

  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const navigate = useNavigate();

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: '',
    is_private: false,
    avatar: null as File | null,
    cover: null as File | null,
    tags: [] as string[],
    location: '',
    website: '',
    rules: [''],
    contactemail: ''
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, groups, myGroups, joinedGroups, managedGroups, invitations, filters, activeTab]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      setCurrentUser(authUser.id);
    } catch (error) {
      console.error('Error fetching current user:', error);
      navigate('/login');
    }
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchGroups(),
        fetchMyGroups(),
        fetchJoinedGroups(),
        fetchManagedGroups(),
        fetchInvitations(),
        fetchGroupMembers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        // Використовуємо демо-дані якщо користувач не авторизований
        const demoGroups: Group[] = [
          {
            id: '1',
            name: 'Програмісти України',
            description: 'Спільнота українських розробників',
            avatar: undefined,
            cover: undefined,
            is_private: false,
            created_at: new Date().toISOString(),
            created_by: 'demo-user',
            member_count: 1245,
            post_count: 156,
            category: 'technology',
            tags: ['JavaScript', 'Python', 'React'],
            location: 'Київ',
            rules: ['Будьте поважні', 'Використовуйте теги'],
            contactemail: 'admin@example.com',
            website: 'https://example.com',
            is_verified: false,
            is_active: true,
            last_activity: new Date().toISOString(),
            creator: {
              id: 'demo-user',
              name: 'Демонстрація',
              last_name: 'Користувач',
              avatar: 'https://via.placeholder.com/50'
            }
          }
        ];
        setGroups(demoGroups);
        return;
      }

      const { data, error } = await supabase
        .from('groups')
        .select(`*, creator:user_profiles!groups_created_by_fkey (id, name, last_name, avatar)`)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Використовуємо реальні дані з бази
      const enrichedGroups = (data || []).map(group => ({
        ...group,
        creator: group.creator
      }));

      setGroups(enrichedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };

  const fetchMyGroups = async () => {
    try {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', currentUser)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyGroups(data || []);
    } catch (error) {
      console.error('Error fetching my groups:', error);
      setMyGroups([]);
    }
  };

  const fetchJoinedGroups = async () => {
    try {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          groups (*, creator:user_profiles!groups_created_by_fkey (id, name, last_name, avatar)),
          user:user_profiles!group_members_user_id_fkey (id, name, last_name, avatar)
        `)
        .eq('user_id', currentUser)
        .eq('role', 'member');

      if (error) throw error;
      setJoinedGroups(data?.map(item => ({
        ...item.groups,
        creator: item.creator,
        user: item.user
      })).filter(Boolean) || []);
    } catch (error) {
      console.error('Error fetching joined groups:', error);
      setJoinedGroups([]);
    }
  };

  const fetchManagedGroups = async () => {
    try {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          groups (*, creator:user_profiles!groups_created_by_fkey (id, name, last_name, avatar)),
          user:user_profiles!group_members_user_id_fkey (id, name, last_name, avatar)
        `)
        .eq('user_id', currentUser)
        .in('role', ['admin', 'moderator']);

      if (error) throw error;
      setManagedGroups(data?.map(item => ({
        ...item.groups,
        creator: item.creator,
        user: item.user
      })).filter(Boolean) || []);
    } catch (error) {
      console.error('Error fetching managed groups:', error);
      setManagedGroups([]);
    }
  };

  const fetchInvitations = async () => {
    try {
      if (!currentUser) return;

      // Симулюємо запрошення
      setInvitations([]);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`*, user:user_profiles!group_members_user_id_fkey (id, name, last_name, avatar)`);

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
      setGroupMembers([]);
    }
  };

  const getGroupsForCurrentTab = () => {
    switch (activeTab) {
      case 'explore':
        return groups;
      case 'my-groups':
        return myGroups;
      case 'joined':
        return joinedGroups;
      case 'managed':
        return managedGroups;
      case 'invitations':
        return invitations;
      default:
        return groups;
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = getGroupsForCurrentTab();

    // Пошук
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        group.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фільтри
    if (filters.category) {
      filtered = filtered.filter(group => group.category === filters.category);
    }

    if (filters.member_count !== 'all') {
      filtered = filtered.filter(group => {
        const count = group.member_count || 0;
        switch (filters.member_count) {
          case 'small': return count < 50;
          case 'medium': return count >= 50 && count < 200;
          case 'large': return count >= 200;
          default: return true;
        }
      });
    }

    if (filters.privacy !== 'all') {
      filtered = filtered.filter(group => 
        filters.privacy === 'public' ? !group.is_private : group.is_private
      );
    }

    if (filters.activity !== 'all') {
      filtered = filtered.filter(group => 
        filters.activity === 'active' ? group.is_active : !group.is_active
      );
    }

    if (filters.hasAvatar) {
      filtered = filtered.filter(group => group.avatar);
    }

    if (filters.is_verified) {
      filtered = filtered.filter(group => group.is_verified);
    }

    // Сортування
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'members':
          comparison = (a.member_count || 0) - (b.member_count || 0);
          break;
        case 'activity':
          if (a.is_active && !b.is_active) comparison = -1;
          else if (!a.is_active && b.is_active) comparison = 1;
          else comparison = new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime();
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'popularity':
          comparison = (a.member_count || 0) + (a.post_count || 0) - ((b.member_count || 0) + (b.post_count || 0));
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredGroups(filtered);
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) return;

    setCreating(true);
    try {
      // Якщо користувач не авторизований, показуємо повідомлення
      if (!currentUser) {
        alert('Для створення групи потрібно авторизуватися');
        setCreating(false);
        return;
      }
      const groupData = {
        name: newGroup.name.trim(),
        description: newGroup.description.trim() || null,
        is_private: newGroup.is_private,
        created_by: currentUser,
        category: newGroup.category || null,
        tags: newGroup.tags.length > 0 ? newGroup.tags : null,
        location: newGroup.location || null,
        website: newGroup.website || null,
        contactemail: newGroup.contactemail || null,
        rules: newGroup.rules.filter(rule => rule.trim()).length > 0 ? newGroup.rules.filter(rule => rule.trim()) : null
      };

      const { data, error } = await supabase
        .from('groups')
        .insert([groupData])
        .select()
        .single();

      if (error) throw error;

      // Додаємо створювача як члена групи з роллю admin
      await supabase
        .from('group_members')
        .insert([{
          group_id: data.id,
          user_id: currentUser,
          role: 'admin'
        }]);

      alert('Групу успішно створено!');
      setShowCreateModal(false);
      resetNewGroup();
      fetchAllData();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Помилка при створенні групи');
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      const existingMember = groupMembers.find(
        member => member.group_id === groupId && member.user_id === currentUser
      );

      if (existingMember) {
        alert('Ви вже є членом цієї групи!');
        return;
      }

      await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: currentUser,
          role: 'member'
        }]);

      alert('Ви успішно приєдналися до групи!');
      fetchAllData();
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Помилка при приєднанні до групи');
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser);

      alert('Ви покинули групу!');
      fetchAllData();
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Помилка при виході з групи');
    }
  };

  const getUserRole = (groupId: string) => {
    const member = groupMembers.find(
      member => member.group_id === groupId && member.user_id === currentUser
    );
    return member?.role || null;
  };

  const isGroupCreator = (group: Group) => {
    return group.created_by === currentUser;
  };

  const toggleGroupSelection = (groupId: string) => {
    const newSelection = new Set(selectedGroups);
    if (newSelection.has(groupId)) {
      newSelection.delete(groupId);
    } else {
      newSelection.add(groupId);
    }
    setSelectedGroups(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const clearSelection = () => {
    setSelectedGroups(new Set());
    setShowBulkActions(false);
  };

  const bulkJoinGroups = async () => {
    for (const groupId of selectedGroups) {
      await joinGroup(groupId);
    }
    clearSelection();
  };

  const resetNewGroup = () => {
    setNewGroup({
      name: '',
      description: '',
      category: '',
      is_private: false,
      avatar: null,
      cover: null,
      tags: [],
      location: '',
      website: '',
      rules: [''],
      contactemail: ''
    });
  };

  const handleVideoUpload = (groupId: string) => {
    setSelectedGroupForVideo(groupId);
    setShowVideoUpload(true);
  };

  const handleVideoUploadComplete = (videoData: any) => {
    console.log('Video uploaded to group:', selectedGroupForVideo, videoData);
    // Тут буде логіка завантаження відео в групу
    setShowVideoUpload(false);
    setSelectedGroupForVideo('');
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      member_count: 'all',
      privacy: 'all',
      activity: 'all',
      sortBy: 'activity',
      sortOrder: 'desc',
      hasAvatar: false,
      is_verified: false
    });
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.member_count !== 'all') count++;
    if (filters.privacy !== 'all') count++;
    if (filters.activity !== 'all') count++;
    if (filters.sortBy !== 'activity' || filters.sortOrder !== 'desc') count++;
    if (filters.hasAvatar) count++;
    if (filters.is_verified) count++;
    return count;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastActivity = (last_activity?: string) => {
    if (!last_activity) return 'Немає активності';
    
    const diff = Date.now() - new Date(last_activity).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) return `${hours} год тому`;
    return `${days} дн тому`;
  };

  const addRule = () => {
    setNewGroup(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }));
  };

  const removeRule = (index: number) => {
    setNewGroup(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const updateRule = (index: number, value: string) => {
    setNewGroup(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const renderGroupCard = (group: Group) => {
    const userRole = getUserRole(group.id);
    const isCreator = isGroupCreator(group);
    const isSelected = selectedGroups.has(group.id);

    if (viewMode === 'list') {
      return (
        <div
          key={group.id}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className="relative">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleGroupSelection(group.id)}
                className="absolute top-0 left-0 w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold overflow-hidden ml-6">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{group.name[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900 truncate">{group.name}</h3>
                {group.is_verified && (
                  <CheckCircle size={20} className="text-blue-500" />
                )}
                {group.is_private ? (
                  <Lock size={16} className="text-gray-400" />
                ) : (
                  <Globe size={16} className="text-green-500" />
                )}
                {isCreator && (
                  <Crown size={16} className="text-yellow-500" />
                )}
                {userRole === 'admin' && (
                  <Shield size={16} className="text-purple-500" />
                )}
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {group.description}
              </p>

              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                <div className="flex items-center">
                  <Users size={14} className="mr-1" />
                  {group.member_count} учасників
                </div>
                <div className="flex items-center">
                  <MessageCircle size={14} className="mr-1" />
                  {group.post_count} постів
                </div>
                <div className="flex items-center">
                  <Activity size={14} className="mr-1" />
                  {formatLastActivity(group.last_activity)}
                </div>
                {group.location && (
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1" />
                    {group.location}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {group.category}
                </span>
                {group.tags?.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              {isCreator ? (
                <>
                  <button
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                  >
                    Управління
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoUpload(group.id);
                    }}
                    className="flex items-center justify-center space-x-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                  >
                    <Video size={14} />
                    <span>Додати відео</span>
                  </button>
                </>
              ) : userRole ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Переглянути
                  </button>
                  <button
                    onClick={() => leaveGroup(group.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Покинути
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => joinGroup(group.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Приєднатися
                </button>
              )}
              
              <button className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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
        key={group.id}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group hover:scale-105 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => navigate(`/groups/${group.id}`)}
      >
        <div className="relative">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleGroupSelection(group.id);
            }}
            className="absolute top-3 left-3 w-4 h-4 rounded border-gray-300 text-blue-600 z-10"
          />
          
          {/* Cover image */}
          <div className="h-32 bg-gradient-to-r from-purple-500 to-blue-600 relative">
            {group.cover && (
              <img
                src={group.cover}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-3 right-3 flex space-x-1">
                              {group.is_verified && (
                <CheckCircle size={16} className="text-white" />
              )}
              {group.is_private ? (
                <Lock size={16} className="text-white" />
              ) : (
                <Globe size={16} className="text-white" />
              )}
            </div>
          </div>

          <div className="p-4">
            {/* Avatar and title */}
            <div className="flex items-start space-x-3 mb-3 -mt-8">
              <div className="w-16 h-16 bg-white rounded-lg border-4 border-white shadow-lg flex items-center justify-center text-purple-600 text-xl font-bold overflow-hidden">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span>{group.name[0]?.toUpperCase()}</span>
                )}
              </div>
              
              <div className="flex-1 mt-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {group.name}
                  </h3>
                  {isCreator && (
                    <Crown size={16} className="text-yellow-500" />
                  )}
                  {userRole === 'admin' && (
                    <Shield size={16} className="text-purple-500" />
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {group.description}
            </p>

            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center">
                <Users size={14} className="mr-1" />
                {group.member_count}
              </div>
              <div className="flex items-center">
                <MessageCircle size={14} className="mr-1" />
                {group.post_count}
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${group.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {group.is_active ? 'Активна' : 'Неактивна'}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {group.category}
              </span>
              {group.location && (
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin size={12} className="mr-1" />
                  {group.location}
                </div>
              )}
            </div>

            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
              {isCreator ? (
                <button
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                >
                  <Settings size={16} className="mr-1" />
                  Управління
                </button>
              ) : userRole ? (
                <button
                  onClick={() => leaveGroup(group.id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  <X size={16} className="mr-1" />
                  Покинути
                </button>
              ) : (
                <button
                  onClick={() => joinGroup(group.id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <UserPlus size={16} className="mr-1" />
                  Приєднатися
                </button>
              )}
              
              <button className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 size={16} />
              </button>
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
            <p className="mt-4 text-gray-600">Завантаження груп...</p>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Групи</h1>
              <p className="text-gray-600">Знайдіть спільноти за вашими інтересами або створіть власну</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Створити групу
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'explore', label: 'Дослідити', count: groups.length },
              { id: 'my-groups', label: 'Мої групи', count: myGroups.length },
              { id: 'joined', label: 'Приєднані', count: joinedGroups.length },
              { id: 'managed', label: 'Керую', count: managedGroups.length },
              { id: 'invitations', label: 'Запрошення', count: invitations.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">
                  Обрано {selectedGroups.size} груп
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={bulkJoinGroups}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Приєднатися до всіх
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Категорія</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Всі категорії</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Розмір</label>
                    <select
                                      value={filters.member_count}
                onChange={(e) => setFilters(prev => ({ ...prev, member_count: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Всі розміри</option>
                      <option value="small">Мала (&lt;50)</option>
                      <option value="medium">Середня (50-200)</option>
                      <option value="large">Велика (&gt;200)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Приватність</label>
                    <select
                      value={filters.privacy}
                      onChange={(e) => setFilters(prev => ({ ...prev, privacy: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Всі</option>
                      <option value="public">Публічні</option>
                      <option value="private">Приватні</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Активність</label>
                    <select
                      value={filters.activity}
                      onChange={(e) => setFilters(prev => ({ ...prev, activity: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Всі</option>
                      <option value="active">Активні</option>
                      <option value="inactive">Неактивні</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Сортування</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="activity">Активністю</option>
                      <option value="name">Назвою</option>
                      <option value="members">Кількістю учасників</option>
                      <option value="created">Датою створення</option>
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
                      <span className="text-sm text-gray-700">Тільки з аватаром</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                                        checked={filters.is_verified}
                onChange={(e) => setFilters(prev => ({ ...prev, is_verified: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm text-gray-700">Тільки верифіковані</span>
                    </label>

                    <button
                      onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <TrendingUp size={16} className="mr-1" />
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

          {/* Results */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchQuery 
                ? `Знайдено ${filteredGroups.length} груп з ${getGroupsForCurrentTab().length}`
                : `Всього ${filteredGroups.length} груп`
              }
              {searchQuery && (
                <span> за запитом "<span className="font-semibold">{searchQuery}</span>"</span>
              )}
            </p>
            
            {selectedGroups.size > 0 && (
              <button
                onClick={() => {
                  if (selectedGroups.size === filteredGroups.length) {
                    clearSelection();
                  } else {
                    setSelectedGroups(new Set(filteredGroups.map(g => g.id)));
                    setShowBulkActions(true);
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedGroups.size === filteredGroups.length ? 'Скасувати вибір' : 'Обрати всі'}
              </button>
            )}
          </div>

          {/* Groups Grid/List */}
          {filteredGroups.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {filteredGroups.map(renderGroupCard)}
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
              {searchQuery || getActiveFiltersCount() > 0 ? (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Скинути всі фільтри
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} className="mr-2" />
                  Створити першу групу
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Створити групу</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Назва групи *
                  </label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Введіть назву групи"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Опис
                  </label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Розкажіть про вашу групу"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категорія
                    </label>
                    <select
                      value={newGroup.category}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Оберіть категорію</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Місцезнаходження
                    </label>
                    <input
                      type="text"
                      value={newGroup.location}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Місто, країна"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Веб-сайт
                  </label>
                  <input
                    type="url"
                    value={newGroup.website}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email для зв'язку
                  </label>
                  <input
                    type="email"
                                    value={newGroup.contactemail}
                onChange={(e) => setNewGroup(prev => ({ ...prev, contactemail: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@example.com"
                  />
                </div>

                {/* Rules */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Правила групи
                  </label>
                  <div className="space-y-2">
                    {newGroup.rules.map((rule, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => updateRule(index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Правило ${index + 1}`}
                        />
                        {newGroup.rules.length > 1 && (
                          <button
                            onClick={() => removeRule(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addRule}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Додати правило
                    </button>
                  </div>
                </div>

                {/* Privacy */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newGroup.is_private}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, is_private: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 mr-3"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Приватна група</span>
                      <p className="text-sm text-gray-500">
                        Тільки запрошені користувачі зможуть приєднатися до групи
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={createGroup}
                  disabled={creating || !newGroup.name.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Створення...' : 'Створити групу'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={showVideoUpload}
        onClose={() => {
          setShowVideoUpload(false);
          setSelectedGroupForVideo('');
        }}
        onUpload={handleVideoUploadComplete}
        groupId={selectedGroupForVideo}
      />
    </div>
  );
}