import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
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
  Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Groups() {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('public');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    isPrivate: false,
    avatar: null
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
      fetchMyGroups();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      setCurrentUser(userProfile);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          created_by_profile:user_profiles!groups_created_by_fkey(name, last_name, avatar)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          group:groups(
            *,
            created_by_profile:user_profiles!groups_created_by_fkey(name, last_name, avatar)
          )
        `)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setMyGroups(data?.map(member => member.group) || []);
    } catch (error) {
      console.error('Error fetching my groups:', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setCreating(true);
      
      let avatarUrl = null;
      if (newGroup.avatar) {
        const fileExt = newGroup.avatar.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `group-avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, newGroup.avatar);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: newGroup.name,
          description: newGroup.description,
          is_private: newGroup.isPrivate,
          avatar: avatarUrl,
          created_by: currentUser.id
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Додаємо створювача як адміна групи
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupData.id,
          user_id: currentUser.id,
          role: 'admin'
        }]);

      if (memberError) throw memberError;

      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', isPrivate: false, avatar: null });
      fetchGroups();
      fetchMyGroups();
      
      alert('Групу успішно створено!');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Помилка при створенні групи');
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async (groupId) => {
    try {
      if (!currentUser) return;

      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: currentUser.id,
          role: 'member'
        }]);

      if (error) throw error;

      fetchGroups();
      fetchMyGroups();
      alert('Ви успішно приєдналися до групи!');
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Помилка при приєднанні до групи');
    }
  };

  const isUserInGroup = (groupId) => {
    return myGroups.some(group => group.id === groupId);
  };

  const filteredGroups = (activeTab === 'public' ? groups : myGroups).filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !currentUser) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Групи</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Створити групу
              </button>
            </div>
            <p className="text-gray-600">Знайдіть спільноти за інтересами або створіть власну</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Пошук груп..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('public')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'public'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Відкриті групи
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'my'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Мої групи ({myGroups.length})
              </button>
            </div>
          </div>

          {/* Groups Grid */}
          {filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {/* Group Cover */}
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                    {group.avatar && (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 right-3">
                      {group.is_private ? (
                        <Lock size={16} className="text-white bg-black bg-opacity-50 p-1 rounded" />
                      ) : (
                        <Globe size={16} className="text-white bg-black bg-opacity-50 p-1 rounded" />
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Group Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Users size={14} className="mr-1" />
                          {group.member_count || 1} учасників
                        </div>
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(group.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {group.created_by_profile?.avatar ? (
                            <img
                              src={group.created_by_profile.avatar}
                              alt="Creator"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="ml-2">
                          <p className="text-xs text-gray-600">
                            {group.created_by_profile?.name} {group.created_by_profile?.last_name}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      {activeTab === 'public' && !isUserInGroup(group.id) ? (
                        <button
                          onClick={() => joinGroup(group.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Приєднатися
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/groups/${group.id}`)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Переглянути
                        </button>
                      )}
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
                {activeTab === 'public' ? 'Груп не знайдено' : 'Ви ще не приєдналися до жодної групи'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'public' 
                  ? 'Спробуйте змінити критерії пошуку'
                  : 'Приєднайтеся до відкритих груп або створіть власну'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Створити групу</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Назва групи *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введіть назву групи"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Опис
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Розкажіть про вашу групу"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Аватар групи
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <ImageIcon size={18} className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {newGroup.avatar ? newGroup.avatar.name : 'Вибрати файл'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setNewGroup({ ...newGroup, avatar: e.target.files[0] })}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newGroup.isPrivate}
                  onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                  Приватна група (тільки за запрошенням)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={creating || !newGroup.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}