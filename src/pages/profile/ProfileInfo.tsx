import React from 'react';

interface ProfileInfoProps {
  bio?: string;
  city?: string;
  birthDate?: string;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
  bio,
  city,
  birthDate,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-500">Про мене</h3>
        <p className="mt-1 text-gray-900">
          {bio || 'Додайте інформацію про себе в налаштуваннях'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">Місто</h3>
        <p className="mt-1 text-gray-900">{city || 'Не вказано'}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">Дата народження</h3>
        <p className="mt-1 text-gray-900">{birthDate || 'Не вказано'}</p>
      </div>
    </div>
  );
};
export default ProfileInfo;
