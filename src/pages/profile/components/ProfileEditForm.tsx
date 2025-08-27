import React from 'react';
import { User, Calendar, X } from 'lucide-react';
import { FileUpload } from '../../../components/FileUpload';
import { EditFormData } from '../types';

// Константи для випадаючих списків
const RELATIONSHIP_STATUS_OPTIONS = [
  { value: '', label: 'Не вказано' },
  { value: 'single', label: 'Неодружений/Незаміжня' },
  { value: 'in_relationship', label: 'У стосунках' },
  { value: 'engaged', label: 'Заручений/Зарученна' },
  { value: 'married', label: 'Одружений/Заміжня' },
  { value: 'divorced', label: 'Розлучений/Розлучена' },
  { value: 'widowed', label: 'Вдівець/Вдова' },
  { value: 'complicated', label: 'Все складно' }
];

const LANGUAGE_OPTIONS = [
  'Українська',
  'Англійська',
  'Російська',
  'Польська',
  'Німецька',
  'Французька',
  'Іспанська',
  'Італійська',
  'Португальська',
  'Китайська',
  'Японська',
  'Корейська',
  'Арабська',
  'Турецька',
  'Чеська',
  'Словацька',
  'Угорська',
  'Румунська',
  'Болгарська',
  'Хорватська'
];

interface ProfileEditFormProps {
  editForm: EditFormData;
  setEditForm: (form: EditFormData) => void;
  addHobby: () => void;
  removeHobby: (hobby: string) => void;
  addLanguage: () => void;
  removeLanguage: (language: string) => void;
  setError: (error: string) => void;
}

export const ProfileEditForm = ({
  editForm,
  setEditForm,
  addHobby,
  removeHobby,
  addLanguage,
  removeLanguage,
  setError
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Ліва колонка */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ім'я *
          </label>
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введіть ім'я"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введіть email"
            disabled={true}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Про себе
          </label>
          <textarea
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Розкажіть про себе"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{editForm.bio.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Місто
          </label>
          <input
            type="text"
            value={editForm.city}
            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введіть місто"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Освіта
          </label>
          <input
            type="text"
            value={editForm.education}
            onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введіть освіту"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Телефон
          </label>
          <input
            type="tel"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введіть телефон"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Хобі
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            {editForm.hobbies.map((hobby, index) => (
              <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {hobby}
                <button
                  type="button"
                  onClick={() => removeHobby(hobby)}
                  className="ml-1 text-blue-800 hover:text-blue-900 focus:outline-none"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={editForm.newHobby}
              onChange={(e) => setEditForm({ ...editForm, newHobby: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addHobby();
                }
              }}
              className="flex-1 px-1 py-0.5 bg-transparent focus:outline-none"
              placeholder="Додати хобі і натиснути Enter"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сімейний стан
          </label>
          <select
            value={editForm.relationship_status}
            onChange={(e) => setEditForm({ ...editForm, relationship_status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {RELATIONSHIP_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Права колонка */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Прізвище
          </label>
          <input
            type="text"
            value={editForm.last_name}
            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введіть прізвище"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Аватар
          </label>
          <div className="flex items-center space-x-3">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              {editForm.avatar ? (
                <img
                  src={editForm.avatar}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <FileUpload
              onUploadSuccess={(url) => setEditForm({ ...editForm, avatar: url })}
              onUploadError={(error) => setError(error)}
              accept="image/*"
              maxSize={5}
              buttonText="Завантажити аватар"
              showPreview={false}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            День народження
          </label>
          <div className="relative">
            <input
              type="date"
              value={editForm.birth_date}
              onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Робота
          </label>
          <input
            type="text"
            value={editForm.work}
            onChange={(e) => setEditForm({ ...editForm, work: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введіть роботу"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Веб-сайт
          </label>
          <input
            type="url"
            value={editForm.website}
            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Мови
          </label>
          <div className="space-y-2">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !editForm.languages.includes(e.target.value)) {
                  setEditForm({ 
                    ...editForm, 
                    languages: [...editForm.languages, e.target.value] 
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Оберіть мову</option>
              {LANGUAGE_OPTIONS.filter(lang => !editForm.languages.includes(lang)).map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {editForm.languages.map((language, index) => (
                <span key={index} className="flex items-center bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {language}
                  <button
                    type="button"
                    onClick={() => removeLanguage(language)}
                    className="ml-1 text-purple-800 hover:text-purple-900 focus:outline-none"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};