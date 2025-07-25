import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Check,
  AlertCircle,
  Film,
  Clock,
  FileVideo,
  Zap,
  Settings,
  Download,
  Eye,
  Sparkles,
  Camera
} from 'lucide-react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (videoData: {
    file: File;
    title: string;
    description: string;
    thumbnail?: string;
    startTime: number;
    endTime: number;
    skipIntro: boolean;
    skipOutro: boolean;
    introEnd: number;
    outroStart: number;
  }) => void;
  groupId?: string;
}

interface VideoSegment {
  type: 'intro' | 'content' | 'outro';
  start: number;
  end: number;
  skip: boolean;
}

export function VideoUploadModal({ isOpen, onClose, onUpload, groupId }: VideoUploadModalProps) {
  const [step, setStep] = useState<'upload' | 'trim' | 'details' | 'preview'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Trim settings
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  
  // Skip intro/outro settings
  const [skipIntro, setSkipIntro] = useState(false);
  const [skipOutro, setSkipOutro] = useState(false);
  const [introEnd, setIntroEnd] = useState(0);
  const [outroStart, setOutroStart] = useState(0);
  
  // Video details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string>('');
  
  // Preview settings
  const [previewMode, setPreviewMode] = useState<'full' | 'trimmed' | 'final'>('full');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (videoDuration > 0) {
      setEndTime(videoDuration);
      setOutroStart(Math.max(0, videoDuration - 30)); // Default outro last 30 seconds
      
      // Auto-detect potential intro/outro
      const segments: VideoSegment[] = [
        { type: 'intro', start: 0, end: Math.min(15, videoDuration * 0.1), skip: false },
        { type: 'content', start: Math.min(15, videoDuration * 0.1), end: Math.max(videoDuration - 30, videoDuration * 0.9), skip: false },
        { type: 'outro', start: Math.max(videoDuration - 30, videoDuration * 0.9), end: videoDuration, skip: false }
      ];
      setSegments(segments);
      setIntroEnd(segments[0].end);
      setOutroStart(segments[2].start);
    }
  }, [videoDuration]);

  const resetState = () => {
    setStep('upload');
    setSelectedFile(null);
    setVideoUrl('');
    setVideoDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setStartTime(0);
    setEndTime(0);
    setSkipIntro(false);
    setSkipOutro(false);
    setIntroEnd(0);
    setOutroStart(0);
    setTitle('');
    setDescription('');
    setThumbnail('');
    setSegments([]);
    setPreviewMode('full');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setStep('trim');
    }
  };

  const handleVideoLoad = () => {
    const video = videoRef.current;
    if (video) {
      setVideoDuration(video.duration);
      setEndTime(video.duration);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      
      // Auto-skip intro/outro during preview
      if (previewMode === 'final') {
        if (skipIntro && video.currentTime >= startTime && video.currentTime < introEnd) {
          video.currentTime = introEnd;
        }
        if (skipOutro && video.currentTime >= outroStart) {
          video.currentTime = endTime;
          video.pause();
          setIsPlaying(false);
        }
      }
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };

  const jumpToSegment = (segmentType: 'intro' | 'content' | 'outro') => {
    const segment = segments.find(s => s.type === segmentType);
    if (segment) {
      seekTo(segment.start);
    }
  };

  const setSegmentBoundary = (segmentType: 'intro' | 'outro', boundaryType: 'start' | 'end') => {
    if (segmentType === 'intro' && boundaryType === 'end') {
      setIntroEnd(currentTime);
      setSegments(prev => prev.map(s => 
        s.type === 'intro' ? { ...s, end: currentTime } : 
        s.type === 'content' ? { ...s, start: currentTime } : s
      ));
    } else if (segmentType === 'outro' && boundaryType === 'start') {
      setOutroStart(currentTime);
      setSegments(prev => prev.map(s => 
        s.type === 'content' ? { ...s, end: currentTime } :
        s.type === 'outro' ? { ...s, start: currentTime } : s
      ));
    }
  };

  const generateThumbnail = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      setIsGeneratingThumbnail(true);
      
      // Seek to middle of content
      const contentSegment = segments.find(s => s.type === 'content');
      const thumbnailTime = contentSegment ? (contentSegment.start + contentSegment.end) / 2 : videoDuration / 2;
      
      video.currentTime = thumbnailTime;
      
      setTimeout(() => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnail(thumbnailUrl);
        }
        setIsGeneratingThumbnail(false);
      }, 100);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEffectiveDuration = () => {
    let duration = endTime - startTime;
    if (skipIntro) duration -= (introEnd - startTime);
    if (skipOutro) duration -= (endTime - outroStart);
    return Math.max(0, duration);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload({
        file: selectedFile,
        title,
        description,
        thumbnail,
        startTime,
        endTime,
        skipIntro,
        skipOutro,
        introEnd,
        outroStart
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Film className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'upload' && 'Завантажити відео'}
              {step === 'trim' && 'Обрізати та налаштувати'}
              {step === 'details' && 'Деталі відео'}
              {step === 'preview' && 'Попередній перегляд'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* Left side - Video preview */}
          {step !== 'upload' && (
            <div className="flex-1 bg-black flex items-center justify-center p-6">
              <div className="relative">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="max-h-full max-w-full object-contain"
                  onLoadedMetadata={handleVideoLoad}
                  onTimeUpdate={handleTimeUpdate}
                  muted={isMuted}
                />
                
                {/* Video controls overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/70 rounded-lg p-4">
                    {/* Progress bar */}
                    <div className="relative mb-4">
                      <div className="w-full h-2 bg-gray-600 rounded-full">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-100"
                          style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                        />
                      </div>
                      
                      {/* Segment markers */}
                      {segments.map((segment, index) => (
                        <div key={index} className="absolute top-0 h-2 flex">
                          <div
                            className={`h-full ${
                              segment.type === 'intro' ? 'bg-yellow-500/50' :
                              segment.type === 'outro' ? 'bg-red-500/50' :
                              'bg-green-500/50'
                            }`}
                            style={{
                              left: `${(segment.start / videoDuration) * 100}%`,
                              width: `${((segment.end - segment.start) / videoDuration) * 100}%`
                            }}
                          />
                          {segment.skip && (
                            <div 
                              className="absolute top-0 h-full bg-gray-800/80 flex items-center justify-center"
                              style={{
                                left: `${(segment.start / videoDuration) * 100}%`,
                                width: `${((segment.end - segment.start) / videoDuration) * 100}%`
                              }}
                            >
                              <X size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Trim markers */}
                      <div
                        className="absolute top-0 w-1 h-2 bg-blue-400"
                        style={{ left: `${(startTime / videoDuration) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 w-1 h-2 bg-blue-400"
                        style={{ left: `${(endTime / videoDuration) * 100}%` }}
                      />
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={togglePlayPause}
                          className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                        >
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-2 bg-gray-600 rounded-full hover:bg-gray-700 transition-colors"
                        >
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        
                        <span className="text-sm">
                          {formatTime(currentTime)} / {formatTime(videoDuration)}
                        </span>
                      </div>
                      
                      {step === 'trim' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => jumpToSegment('intro')}
                            className="px-3 py-1 bg-yellow-600 rounded text-sm hover:bg-yellow-700 transition-colors"
                          >
                            Інтро
                          </button>
                          <button
                            onClick={() => jumpToSegment('content')}
                            className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Контент
                          </button>
                          <button
                            onClick={() => jumpToSegment('outro')}
                            className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Аутро
                          </button>
                        </div>
                      )}
                      
                      {step === 'preview' && (
                        <div className="flex items-center space-x-2">
                          <select
                            value={previewMode}
                            onChange={(e) => setPreviewMode(e.target.value as any)}
                            className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                          >
                            <option value="full">Повне відео</option>
                            <option value="trimmed">Обрізане</option>
                            <option value="final">Фінальна версія</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right side - Controls */}
          <div className="w-96 bg-gray-50 p-6 overflow-y-auto">
            {step === 'upload' && (
              <div className="space-y-6">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Завантажити відео</h3>
                  <p className="text-gray-600 mb-4">
                    Перетягніть відео сюди або натисніть для вибору
                  </p>
                  <p className="text-gray-500 text-sm">
                    Підтримувані формати: MP4, MOV, AVI, WebM<br />
                    Максимальний розмір: 500MB
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="text-blue-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Розумне обрізання</h4>
                      <p className="text-blue-700 text-sm">
                        Ми автоматично виявимо інтро та аутро у вашому відео та дозволимо їх пропустити для кращого досвіду перегляду.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'trim' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Обрізати відео</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Початок: {formatTime(startTime)}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={videoDuration}
                        step={0.1}
                        value={startTime}
                        onChange={(e) => setStartTime(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Кінець: {formatTime(endTime)}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={videoDuration}
                        step={0.1}
                        value={endTime}
                        onChange={(e) => setEndTime(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="bg-gray-100 rounded p-3 text-sm">
                      <strong>Тривалість після обрізання:</strong> {formatTime(endTime - startTime)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Налаштування пропуску</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={skipIntro}
                            onChange={(e) => setSkipIntro(e.target.checked)}
                            className="rounded"
                          />
                          <span className="font-medium text-yellow-900">Пропустити інтро</span>
                        </label>
                        <span className="text-yellow-700 text-sm">
                          {formatTime(segments.find(s => s.type === 'intro')?.start || 0)} - {formatTime(introEnd)}
                        </span>
                      </div>
                      
                      {skipIntro && (
                        <div>
                          <button
                            onClick={() => setSegmentBoundary('intro', 'end')}
                            className="flex items-center space-x-1 text-yellow-700 text-sm hover:text-yellow-800"
                          >
                            <Scissors size={14} />
                            <span>Встановити кінець інтро тут ({formatTime(currentTime)})</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={skipOutro}
                            onChange={(e) => setSkipOutro(e.target.checked)}
                            className="rounded"
                          />
                          <span className="font-medium text-red-900">Пропустити аутро</span>
                        </label>
                        <span className="text-red-700 text-sm">
                          {formatTime(outroStart)} - {formatTime(segments.find(s => s.type === 'outro')?.end || videoDuration)}
                        </span>
                      </div>
                      
                      {skipOutro && (
                        <div>
                          <button
                            onClick={() => setSegmentBoundary('outro', 'start')}
                            className="flex items-center space-x-1 text-red-700 text-sm hover:text-red-800"
                          >
                            <Scissors size={14} />
                            <span>Встановити початок аутро тут ({formatTime(currentTime)})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="text-green-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">Ефективна тривалість</h4>
                      <p className="text-green-700">
                        {formatTime(getEffectiveDuration())} (заощаджено {formatTime((endTime - startTime) - getEffectiveDuration())})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Назва відео *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введіть назву відео"
                    maxLength={100}
                  />
                  <p className="text-gray-500 text-sm mt-1">{title.length}/100</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Опис
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Опишіть ваше відео"
                    maxLength={500}
                  />
                  <p className="text-gray-500 text-sm mt-1">{description.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Мініатюра
                  </label>
                  <div className="space-y-3">
                    {thumbnail ? (
                      <div className="relative">
                        <img
                          src={thumbnail}
                          alt="Thumbnail"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setThumbnail('')}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <FileVideo size={32} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Мініатюра буде згенерована автоматично</p>
                      </div>
                    )}
                    
                    <button
                      onClick={generateThumbnail}
                      disabled={isGeneratingThumbnail}
                      className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isGeneratingThumbnail ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Генерація...</span>
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          <span>Згенерувати мініатюру</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Налаштування відео</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>Оригінальна тривалість:</span>
                      <span>{formatTime(videoDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Обрізана тривалість:</span>
                      <span>{formatTime(endTime - startTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ефективна тривалість:</span>
                      <span className="font-semibold">{formatTime(getEffectiveDuration())}</span>
                    </div>
                    {skipIntro && (
                      <div className="flex justify-between text-yellow-700">
                        <span>• Пропуск інтро:</span>
                        <span>{formatTime(introEnd - startTime)}</span>
                      </div>
                    )}
                    {skipOutro && (
                      <div className="flex justify-between text-red-700">
                        <span>• Пропуск аутро:</span>
                        <span>{formatTime(endTime - outroStart)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Попередній перегляд</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{description}</p>
                      
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt="Thumbnail"
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Тривалість:</span>
                          <div className="font-semibold">{formatTime(getEffectiveDuration())}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Розмір файлу:</span>
                          <div className="font-semibold">
                            {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(skipIntro || skipOutro) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Zap className="text-green-600 mt-0.5" size={20} />
                          <div>
                            <h4 className="font-medium text-green-900 mb-1">Покращений досвід перегляду</h4>
                            <ul className="text-green-700 text-sm space-y-1">
                              {skipIntro && <li>• Інтро буде автоматично пропущено</li>}
                              {skipOutro && <li>• Аутро буде автоматично пропущено</li>}
                              <li>• Глядачі зможуть дивитися основний контент одразу</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {step !== 'upload' && (
              <button
                onClick={() => {
                  if (step === 'trim') setStep('upload');
                  else if (step === 'details') setStep('trim');
                  else if (step === 'preview') setStep('details');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {step === 'trim' && (
              <button
                onClick={() => setStep('details')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Далі
              </button>
            )}
            
            {step === 'details' && (
              <button
                onClick={() => setStep('preview')}
                disabled={!title.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Переглянути
              </button>
            )}
            
            {step === 'preview' && (
              <button
                onClick={handleUpload}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload size={16} />
                <span>Завантажити відео</span>
              </button>
            )}
          </div>
        </div>

        {/* Hidden canvas for thumbnail generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}