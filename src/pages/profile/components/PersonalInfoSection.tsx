import React, { useState } from 'react'; // Імпортуємо useState
import { useProfileEdit } from '../context/ProfileEditContext';

// Інтерфейс PersonalInfoSectionProps можна повністю видалити, оскільки він не використовується

const PersonalInfoSection: React.FC = () => {
  const {
    profile,
    isEditing,
    editForm: editedProfile,
    setEditForm: setEditedProfile,
  } = useProfileEdit();

  // Створюємо локальний стан для керування видимістю повної інформації
  const [showFullPersonalInfo, setShowFullPersonalInfo] = useState(false);
  const toggleFullPersonalInfo = () => setShowFullPersonalInfo(!showFullPersonalInfo);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Особиста інформація</h3>
      {isEditing ? (
        <div className="space-y-4">
          {/* Поля для редагування залишаються без змін */}
          {/* ... */}
        </div>
      ) : (
        <div className="space-y-3">
          {/* ... Основна інформація ... */}
          <div className="flex justify-between">
            <span className="text-gray-600">Місто:</span>
            <span className="text-gray-900">{profile?.city || 'Не вказано'}</span>
          </div>
          <button
            onClick={toggleFullPersonalInfo} // Ця функція тепер локальна
            className="mt-4 text-blue-500 hover:underline text-sm"
          >
            {showFullPersonalInfo ? 'Приховати повну інформацію' : 'Показати повну інформацію'}
          </button>

          {showFullPersonalInfo && ( // Ця змінна тепер локальна
            <div className="space-y-3 mt-4">
              {/* ... Повна інформація ... */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalInfoSection;