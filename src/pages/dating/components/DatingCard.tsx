import React, { useState } from 'react';
import { DatingUser } from '../types';
import { Heart, X, MapPin, Calendar, MessageCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DatingCardProps {
  user: DatingUser;
  onLike: () => void;
  onPass: () => void;
}

export function DatingCard({ user, onLike, onPass }: DatingCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isPassing, setIsPassing] = useState(false);
  const navigate = useNavigate();

  const handleLike = async () => {
    if (isLiking || isPassing) return;
    setIsLiking(true);
    try {
      await onLike();
    } finally {
      setIsLiking(false);
    }
  };

  const handlePass = async () => {
    if (isLiking || isPassing) return;
    setIsPassing(true);
    try {
      await onPass();
    } finally {
      setIsPassing(false);
    }
  };

  const handleViewProfile = () => {
    navigate(`/profile/${user.auth_user_id}`);
  };

  const getGenderText = (gender?: string) => {
    switch (gender) {
      case 'male':
        return 'Чоловік';
      case 'female':
        return 'Жінка';
      case 'other':
        return 'Інше';
      default:
        return 'Не вказано';
    }
  };

  const getAgeText = (age?: number) => {
    if (!age) return 'Вік не вказано';
    return `${age} років`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div className="relative aspect-square">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.name} ${user.last_name || ''}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Online indicator */}
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {user.name} {user.last_name || ''}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {getAgeText(user.age)}
            </div>
            
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {getGenderText(user.gender)}
            </div>
          </div>

          {user.city && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              {user.city}
            </div>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 line-clamp-3">
              {user.bio}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePass}
            disabled={isLiking || isPassing}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border transition-colors ${
              isPassing
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <X className="w-4 h-4" />
            {isPassing ? 'Пропускаю...' : 'Пропустити'}
          </button>

          <button
            onClick={handleLike}
            disabled={isLiking || isPassing}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-colors ${
              isLiking
                ? 'bg-pink-100 text-pink-400 cursor-not-allowed'
                : 'bg-pink-600 text-white hover:bg-pink-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            {isLiking ? 'Лайкаю...' : 'Лайк'}
          </button>
        </div>

        {/* View Profile Button */}
        <button
          onClick={handleViewProfile}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-4 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Переглянути профіль
        </button>
      </div>
    </div>
  );
}