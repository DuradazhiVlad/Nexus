import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, MessageCircle, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: User, label: 'Профіль', path: '/profile' },
    { icon: Users, label: 'Люди', path: '/people' },
    { icon: Users, label: 'Групи', path: '/groups' },
    { icon: MessageCircle, label: 'Повідомлення', path: '/messages' },
    { icon: Settings, label: 'Налаштування', path: '/settings' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-40">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">SocialApp</h1>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : ''
              }`}
            >
              <Icon size={20} className="mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Вийти
        </button>
      </div>
    </div>
  );
}