import React, { useRef, useState } from "react";
import { Play, Pause, Volume2, Maximize } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

// Допоміжна функція для форматування часу
const formatTime = (time: number): string => {
  if (isNaN(time) || time < 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // Значення від 0 до 100
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    // Оновлюємо тривалість, якщо вона ще не встановлена
    if (video.duration !== duration) {
        setDuration(video.duration);
    }

    // *** ВИПРАВЛЕННЯ NaN: Запобігаємо діленню на нуль/отриманню NaN ***
    if (video.duration === 0 || isNaN(video.duration)) {
        setProgress(0);
        setCurrentTime(0);
        return;
    }

    const newProgress = (video.currentTime / video.duration) * 100;
    setProgress(newProgress);
    setCurrentTime(video.currentTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
    videoRef.current.currentTime = time;
    setProgress(parseFloat(e.target.value));
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    // Шукаємо найближчий елемент, який може перейти в повноекранний режим
    const container = videoRef.current.parentElement;
    if (container && container.requestFullscreen) {
        container.requestFullscreen();
    }
  };
  
  // Стилі для прогрес-бару (щоб виглядав як у нативному плеєрі)
  const progressStyle = {
    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${progress}%, #D1D5DB ${progress}%, #D1D5DB 100%)`
  };

  return (
    <div className="video-player-container relative w-full bg-black rounded-lg overflow-hidden shadow-md">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full rounded-lg"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay} // Додаємо перемикання при натисканні на відео
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-end bg-black/50 p-2 space-y-1">
        
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 appearance-none bg-transparent range-progress-bar cursor-pointer"
          style={progressStyle}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={togglePlay} className="text-white hover:text-blue-400 transition">
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <span className="text-xs text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Volume2 className="text-white" size={18} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 appearance-none bg-gray-400 rounded-full cursor-pointer"
            />
            <button onClick={handleFullscreen} className="text-white hover:text-blue-400 transition">
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Додаємо CSS для стилізації повзунка (ВИДАЛЕНО jsx) */}
      <style>{`
        .range-progress-bar::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: #3B82F6; /* blue-500 */
          border-radius: 50%;
          cursor: pointer;
        }
        .range-progress-bar::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #3B82F6;
          border: none;
          border-radius: 50%;
          cursor: pointer;
        }
        .range-progress-bar {
          /* Робимо повзунок невидимим, але стилізуємо його через background */
          background-color: transparent !important;
          border: none;
        }
      `}</style>
    </div>
  );
};
