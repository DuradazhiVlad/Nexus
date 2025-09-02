import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  UserCircle,
  MessageCircle,
  Users,
  Settings,
  LogOut,
  UsersIcon,
  Users2,
  Video,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 lg:hidden"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
      }`}>
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
          to="/reels"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              isActive ? 'bg-gray-100' : ''
            }`
          }
        >
          <Video className="w-5 h-5 mr-3" />
          Рілс
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
          to="/groups"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              isActive ? 'bg-gray-100' : ''
            }`
          }
        >
          <Users2 className="w-5 h-5 mr-3" />
          Групи
        </NavLink>
        <NavLink
          to="/dating"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              isActive ? 'bg-gray-100' : ''
            }`
          }
        >
          <Heart className="w-5 h-5 mr-3" />
          Знайомства
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
    </>
  );
}