import { NavLink, useNavigate } from 'react-router-dom';
import {
  UserCircle,
  MessageCircle,
  Users,
  Settings,
  LogOut,
  UsersIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200">
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-800">Соціальна мережа</h1>
      </div>
      <nav className="mt-8">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              isActive ? 'bg-gray-100' : ''
            }`
          }
        >
          <UserCircle className="w-5 h-5 mr-3" />
          Профіль
        </NavLink>
        <NavLink
          to="/people"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              isActive ? 'bg-gray-100' : ''
            }`
          }
        >
          <UsersIcon className="w-5 h-5 mr-3" />
          Люди
        </NavLink>
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              isActive ? 'bg-gray-100' : ''
            }`
          }
        >
          <MessageCircle className="w-5 h-5 mr-3" />
          Повідомлення
        </NavLink>
        <NavLink
          to="/friends"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              isActive ? 'bg-gray-100' : ''
            }`
          }
        >
          <Users className="w-5 h-5 mr-3" />
          Друзі
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              isActive ? 'bg-gray-100' : ''
            }`
          }
        >
          <Settings className="w-5 h-5 mr-3" />
          Налаштування
        </NavLink>
      </nav>
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Вийти
        </button>
      </div>
    </div>
  );
}