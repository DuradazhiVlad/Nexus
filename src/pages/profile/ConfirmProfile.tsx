import React, { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ConfirmProfile() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResend = async () => {
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Не вдалося отримати користувача. Увійдіть знову.');
        return;
      }
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (resendError) throw resendError;
      setSuccess('Лист для підтвердження профілю надіслано повторно! Перевірте вашу пошту.');
    } catch (e: any) {
      setError(e.message || 'Не вдалося надіслати лист повторно.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md text-center">
          <Mail size={48} className="mx-auto text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Підтвердіть ваш профіль</h1>
          <p className="mb-4 text-gray-600">
            Ми надіслали лист для підтвердження на вашу електронну пошту. Будь ласка, перейдіть за посиланням у листі, щоб активувати профіль.
          </p>
          {success && (
            <div className="flex items-center text-green-600 mb-4 justify-center"><CheckCircle className="mr-2" /> {success}</div>
          )}
          {error && (
            <div className="flex items-center text-red-600 mb-4 justify-center"><AlertCircle className="mr-2" /> {error}</div>
          )}
          <button
            onClick={handleResend}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
          >
            {loading ? 'Відправка...' : 'Відправити лист повторно'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
          >
            Повернутися до входу
          </button>
        </div>
      </div>
    </div>
  );
}