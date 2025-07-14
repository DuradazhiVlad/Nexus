import React, { useState } from 'react';
import { X, Users, Lock, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar: string | null;
}

interface CreateGroupModalProps {
  currentUser: User | null;
  onClose: () => void;
  onGroupCreated: () => void;
}

export function CreateGroupModal({ currentUser, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([
          {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_private: formData.is_private,
            created_by: currentUser.id
          }
        ])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupData.id,
            user_id: currentUser.id,
            role: 'admin'
          }
        ]);

      if (memberError) throw memberError;

      onGroupCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating group:', err);
      setError(err.message || 'Помилка при створенні групи');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Створити групу</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Назва групи *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введіть назву групи"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Опис групи
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Розкажіть про групу..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Тип групи
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_private"
                    checked={!formData.is_private}
                    onChange={() => setFormData(prev => ({ ...prev, is_private: false }))}
                    className="mr-3"
                  />
                  <Globe size={16} className="mr-2 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Публічна</div>
                    <div className="text-sm text-gray-500">Будь-хто може знайти та приєднатися</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_private"
                    checked={formData.is_private}
                    onChange={() => setFormData(prev => ({ ...prev, is_private: true }))}
                    className="mr-3"
                  />
                  <Lock size={16} className="mr-2 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">Приватна</div>
                    <div className="text-sm text-gray-500">Тільки за запрошенням</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Створення...' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}