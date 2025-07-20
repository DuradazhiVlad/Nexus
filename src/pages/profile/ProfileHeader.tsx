import React from 'react';
import { Camera, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileHeaderProps {
  name: string;
  lastName: string;
  email: string;
  avatar: string | null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  lastName,
  email,
  avatar,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3">
        <div className="relative -mt-20">
          <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg mx-auto">
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center relative group">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl text-gray-600">
                  {name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {name} {lastName}
          </h1>
          <p className="text-gray-600 mt-1">{email}</p>
        </div>
      </div>

      <div className="md:w-2/3">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Особиста інформація
          </h2>
          <Link
            to="/settings"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <Settings size={18} className="mr-1" />
            Редагувати
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ProfileHeader;
