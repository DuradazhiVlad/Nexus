import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Plus, Lock, Globe, UserPlus, Settings } from 'lucide-react';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { GroupDetailModal } from '../components/GroupDetailModal';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar: string | null;
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
  is_member?: boolean;
  user_role?: string;
}

export function Groups() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadGroups();
    }
  }, [currentUser, searchQuery]);

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
    } finally {
      setLoading(false);
    }
  }

  async function loadGroups() {
    if (!currentUser) return;

    try {
      let query = supabase
        .from('groups')
        .select(`
          *,
          creator:users!groups_created_by_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data: groupsData, error: groupsError } = await query;

      if (groupsError) throw groupsError;

      // Check membership status for each group
      const groupsWithMembership = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: membership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', group.id)
            .eq('user_id', currentUser.id)
            .single();

          return {
            ...group,
            is_member: !!membership,
            user_role: membership?.role
          };
        })
      );

      setGroups(groupsWithMembership);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }

  async function joinGroup(groupId: string) {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupId,
            user_id: currentUser.id,
            role: 'member'
          }
        ]);

      if (error) throw error;

      loadGroups(); // Refresh groups list
    } catch (error) {
      console.error('Error joining group:', error);
    }
  }

  async function leaveGroup(groupId: string) {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      loadGroups(); // Refresh groups list
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  }

  function openGroupDetail(group: Group) {
    setSelectedGroup(group);
    setShowDetailModal(true);
  }

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Групи</h1>
                <p className="text-gray-600">Знайдіть цікаві групи або створіть власну</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Створити групу
              </button>
            </div>

            {/* Пошук */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Пошук груп..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Список груп */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Групи не знайдено' : 'Немає груп'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? 'Спробуйте змінити пошуковий запит' 
                    : 'Створіть першу групу або приєднайтеся до існуючої'
                  }
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => openGroupDetail(group)}
                  >
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                        {group.avatar ? (
                          <img 
                            src={group.avatar} 
                            alt={group.name} 
                            className="w-full h-full rounded-lg object-cover" 
                          />
                        ) : (
                          <Users size={24} className="text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                          {group.is_private ? (
                            <Lock size={14} className="text-gray-500" />
                          ) : (
                            <Globe size={14} className="text-gray-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {group.member_count} {group.member_count === 1 ? 'учасник' : 'учасників'}
                        </p>
                        {group.description && (
                          <p className="text-sm text-gray-700 line-clamp-2">{group.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-4">
                    {group.is_member ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openGroupDetail(group);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Переглянути
                        </button>
                        {group.user_role !== 'admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              leaveGroup(group.id);
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                          >
                            Вийти
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinGroup(group.id);
                        }}
                        className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <UserPlus size={14} className="mr-2" />
                        Приєднатися
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Модальні вікна */}
      {showCreateModal && (
        <CreateGroupModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={loadGroups}
        />
      )}

      {showDetailModal && selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          currentUser={currentUser}
          onClose={() => setShowDetailModal(false)}
          onGroupUpdated={loadGroups}
          onJoinGroup={joinGroup}
          onLeaveGroup={leaveGroup}
        />
      )}
    </div>
  );
}