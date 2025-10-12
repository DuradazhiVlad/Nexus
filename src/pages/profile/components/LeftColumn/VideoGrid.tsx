import React from "react";
import { ArrowRight, Video } from "lucide-react";

interface VideoItem {
  id: string;
  url: string;
  likes: number;
}

interface Props {
  videos: VideoItem[];
}

export const VideoGrid: React.FC<Props> = ({ videos }) => {
  const videosCount = videos.length;
  if (videosCount === 0)
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center text-gray-800">
            <Video className="w-5 h-5 mr-2 text-purple-500" /> Відео
          </h3>
        </div>
        <p className="text-base text-gray-500 text-center py-4">Немає відео</p>
      </div>
    );

  const sortedVideos = [...videos].sort((a, b) => b.likes - a.likes);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center text-gray-800">
          <Video className="w-5 h-5 mr-2 text-purple-500" /> Відео
        </h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors">
          Показати всі <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="grid grid-cols-3 grid-rows-2 gap-2">
        {sortedVideos.slice(0, 6).map((video, idx) => (
          <div
            key={video.id}
            className={`overflow-hidden rounded-lg ${idx === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            <video
              src={video.url}
              controls
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
