import React from "react";
import { ArrowRight, Image } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  likes: number;
}

interface Props {
  photos: Photo[];
}

export const PhotoGrid: React.FC<Props> = ({ photos }) => {
  const photosCount = photos.length;
  if (photosCount === 0)
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center text-gray-800">
            <Image className="w-5 h-5 mr-2 text-green-500" /> Фото
          </h3>
        </div>
        <p className="text-base text-gray-500 text-center py-4">Немає фото</p>
      </div>
    );

  const sortedPhotos = [...photos].sort((a, b) => b.likes - a.likes);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center text-gray-800">
          <Image className="w-5 h-5 mr-2 text-green-500" /> Фото
        </h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors">
          Показати всі <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="grid grid-cols-3 grid-rows-2 gap-2">
        {sortedPhotos.slice(0, 6).map((photo, idx) => (
          <div
            key={photo.id}
            className={`overflow-hidden rounded-lg ${idx === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            <img
              src={photo.url}
              alt={`Фото ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
