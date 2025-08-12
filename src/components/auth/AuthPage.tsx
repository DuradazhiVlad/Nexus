import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { upsertUserProfile } from '../../lib/userProfileService';

interface AuthPageProps {
  onClose: () => void;
}

export function AuthPage({ onClose }: AuthPageProps) {
  const [showLogin, setShowLogin] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginShowForgotPassword, setLoginShowForgotPassword] = useState(false);
  const [loginForgotPasswordLoading, setLoginForgotPasswordLoading] = useState(false);
  const [loginForgotPasswordSuccess, setLoginForgotPasswordSuccess] = useState(false);

  // Registration form state
  const [registerName, setRegisterName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      console.log('🚀 Starting login process...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        console.error('❌ Login error:', error);

        // Обробка специфічних помилок
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Неправильний email або пароль. Перевірте ваші дані та спробуйте ще раз.');
        } else if (error.message.includes('Too many requests')) {
          setLoginError('Забагато спроб входу. Спробуйте пізніше.');
        } else {
          setLoginError(error.message || 'Помилка входу');
        }
        return;
      }

      console.log('✅ Login successful:', data.user?.email);
      onClose();
    } catch (err: any) {
      console.error('❌ Unexpected login error:', err);
      setLoginError(err.message || 'Помилка входу');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setLoginError('Будь ласка, введіть email для відновлення пароля');
      return;
    }

    setLoginForgotPasswordLoading(true);
    setLoginError('');

    try {
      console.log('📧 Sending password reset email...');

      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        throw error;
      }

      console.log('✅ Password reset email sent');
      setLoginForgotPasswordSuccess(true);
      setLoginShowForgotPassword(false);
    } catch (err: any) {
      console.error('❌ Password reset error:', err);
      setLoginError('Помилка відправки листа для відновлення пароля: ' + (err.message || err));
    } finally {
      setLoginForgotPasswordLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    try {
      console.log('🚀 Starting registration process...');

      // Реєстрація користувача в Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            name: registerName,
            lastname: registerLastName,
          }
        }
      });

      if (signUpError) {
        console.error('❌ Auth signup error:', signUpError);
        throw signUpError;
      }

      console.log('✅ Auth signup successful:', authData.user?.id);

      if (authData.user) {
        // Створення профілю користувача
        console.log('📝 Creating user profile...');
        const { error: profileError } = await upsertUserProfile({
          auth_user_id: authData.user.id,
          name: registerName,
          last_name: registerLastName,
          email: registerEmail,
        });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          throw profileError;
        }

        console.log('✅ User profile created successfully');
        onClose();
      }
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setRegisterError(err.message || 'Помилка реєстрації');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{showLogin ? 'Вхід' : 'Реєстрація'}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setShowLogin(true)}
          className={`px-4 py-2 rounded-lg ${showLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Вхід
        </button>
        <button
          onClick={() => setShowLogin(false)}
          className={`px-4 py-2 rounded-lg ${!showLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Реєстрація
        </button>
      </div>

      {showLogin ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {loginError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {loginError}
            </div>
          )}

          {loginForgotPasswordSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              Лист для відновлення пароля відправлено на вашу пошту!
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введіть email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={loginShowPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введіть пароль"
                required
              />
              <button
                type="button"
                onClick={() => setLoginShowPassword(!loginShowPassword)}
                className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
              >
                {loginShowPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setLoginShowForgotPassword(!loginShowForgotPassword)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Забули пароль?
            </button>
          </div>

          {loginShowForgotPassword && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                Введіть ваш email для відновлення пароля
              </p>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loginForgotPasswordLoading || !loginEmail}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginForgotPasswordLoading ? 'Відправка...' : 'Відправити лист для відновлення'}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginLoading ? 'Завантаження...' : 'Увійти'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {registerError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {registerError}
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">Ім'я</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введіть ім'я"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Прізвище</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={registerLastName}
                onChange={(e) => setRegisterLastName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введіть прізвище"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введіть email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введіть пароль"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={registerLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registerLoading ? 'Завантаження...' : 'Зареєструватися'}
          </button>
        </form>
      )}
    </div>
  );
}