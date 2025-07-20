import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function LogoutMenuItem() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Помилка при виході:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full"
    >
      <LogOut className="w-5 h-5 mr-3" />
      Вийти
    </button>
  );
}