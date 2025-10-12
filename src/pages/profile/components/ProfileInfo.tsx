import React, { useState } from 'react';
import { AuthUserProfile } from '../../../lib/authUserService';
import { ChevronDown, ChevronUp, Heart, MessageCircle, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
// Removed LocationLanguageSelector per VK-style requirements
import { useProfileEdit } from '../context/ProfileEditContext';

// Функція для перекладу сімейного стану
const getRelationshipStatusLabel = (status: string, gender?: string) => {
  if (!status) return '';
  
  const statusMap: Record<string, { male: string; female: string; other: string }> = {
    single: { male: 'Неодружений', female: 'Незаміжня', other: 'Неодружений/Незаміжня' },
    in_relationship: { male: 'У стосунках', female: 'У стосунках', other: 'У стосунках' },
    engaged: { male: 'Заручений', female: 'Зарученна', other: 'Заручений/Зарученна' },
    married: { male: 'Одружений', female: 'Заміжня', other: 'Одружений/Заміжня' },
    divorced: { male: 'Розлучений', female: 'Розлучена', other: 'Розлучений/Розлучена' },
    widowed: { male: 'Вдівець', female: 'Вдова', other: 'Вдівець/Вдова' },
    complicated: { male: 'Все складно', female: 'Все складно', other: 'Все складно' }
  };
  
  const statusInfo = statusMap[status];
  if (!statusInfo) return status;
  
  if (gender === 'male') return statusInfo.male;
  if (gender === 'female') return statusInfo.female;
  return statusInfo.other;
};

export const ProfileInfo: React.FC = () => {
  const { profile } = useProfileEdit();
  if (!profile) {
    return null;
  }
  const [expandedSections, setExpandedSections] = useState({
    hobbies: false,
    languages: false
  });
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [photoLikes, setPhotoLikes] = useState<{[key: number]: number}>({});
  const [photoComments, setPhotoComments] = useState<{[key: number]: string[]}>({});
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [videoMuted, setVideoMuted] = useState<{[key: number]: boolean}>({});
  
  // Removed location/language picker
  
  // Заглушка для фото
  const photos = Array.from({length: 9}, (_, i) => ({
    id: i + 1,
    url: `https://picsum.photos/400/400?random=${i + 1}`,
    likes: Math.floor(Math.random() * 50) + 1,
    comments: [`Чудове фото!`, `Дуже гарно!`].slice(0, Math.floor(Math.random() * 3))
  }));
  
  // Заглушка для відео
  const videos = Array.from({length: 6}, (_, i) => ({
    id: i + 1,
    thumbnail: `https://picsum.photos/400/300?random=${i + 10}`,
    title: `Відео ${i + 1}`,
    duration: `${Math.floor(Math.random() * 5) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    views: Math.floor(Math.random() * 1000) + 100,
    likes: Math.floor(Math.random() * 50) + 1
  }));
  
  const openLightbox = (photoIndex: number) => {
    setSelectedPhoto(photoIndex);
    setLightboxOpen(true);
  };
  
  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedPhoto(null);
  };
  
  const likePhoto = (photoId: number) => {
    setPhotoLikes(prev => ({
      ...prev,
      [photoId]: (prev[photoId] || 0) + 1
    }));
  };
  
  const toggleVideoPlay = (videoId: number) => {
    setPlayingVideo(prev => prev === videoId ? null : videoId);
  };
  
  const toggleVideoMute = (videoId: number) => {
    setVideoMuted(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const hasHobbies = profile.hobbies?.length > 0;
  const hasLanguages = profile.languages?.length > 0;

  return (
    <div className="space-y-4">
      {/* Basic Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          Основна інформація
        </h3>
        <div className="space-y-3">
          {profile.bio && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 block mb-1">Про себе</span>
              <p className="text-gray-900 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}
          
          {(profile.city || profile.birth_date || profile.gender || profile.age) && (
            <div className="grid grid-cols-1 gap-2">
              {profile.city && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">🏙️</span>
                  <span className="text-gray-900">{profile.city}</span>
                </div>
              )}
              {profile.birth_date && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">🎂</span>
                  <span className="text-gray-900">{new Date(profile.birth_date).toLocaleDateString('uk-UA')}</span>
                </div>
              )}
              {profile.gender && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">{profile.gender === 'male' ? '👨' : profile.gender === 'female' ? '👩' : '👤'}</span>
                  <span className="text-gray-900">{profile.gender === 'male' ? 'Чоловіча' : profile.gender === 'female' ? 'Жіноча' : 'Інше'}</span>
                </div>
              )}
              {profile.age && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">📅</span>
                  <span className="text-gray-900">{profile.age} років</span>
                </div>
              )}
            </div>
          )}
          
          {(profile.education || profile.work) && (
            <div className="space-y-2">
              {profile.education && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">🎓</span>
                  <span className="text-gray-900">{profile.education}</span>
                </div>
              )}
              {profile.work && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">💼</span>
                  <span className="text-gray-900">{profile.work}</span>
                </div>
              )}
            </div>
          )}
          
          {(profile.phone || profile.website) && (
            <div className="space-y-2">
              {profile.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">📞</span>
                  <span className="text-gray-900">{profile.phone}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">🌐</span>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          )}
          
          {profile.relationship_status && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">💕</span>
              <span className="text-gray-900">{getRelationshipStatusLabel(profile.relationship_status, profile.gender)}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Хобі */}
      {hasHobbies && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <button 
            onClick={() => toggleSection('hobbies')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Хобі
            </h3>
            <span className="text-gray-500">
              {expandedSections.hobbies ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>
          
          {expandedSections.hobbies && (
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((hobby, index) => (
                <span key={index} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-sm font-medium px-3 py-1.5 rounded-full border border-purple-200 hover:shadow-sm transition-shadow">
                  {hobby}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Мови */}
      {hasLanguages && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <button 
            onClick={() => toggleSection('languages')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Мови
            </h3>
            <span className="text-gray-500">
              {expandedSections.languages ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>
        
        {expandedSections.languages && (
          <div className="space-y-3">
            {profile.languages.map((language, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-800 font-medium">{language.name}</span>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">{language.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Друзі */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Друзі</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
            Показати всіх
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Заглушка для друзів - буде замінено на реальні дані */}
          {[1, 2, 3, 4, 5, 6].map((friend) => (
            <div key={friend} className="group relative">
              <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
                <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
                  {String.fromCharCode(65 + friend - 1)}
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs font-medium">
                    Переглянути
                  </div>
                </div>
              </div>
              
              {/* Ім'я друга */}
              <p className="mt-2 text-xs text-center text-gray-700 font-medium truncate">
                Друг {friend}
              </p>
            </div>
          ))}
        </div>
       </div>

       {/* Галерея фото */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-semibold text-gray-900 flex items-center">
             <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
             Фото
             <span className="ml-2 text-sm text-gray-500 font-normal">({photos.length})</span>
           </h3>
           <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
             Показати всі
           </button>
         </div>
         
         <div className="grid grid-cols-3 gap-3">
           {photos.map((photo, index) => (
             <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg" onClick={() => openLightbox(index)}>
               <img 
                 src={photo.url} 
                 alt={`Фото ${photo.id}`}
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-between p-3">
                 <div className="flex items-center space-x-1 text-white text-xs">
                   <Heart className="w-3 h-3" />
                   <span>{photo.likes + (photoLikes[photo.id] || 0)}</span>
                 </div>
                 <div className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                   Переглянути
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>

        {/* Секція відео */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Відео
              <span className="ml-2 text-sm text-gray-500 font-normal">({videos.length})</span>
            </h3>
            <div className="flex items-center space-x-2">
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                <option>Нові</option>
                <option>Популярні</option>
                <option>Старі</option>
              </select>
              <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors">
                Показати всі
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="group relative bg-gray-100 rounded-xl overflow-hidden transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <div className="relative aspect-video">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay з контролами */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 group-hover:from-black/70 transition-all duration-200 flex items-center justify-center">
                    <button 
                      onClick={() => toggleVideoPlay(video.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm rounded-full p-4 hover:scale-110 transform transition-transform duration-200 shadow-lg"
                    >
                      {playingVideo === video.id ? (
                        <Pause className="w-6 h-6 text-gray-800" />
                      ) : (
                        <Play className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" />
                      )}
                    </button>
                  </div>
                  
                  {/* Тривалість */}
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {video.duration}
                  </div>
                  
                  {/* Контроли звуку */}
                  <button 
                    onClick={() => toggleVideoMute(video.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70"
                  >
                    {videoMuted[video.id] ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{video.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{video.views} переглядів</span>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{video.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Локація та мова блок видалено */}

        {/* Lightbox */}
       {lightboxOpen && selectedPhoto !== null && (
         <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
           <div className="relative max-w-4xl max-h-full">
             <button 
               onClick={closeLightbox}
               className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
             >
               <X className="w-8 h-8" />
             </button>
             
             <img 
               src={photos[selectedPhoto].url}
               alt={`Фото ${photos[selectedPhoto].id}`}
               className="max-w-full max-h-[80vh] object-contain"
             />
             
             <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 rounded-lg p-4 text-white">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center space-x-4">
                   <button 
                     onClick={() => likePhoto(photos[selectedPhoto].id)}
                     className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                   >
                     <Heart className="w-5 h-5" />
                     <span>{photos[selectedPhoto].likes + (photoLikes[photos[selectedPhoto].id] || 0)}</span>
                   </button>
                   <div className="flex items-center space-x-1">
                     <MessageCircle className="w-5 h-5" />
                     <span>{photos[selectedPhoto].comments.length}</span>
                   </div>
                 </div>
               </div>
               
               {photos[selectedPhoto].comments.length > 0 && (
                 <div className="space-y-1">
                   {photos[selectedPhoto].comments.map((comment, index) => (
                     <p key={index} className="text-sm text-gray-200">{comment}</p>
                   ))}
                 </div>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };