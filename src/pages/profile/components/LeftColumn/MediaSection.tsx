import React from "react";
import { useProfileEdit } from "../../context/ProfileEditContext";
import { Image, Video, Music2 } from "lucide-react";
import { PhotoGrid } from "./PhotoGrid";
import { VideoGrid } from "./VideoGrid";

export const MediaSection: React.FC = () => {
  const { profile } = useProfileEdit();
  if (!profile) return null;

  const photos = profile.photos || [];
  const videos = profile.videos || [];
  const musicCount = profile.musicCount || 0;

  return (
    <div className="space-y-6">
      <PhotoGrid photos={photos} />
      <VideoGrid videos={videos} />
      {/* Музика */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center text-gray-800">
            <Music2 className="w-5 h-5 mr-2 text-red-500" /> Музика
          </h3>
          <span className="text-sm font-medium text-gray-500">{musicCount} треків</span>
        </div>
        {musicCount === 0 ? (
          <p className="text-base text-gray-500 text-center py-4">Немає треків</p>
        ) : (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{musicCount}</p>
            <p className="text-sm text-gray-500">треків</p>
          </div>
        )}
      </div>
    </div>
  );
};
