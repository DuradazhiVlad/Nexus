import React, { useState, useEffect } from 'react';
import { X, Users, Lock, Globe, UserPlus, UserMinus, Settings, Crown, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

interface GroupMember {
  id: string;
  role: string;
  joined_at: string;
  user: User;
}

interface GroupDetailModalProps {
  group: Group;
  currentUser: User | null;
  onClose: () => void;
  onGroupUpdated: () => void;
  onJoinGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
}

export function GroupDetailModal({ 
  group, 
  currentUser, 
  onClose, 
  onGroupUpdated, 
  onJoinGroup, 
  onLeaveGroup 
}: GroupDetailModalProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');

  useEffect(() => {
    if (group.is_member) {
      loadMembers();
    } else {
      setLoading(false);
    }
  }, [group.id, group.is_member]);

  async function loadMembers() {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users!group_members_user_id_fkey(*)
        `)
        .eq('group_id', group.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown size={14} className="text-yellow-600" />;
      case 'moderator':
        return <Shield size={14} className="text-blue-600" />;
      default:
        return <Users size={14} className="text-gray-600" />;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
              {group.avatar ? (
                <img 
                  src={group.avatar} 
                  alt={group.name} 
                  className="w-full h-full rounded-lg object-cover" 
                />
              ) : (
                <Users size={20} className="text-gray-600" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
                {group.is_private ? (
                  <Lock size={16} className="text-gray-500" />
                ) : (
                  <Globe size={16} className="text-gray-500" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                {group.member_count} {group.member_count === 1 ? 'учасник' : 'учасників'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Інформація
          </button>
          {group.is_member && (
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Учасники ({group.member_count})
            </button>
          )}
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {group.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Опис</h3>
                  <p className="text-gray-700 leading-relaxed">{group.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Деталі</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Тип групи:</span>
                    <span className="text-gray-900">
                      {group.is_private ? 'Приватна' : 'Публічна'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Створено:</span>
                    <span className="text-gray-900">
                      {new Date(group.created_at).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  {group.creator && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Створив:</span>
                      <span className="text-gray-900">
                        {group.creator.name} {group.creator.lastname}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">Завантаження...</div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {member.user.avatar ? (
                          <img 
                            src={member.user.avatar} 
                            alt={member.user.name} 
                            className="w-full h-full rounded-full object-cover" 
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {member.user.name[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.user.name} {member.user.lastname}
                        </p>
                        <p className="text-sm text-gray-500">
                          Приєднався {new Date(member.joined_at).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member.role)}
                      <span className="text-sm text-gray-600">
                        {getRoleText(member.role)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {group.is_member ? (
            <div className="flex space-x-3">
              {group.user_role === 'admin' && (
                <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Settings size={16} className="mr-2" />
                  Налаштування
                </button>
              )}
              {group.user_role !== 'admin' && (
                <button
                  onClick={() => {
                    onLeaveGroup(group.id);
                    onClose();
                  }}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <UserMinus size={16} className="mr-2" />
                  Вийти з групи
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                onJoinGroup(group.id);
                onClose();
              }}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus size={16} className="mr-2" />
              Приєднатися до групи
            </button>
          )}
        </div>
      </div>
    </div>
  );
}