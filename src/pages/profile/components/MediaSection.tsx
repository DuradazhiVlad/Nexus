import React from 'react';
import { Camera, Video, Play } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  created_at: string;
}

interface MediaSectionProps {
  photos: MediaItem[];
  videos: MediaItem[];
  loadingPhotos: boolean;
  loadingVideos: boolean;
  onPhotoClick?: (photo: MediaItem) => void;
  onVideoClick?: (video: MediaItem) => void;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
  photos,
  videos,
  loadingPhotos,
  loadingVideos,
  onPhotoClick,
  onVideoClick
}) => {
  return (
    <div className="space-y-6">
      {/* Photos Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Camera className="mr-2" size={20} />
            Фото ({photos.length})
          </h3>
          {photos.length > 6 && (
            <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
              Переглянути всі
            </button>
          )}
        </div>

        {loadingPhotos ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg aspect-square"></div>
              </div>
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.slice(0, 6).map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer"
                onClick={() => onPhotoClick?.(photo)}
              >
                <img
                  src={photo.url}
                  alt="User photo"
                  className="w-full aspect-square object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Поки що немає фото</p>
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Video className="mr-2" size={20} />
            Відео ({videos.length})
          </h3>
          {videos.length > 4 && (
            <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
              Переглянути всі
            </button>
          )}
        </div>

        {loadingVideos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg aspect-video"></div>
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.slice(0, 4).map((video) => (
              <div
                key={video.id}
                className="relative group cursor-pointer"
                onClick={() => onVideoClick?.(video)}
              >
                <video
                  src={video.url}
                  className="w-full aspect-video object-cover rounded-lg"
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-gray-800" fill="currentColor" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Поки що немає відео</p>
          </div>
        )}
      </div>
    </div>
  );
};