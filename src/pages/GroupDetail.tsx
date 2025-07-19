import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Lock, 
  Globe, 
  UserPlus, 
  UserMinus, 
  Settings, 
  Crown, 
  Shield, 
  Calendar,
  ArrowLeft,
  MessageCircle,
  FileText
} from 'lucide-react';
import { GroupPostForm } from '../components/GroupPostForm';
import { GroupPostsList } from '../components/GroupPostsList';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  member_count: number;
  creator?: User;
}

interface GroupMember {
  id: string;
  role: string;
  joined_at: string;
  user: User;
}

export function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [userMembership, setUserMembership] = useState<GroupMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');
  const [postsRefreshTrigger, setPostsRefreshTrigger] = useState(0);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && groupId) {
      loadGroupData();
    }
  }, [currentUser, groupId]);

  async function getCurrentUser() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      setCurrentUser(userData);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  }

  async function loadGroupData() {
    if (!currentUser || !groupId) return;

    try {
      // Завантажити дані групи
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          creator:users!created_by(*)
        `)
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error loading group:', groupError);
        navigate('/groups');
        return;
      }

      setGroup(groupData);

      // Перевірити членство користувача
      const { data: membershipData } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users!group_members_user_id_fkey(*)
        `)
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .single();

      setUserMembership(membershipData);

      // Завантажити членів групи (тільки якщо користувач є членом або група публічна)
      if (membershipData || !groupData.is_private) {
        await loadMembers();
      }
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users!group_members_user_id_fkey(*)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  async function joinGroup() {
    if (!currentUser || !groupId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: currentUser.id,
        role: 'member'
      });

      if (error) throw error;

      await loadGroupData();
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function leaveGroup() {
    if (!currentUser || !groupId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      await loadGroupData();
    } catch (error) {
      console.error('Error leaving group:', error);
    } finally {
      setActionLoading(false);
    }
  }

  const handlePostCreated = () => {
    setPostsRefreshTrigger(prev => prev + 1);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown size={16} className="text-yellow-600" />;
      case 'moderator':
        return <Shield size={16} className="text-blue-600" />;
      default:
        return <Users size={16} className="text-gray-600" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Адміністратор';
      case 'moderator':
        return 'Модератор';
      default:
        return 'Учасник';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Група не знайдена</h2>
            <button
              onClick={() => navigate('/groups')}
              className="text-blue-600 hover:text-blue-800"
            >
              Повернутися до груп
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = userMembership?.role === 'admin';
  const isMember = !!userMembership;
  const canViewMembers = isMember || !group.is_private;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Навігація назад */}
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Назад до груп
          </button>

          {/* Заголовок групи */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center">
                    {group.avatar ? (
                      <img 
                        src={group.avatar} 
                        alt={group.name} 
                        className="w-full h-full rounded-lg object-cover" 
                      />
                    ) : (
                      <Users size={32} className="text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                      {group.is_private ? (
                        <Lock size={24} className="text-gray-500" />
                      ) : (
                        <Globe size={24} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <span>{group.member_count} учасників</span>
                      <span>•</span>
                      <span>{group.is_private ? 'Приватна' : 'Публічна'} група</span>
                      <span>•</span>
                      <span>Створено {new Date(group.created_at).toLocaleDateString('uk-UA')}</span>
                    </div>
                    {group.creator && (
                      <p className="text-sm text-gray-500 mt-1">
                        Створив: {group.creator.name} {group.creator.lastname}
                      </p>
                    )}
                  </div>
                </div>

                {/* Дії */}
                <div className="flex space-x-3">
                  {isMember ? (
                    <>
                      {isAdmin && (
                        <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                          <Settings size={16} className="mr-2" />
                          Налаштування
                        </button>
                      )}
                      <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <MessageCircle size={16} className="mr-2" />
                        Чат групи
                      </button>
                      {!isAdmin && (
                        <button
                          onClick={leaveGroup}
                          disabled={actionLoading}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          <UserMinus size={16} className="mr-2" />
                          {actionLoading ? 'Завантаження...' : 'Вийти'}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={joinGroup}
                      disabled={actionLoading}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <UserPlus size={16} className="mr-2" />
                      {actionLoading ? 'Завантаження...' : 'Приєднатися'}
                    </button>
                  )}
                </div>
              </div>

              {/* Опис групи */}
              {group.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Про групу</h3>
                  <p className="text-gray-700 leading-relaxed">{group.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Вкладки */}
          {isMember && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'posts'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText size={16} className="inline mr-2" />
                  Пости
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'members'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users size={16} className="inline mr-2" />
                  Учасники ({group.member_count})
                </button>
              </div>
            </div>
          )}

          {/* Контент вкладок */}
          {isMember && activeTab === 'posts' && (
            <div className="space-y-6">
              {/* Форма створення посту */}
              <GroupPostForm 
                groupId={group.id}
                currentUser={currentUser}
                onPostCreated={handlePostCreated}
              />
              
              {/* Список постів */}
              <GroupPostsList 
                groupId={group.id}
                currentUser={currentUser}
                refreshTrigger={postsRefreshTrigger}
              />
            </div>
          )}

          {/* Учасники */}
          {canViewMembers && (!isMember || activeTab === 'members') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Учасники ({members.length})
                </h2>
              </div>
              <div className="p-6">
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Немає учасників</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            {member.user.avatar ? (
                              <img 
                                src={member.user.avatar} 
                                alt={member.user.name} 
                                className="w-full h-full rounded-full object-cover" 
                              />
                            ) : (
                              <span className="text-lg font-medium text-gray-600">
                                {member.user.name[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.user.name} {member.user.lastname}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Calendar size={12} />
                              <span>Приєднався {new Date(member.joined_at).toLocaleDateString('uk-UA')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(member.role)}
                          <span className="text-sm text-gray-600">
                            {getRoleText(member.role)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Повідомлення для приватних груп */}
          {!canViewMembers && !isMember && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Lock size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Приватна група</h3>
              <p className="text-gray-500 mb-4">
                Приєднайтеся до групи, щоб побачити учасників та контент
              </p>
              <button
                onClick={joinGroup}
                disabled={actionLoading}
                className="flex items-center mx-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <UserPlus size={16} className="mr-2" />
                {actionLoading ? 'Завантаження...' : 'Приєднатися до групи'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}