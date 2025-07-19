import React from 'react';
import { Image, Video, Calendar } from 'lucide-react';

interface Media {
  id: string;
  type: 'photo' | 'video';
  url: string;
  created_at: string;
}

interface MediaGalleryProps {
  media: Media[];
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  if (media.length === 0) {
    return (
      <div className="px-8 py-12 text-center">
        <Image size={48} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Немає медіафайлів</h3>
        <p className="text-gray-500">Завантажте фото або відео, щоб вони з'явилися тут</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Медіа ({media.length})</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {media.map((item) => (
          <div key={item.id} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {item.type === 'photo' ? (
                <img 
                  src={item.url} 
                  alt="Media" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Video size={32} className="text-gray-500" />
                </div>
              )}
            </div>
            
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
              <Calendar size={12} className="mr-1" />
              {new Date(item.created_at).toLocaleDateString('uk-UA')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaGallery;