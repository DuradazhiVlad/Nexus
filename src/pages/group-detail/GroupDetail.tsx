import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DatabaseService } from '../../lib/database';
import { Group } from '../types';
import { toast } from 'sonner';

export function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await DatabaseService.getCurrentUser();
        setCurrentUser(user);

        const { data, error } = await DatabaseService.supabase
          .from('groups')
          .select(`
            *,
            creator:created_by (name, last_name, avatar),
            members:group_members (user_id, role, users (id, name, last_name, avatar))
          `)
          .eq('id', groupId)
          .single();

        if (error) throw error;
        setGroup(data);
      } catch (e) {
        setError("Не вдалося завантажити дані групи.");
        console.error("Error loading group data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupData();
  }, [groupId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Завантаження...</div>;
  }
  
  if (error || !group) {
    return <div className="text-center text-red-500 mt-10">Помилка: {error || 'Групу не знайдено.'}</div>;
  }

  // Визначення ролі поточного користувача
  const currentUserRole = group.members.find(m => m.user_id === currentUser?.id)?.role;
  const isCreator = group.created_by === currentUser?.id;
  const isMember = !!currentUserRole;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Panel: Post Creation & Feed */}
        <div className="w-full lg:w-3/5 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Створити допис</h2>
            {/* Тут буде компонент для створення нового посту */}
            {isMember ? (
              <p>Тут форма для створення посту</p>
            ) : (
              <p className="text-gray-500">Ви маєте приєднатися до групи, щоб створювати дописи.</p>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Стіна групи</h2>
            {/* Тут буде компонент для відображення постів */}
            <p>Тут відображатимуться всі дописи групи</p>
          </div>
        </div>

        {/* Right Panel: Creator & Members */}
        <div className="w-full lg:w-2/5 order-1 lg:order-2">
          {/* Creator Block */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Творець групи</h3>
            <div className="flex items-center space-x-4">
              <img src={group.creator?.avatar || '/default-avatar.png'} alt="Creator avatar" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-medium text-gray-900">{group.creator?.name} {group.creator?.last_name}</p>
                <span className="text-sm text-gray-500">Творець</span>
              </div>
            </div>
          </div>

          {/* Members Block */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Учасники ({group.members.length})</h3>
            <ul className="space-y-4">
              {group.members.map(member => (
                <li key={member.user_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={member.users?.avatar || '/default-avatar.png'} alt="Member avatar" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-medium text-gray-900">{member.users?.name} {member.users?.last_name}</p>
                      <span className="text-sm text-gray-500">{member.role}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}