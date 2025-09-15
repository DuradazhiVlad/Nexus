import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Lock, 
  Globe,
  MapPin,
  Globe as WebsiteIcon,
  Mail,
  FileText,
  Camera,
  Upload
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: {
    name: string;
    description: string;
    is_private: boolean;
    category: string;
    location: string;
    website: string;
    contactemail: string;
    rules: string[];
    avatar?: File;
  }) => void;
  loading?: boolean;
}

const categories = [
  'Технології',
  'Спорт',
  'Мистецтво',
  'Музика',
  'Освіта',
  'Бізнес',
  'Подорожі',
  'Кулінарія',
  'Фотографія',
  'Ігри',
  'Книги',
  'Здоров\'я',
  'Мода',
  'Інше'
];

export function CreateGroupModal({ isOpen, onClose, onSubmit, loading = false }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false,
    category: '',
    location: '',
    website: '',
    contactemail: '',
    rules: [] as string[],
    newRule: ''
  });
  
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Назва групи є обов\'язковою');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      is_private: formData.is_private,
      category: formData.category,
      location: formData.location.trim(),
      website: formData.website.trim(),
      contactemail: formData.contactemail.trim(),
      rules: formData.rules,
      avatar: avatar || undefined
    });

    // Reset form
    setFormData({
      name: '',
      description: '',
      is_private: false,
      category: '',
      location: '',
      website: '',
      contactemail: '',
      rules: [],
      newRule: ''
    });
    setAvatar(null);
    setAvatarPreview(null);
  };

  const addRule = () => {
    if (formData.newRule.trim()) {
      setFormData({
        ...formData,
        rules: [...formData.rules, formData.newRule.trim()],
        newRule: ''
      });
    }
  };

  const removeRule = (index: number) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter((_, i) => i !== index)
    });
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Перевірка розміру файлу (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Розмір файлу не повинен перевищувати 5MB');
      return;
    }
    
    // Перевірка типу файлу
    if (!file.type.startsWith('image/')) {
      alert('Можна завантажувати тільки зображення');
      return;
    }
    
    setAvatar(file);
    
    // Створюємо URL для превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Створити нову групу</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="space-y-4 flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Group avatar preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                <Upload className="w-4 h-4" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">Аватар групи</p>
          </div>
          
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Основна інформація</h3>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Назва групи *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введіть назву групи"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Опис
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Опишіть вашу групу"
              />
            </div>

            {/* Privacy */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_private}
                  onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Приватна група</span>
                {formData.is_private ? (
                  <Lock className="w-4 h-4 text-gray-500" />
                ) : (
                  <Globe className="w-4 h-4 text-gray-500" />
                )}
              </label>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Додаткова інформація</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категорія
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Виберіть категорію</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Розташування
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Місто або регіон"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <WebsiteIcon className="w-4 h-4 inline mr-1" />
                  Веб-сайт
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Контактний email
                </label>
                <input
                  type="email"
                  value={formData.contactemail}
                  onChange={(e) => setFormData({ ...formData, contactemail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@example.com"
                />
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Правила групи</h3>
            
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.newRule}
                  onChange={(e) => setFormData({ ...formData, newRule: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Додати правило"
                />
                <button
                  type="button"
                  onClick={addRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {formData.rules.length > 0 && (
                <div className="space-y-2">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{rule}</span>
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Створення...' : 'Створити групу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}