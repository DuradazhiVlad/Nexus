import React from 'react';
import { FileText } from 'lucide-react';

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

interface ProfileInfoProps {
  user: User;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ user }) => {
  if (!user.bio) {
    return null;
  }

  return (
    <div className="px-8 py-6 border-b border-gray-200">
      <div className="flex items-start space-x-3">
        <FileText size={20} className="text-gray-500 mt-1" />
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Про мене</h3>
          <p className="text-gray-700 leading-relaxed">{user.bio}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;