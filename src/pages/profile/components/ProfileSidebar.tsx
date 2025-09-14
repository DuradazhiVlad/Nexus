import React, { useState, useEffect } from 'react';
import { AuthUserProfile } from '../../../lib/authUserService';
import { UserStatsService, UserStats, UserFriend, UserPhoto } from '../../../lib/userStatsService';
import { 
  MapPin, 
  Calendar, 
  Heart, 
  Briefcase, 
  GraduationCap, 
  Phone, 
  Globe, 
  Users, 
  Camera,
  Video,
  Music,
  BookOpen,
  Star
} from 'lucide-react';

interface ProfileSidebarProps {
  profile: AuthUserProfile;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ profile }) => {
  const [stats, setStats] = useState<UserStats>({
    friendsCount: 0,
    photosCount: 0,
    videosCount: 0,
    postsCount: 0
  });
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userStats, userFriends, userPhotos] = await Promise.all([
        UserStatsService.getUserStats(profile.id),
        UserStatsService.getUserFriends(profile.id, 6),
        UserStatsService.getUserPhotos(profile.id, 6)
      ]);
      setStats(userStats);
      setFriends(userFriends);
      setPhotos(userPhotos);
    } catch (error) {
      console.error('Error loading sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string, lastName?: string) => {
    const first = name ? name[0].toUpperCase() : '';
    const last = lastName ? lastName[0].toUpperCase() : '';
    return `${first}${last}`;
  };
  const getRelationshipStatusLabel = (status: string, gender?: string) => {
    const statusMap: { [key: string]: { [key: string]: string } } = {
      single: {
        male: 'Неодружений',
        female: 'Незаміжня',
        other: 'Не в стосунках'
      },
      married: {
        male: 'Одружений',
        female: 'Заміжня',
        other: 'У шлюбі'
      },
      in_relationship: {
        male: 'У стосунках',
        female: 'У стосунках',
        other: 'У стосунках'
      }
    };
    
    return statusMap[status]?.[gender || 'other'] || 'Не вказано';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-80 space-y-4">
      {/* Основна інформація */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Основна інформація</h3>
        </div>
        
        <div className="p-4 space-y-3">
          {profile.birth_date && (
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">День народження:</span>
                <p className="text-sm font-medium text-gray-900">{formatDate(profile.birth_date)}</p>
              </div>
            </div>
          )}
          
          {profile.city && (
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Місто:</span>
                <p className="text-sm font-medium text-gray-900">{profile.city}</p>
              </div>
            </div>
          )}
          
          {profile.relationship_status && (
            <div className="flex items-center space-x-3">
              <Heart className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Сімейний стан:</span>
                <p className="text-sm font-medium text-gray-900">
                  {getRelationshipStatusLabel(profile.relationship_status, profile.gender)}
                </p>
              </div>
            </div>
          )}
          
          {profile.work && (
            <div className="flex items-center space-x-3">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Робота:</span>
                <p className="text-sm font-medium text-gray-900">{profile.work}</p>
              </div>
            </div>
          )}
          
          {profile.education && (
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Освіта:</span>
                <p className="text-sm font-medium text-gray-900">{profile.education}</p>
              </div>
            </div>
          )}
          
          {profile.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Телефон:</span>
                <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
              </div>
            </div>
          )}
          
          {profile.website && (
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Веб-сайт:</span>
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {profile.website}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Інтереси та хобі */}
      {profile.hobbies && profile.hobbies.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Інтереси</h3>
          </div>
          
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((hobby, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Мови */}
      {profile.languages && profile.languages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Мови</h3>
          </div>
          
          <div className="p-4 space-y-2">
            {profile.languages.map((language, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{language.name}</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  {language.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Активність</h3>
        </div>
        
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Друзі</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.friendsCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Фото</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.photosCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Відео</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.videosCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Music className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Пости</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.postsCount}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Останні друзі */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Друзі</h3>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Всі друзі
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                </div>
              ))
            ) : friends.length > 0 ? (
              friends.map((friend) => (
                <div key={friend.id} className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-16 h-16 rounded-lg mb-2 overflow-hidden">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name || 'Friend'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {getInitials(friend.name, friend.last_name)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {friend.name} {friend.last_name}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-4">
                <p className="text-sm text-gray-500">Немає друзів</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Фото */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Фото</h3>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Всі фото
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              ))
            ) : photos.length > 0 ? (
              photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={photo.url}
                    alt="Фото користувача"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-4">
                <p className="text-sm text-gray-500">Немає фото</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};