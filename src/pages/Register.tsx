import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Register() {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              auth_user_id: authData.user.id,
              name,
              lastname: lastName,
              email,
              date: new Date().toISOString(),
            }
          ]);

        if (profileError) throw profileError;

        navigate('/profile');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Створення нового аккаунту
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Або{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            увійдіть в існуючий аккаунт
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Ім'я
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введіть ім'я"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Прізвище
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="appearance-none block w-full px-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введіть прізвище"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введіть email"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Пароль
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введіть пароль"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Завантаження...' : 'Зареєструватися'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}