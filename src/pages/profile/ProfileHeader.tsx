import React from 'react';
import { Edit, Mail, MapPin, Calendar } from 'lucide-react';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  birthdate: string | null;
}

interface ProfileHeaderProps {
  user: User;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-12">
      <div className="flex items-center space-x-6">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            <span className="text-3xl font-bold text-gray-600">
              {user.name[0]?.toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">
            {user.name} {user.lastname}
          </h1>
          
          <div className="flex items-center space-x-4 text-white/90">
            <div className="flex items-center">
              <Mail size={16} className="mr-2" />
              <span>{user.email}</span>
            </div>
            
            {user.city && (
              <div className="flex items-center">
                <MapPin size={16} className="mr-2" />
                <span>{user.city}</span>
              </div>
            )}
            
            {user.birthdate && (
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                <span>{new Date(user.birthdate).toLocaleDateString('uk-UA')}</span>
              </div>
            )}
          </div>
        </div>
        
        <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
          <Edit size={16} className="mr-2" />
          Редагувати
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;