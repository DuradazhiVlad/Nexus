import React from 'react';

interface Media {
  id: string;
  type: 'photo' | 'video';
  url: string;
  created_at: string;
}

interface MediaGalleryProps {
  media: Media[];
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
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
        <div key={item.id} className="aspect-square rounded-lg overflow-hidden">
          {item.type === 'photo' ? (
            <img src={item.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              controls
            />
          )}
        </div>
      ))}
    </div>
  );
};
export default MediaGallery;
