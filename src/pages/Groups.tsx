import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/Sidebar';
import { Users, Lock, Globe } from 'lucide-react';

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

export function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && groupId) {
      loadGroup();
    }
  }, [currentUser, groupId]);

  async function getCurrentUser() {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    setCurrentUser(userData);
  }

  async function loadGroup() {
    if (!groupId || !currentUser) return;

    const { data: groupData } = await supabase
      .from('groups')
      .select(`*, creator:users!created_by(*)`)
      .eq('id', groupId)
      .single();

    if (!groupData) return;

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', currentUser.id)
      .single();

    setGroup({
      ...groupData,
      is_member: !!membership,
      user_role: membership?.role || null,
    });

    setLoading(false);
  }

  if (loading || !group) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8 text-center">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-4xl mx-auto">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden">
            {group.avatar ? (
              <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="text-gray-400" size={32} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {group.is_private ? <Lock size={16} className="text-gray-500" /> : <Globe size={16} className="text-gray-500" />}
            </div>
            <p className="text-sm text-gray-600">{group.member_count} учасників</p>
            {group.creator && (
              <p className="text-sm text-gray-500">Створено: {group.creator.name} {group.creator.lastname}</p>
            )}
            {group.is_member && (
              <p className="text-sm text-green-600 mt-1">Ви учасник цієї групи ({group.user_role})</p>
            )}
          </div>
        </div>

        {group.description && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Опис</h2>
            <p className="text-gray-700 whitespace-pre-line">{group.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
