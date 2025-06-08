import React from 'react';
import { Trash2 } from 'lucide-react';

interface Media {
  id: string;
  type: 'photo' | 'video';
  url: string;
  created_at: string;
}

interface MediaGalleryProps {
  media: Media[];
  onDelete: (mediaId: string) => void;
  deleting: string | null;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ 
  media, 
  onDelete, 
  deleting 
}) => {
  if (media.length === 0) {
    return (
      <p className="text-gray-600 text-center py-8">
        У вас поки немає медіафайлів
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {media.map((item) => (
        <div key={item.id} className="aspect-square rounded-lg overflow-hidden relative group">
          {item.type === 'photo' ? (
            <img 
              src={item.url} 
              alt="" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              controls
            />
          )}
          
          {/* Delete button in top right corner */}
          <button
            onClick={() => onDelete(item.id)}
            disabled={deleting === item.id}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="Видалити"
          >
            {deleting === item.id ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default MediaGallery;