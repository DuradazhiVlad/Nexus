import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { ReelsService, Reel, ReelComment } from './services/reelsService';
import { ErrorNotification, useErrorNotifications } from '../../components/ErrorNotification';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Upload, 
  Plus, 
  Eye, 
  EyeOff,
  Bookmark,
  BookmarkCheck,
  UserPlus,
  UserCheck,
  Flag,
  Download,
  Copy,
  ExternalLink,
  Music,
  Search,
  Filter,
  Shuffle,
  TrendingUp,
  Clock,
  Globe,
  Users,
  Award,
  Zap,
  Camera,
  Video,
  Scissors,
  Sparkles,
  Wand2,
  Layers,
  Palette,
  Type,
  Mic,
  MicOff,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  SkipBack,
  SkipForward,
  RotateCcw,
  Maximize,
  Minimize
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Using Reel and ReelComment interfaces from service

type FilterType = 'all' | 'trending' | 'following' | 'music' | 'comedy' | 'dance' | 'food' | 'travel' | 'sports' | 'education' | 'pets' | 'art';

export function Reels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Video upload states
  const [uploadStep, setUploadStep] = useState<'select' | 'edit' | 'details' | 'uploading'>('select');
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoHashtags, setVideoHashtags] = useState<string[]>([]);
  const [videoLocation, setVideoLocation] = useState('');
  const [videoCategory, setVideoCategory] = useState<Reel['category']>('other');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<Reel['music']>();
  const { showError } = useErrorNotifications();
  
  // Video editing states
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sepia: 0,
    grayscale: 0
  });
  
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editVideoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadReels();
    }
  }, [currentUser, activeFilter]);

  useEffect(() => {
    // Auto-play current video
    if (reels.length > 0 && videoRefs.current[currentReelIndex]) {
      const currentVideo = videoRefs.current[currentReelIndex];
      if (currentVideo) {
        if (isPlaying) {
          currentVideo.play().catch(console.error);
        } else {
          currentVideo.pause();
        }
        currentVideo.muted = isMuted;
      }
    }
  }, [currentReelIndex, isPlaying, isMuted, reels]);

  useEffect(() => {
    // Pause other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentReelIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentReelIndex]);

  useEffect(() => {
    // Handle scroll to change reels
    const handleScroll = (e: WheelEvent) => {
      if (!isFullscreen) return;
      
      e.preventDefault();
      if (e.deltaY > 0 && currentReelIndex < reels.length - 1) {
        setCurrentReelIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentReelIndex > 0) {
        setCurrentReelIndex(prev => prev - 1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleScroll, { passive: false });
      return () => container.removeEventListener('wheel', handleScroll);
    }
  }, [currentReelIndex, reels.length, isFullscreen]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/login');
    }
  };

  const loadReels = async () => {
    try {
      setLoading(true);
      
      const allReels = await ReelsService.getReels();
      
      // Фільтрація за активним фільтром
      let filteredReels = allReels;
      if (activeFilter !== 'all') {
        if (activeFilter === 'trending') {
          filteredReels = allReels.filter(reel => reel.views > 10000).sort((a, b) => b.views - a.views);
        } else if (activeFilter === 'following') {
          filteredReels = allReels.filter(reel => reel.isFollowing);
        } else {
          filteredReels = allReels.filter(reel => reel.category === activeFilter);
        }
      }
      
      // Пошук
      if (searchQuery) {
        filteredReels = filteredReels.filter(reel => 
          reel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reel.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reel.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          reel.userName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setReels(filteredReels);
      setCurrentReelIndex(0);
    } catch (error) {
      console.error('Error loading reels:', error);
      showError('Помилка завантаження рілсів');
    } finally {
      setLoading(false);
    }
  };



  const loadComments = async (reelId: string) => {
    try {
      const reelComments = await ReelsService.getReelComments(reelId);
      setComments(reelComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      showError('Помилка завантаження коментарів');
    }
  };

  const toggleLike = async (reelId: string) => {
    try {
      const currentReel = reels.find(reel => reel.id === reelId);
      if (!currentReel) return;
      
      if (currentReel.isLiked) {
        await ReelsService.unlikeReel(reelId);
      } else {
        await ReelsService.likeReel(reelId);
      }
      
      setReels(prev => prev.map(reel => 
        reel.id === reelId 
          ? { 
              ...reel, 
              isLiked: !reel.isLiked,
              likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1
            }
          : reel
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      showError('Помилка при лайку');
    }
  };

  const toggleBookmark = async (reelId: string) => {
    try {
      const currentReel = reels.find(reel => reel.id === reelId);
      if (!currentReel) return;
      
      if (currentReel.isBookmarked) {
        await ReelsService.unbookmarkReel(reelId);
      } else {
        await ReelsService.bookmarkReel(reelId);
      }
      
      setReels(prev => prev.map(reel => 
        reel.id === reelId 
          ? { 
              ...reel, 
              isBookmarked: !reel.isBookmarked,
              bookmarks: reel.isBookmarked ? reel.bookmarks - 1 : reel.bookmarks + 1
            }
          : reel
      ));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showError('Помилка при додаванні в закладки');
    }
  };

  const toggleFollow = async (userId: string) => {
    setReels(prev => prev.map(reel => 
      reel.userId === userId 
        ? { ...reel, isFollowing: !reel.isFollowing }
        : reel
    ));
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    try {
      const currentReel = reels[currentReelIndex];
      const comment = await ReelsService.addComment(currentReel.id, newComment);
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      
      // Оновлюємо лічильник коментарів
      setReels(prev => prev.map(reel => 
        reel.id === currentReel.id 
          ? { ...reel, comments: reel.comments + 1 }
          : reel
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Помилка при додаванні коментаря');
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setUploadStep('edit');
    }
  };

  const handleVideoLoad = () => {
    const video = editVideoRef.current;
    if (video) {
      setVideoDuration(video.duration);
      setTrimEnd(video.duration);
    }
  };

  const resetUpload = () => {
    setUploadStep('select');
    setSelectedVideo(null);
    setVideoPreview('');
    setVideoTitle('');
    setVideoDescription('');
    setVideoHashtags([]);
    setVideoLocation('');
    setVideoCategory('other');
    setSelectedMusic(undefined);
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sepia: 0,
      grayscale: 0
    });
    setTrimStart(0);
    setTrimEnd(0);
  };

  const uploadReel = async () => {
    if (!selectedVideo || !currentUser) return;
    
    try {
      setUploadStep('uploading');
      setUploadProgress(0);
      
      const reelData = {
        title: videoTitle,
        description: videoDescription,
        hashtags: videoHashtags,
        location: videoLocation,
        category: videoCategory,
        music: selectedMusic
      };
      
      const newReel = await ReelsService.uploadReel(
        selectedVideo,
        reelData,
        (progress) => setUploadProgress(progress)
      );
      
      setReels(prev => [newReel, ...prev]);
      setShowUploadModal(false);
      resetUpload();
      setCurrentReelIndex(0);
    } catch (error) {
      console.error('Error uploading reel:', error);
      showError('Помилка при завантаженні рілсу');
      setUploadStep('details');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) return `${hours} год тому`;
    return `${days} дн тому`;
  };

  const nextReel = () => {
    if (currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(prev => prev + 1);
    }
  };

  const prevReel = () => {
    if (currentReelIndex > 0) {
      setCurrentReelIndex(prev => prev - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Завантаження рілс...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isFullscreen) {
    return (
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-black border-b border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-white">Рілс</h1>
                
                {/* Filter tabs */}
                <div className="flex space-x-2">
                  {[
                    { id: 'all', label: 'Всі', icon: Globe },
                    { id: 'trending', label: 'Тренди', icon: TrendingUp },
                    { id: 'following', label: 'Підписки', icon: Users },
                    { id: 'music', label: 'Музика', icon: Music },
                    { id: 'comedy', label: 'Комедія', icon: Sparkles },
                    { id: 'dance', label: 'Танці', icon: Zap }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id as FilterType)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-colors ${
                        activeFilter === filter.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <filter.icon size={16} />
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Search size={20} />
                  </button>
                  
                  {showSearch && (
                    <div className="absolute right-0 top-12 w-80 bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-4 z-50">
                      <input
                        type="text"
                        placeholder="Пошук рілс..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  <span>Створити</span>
                </button>

                {/* Fullscreen toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                >
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Reels grid preview */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {reels.map((reel, index) => (
                <div
                  key={reel.id}
                  className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200"
                  onClick={() => {
                    setCurrentReelIndex(index);
                    toggleFullscreen();
                  }}
                >
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        {reel.userAvatar ? (
                          <img src={reel.userAvatar} alt={reel.userName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {reel.userName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-white text-sm font-medium">{reel.userName}</span>
                      {reel.isVerified && (
                        <Check size={12} className="text-blue-500" />
                      )}
                    </div>
                    
                    <p className="text-white text-sm line-clamp-2 mb-2">{reel.title}</p>
                    
                    <div className="flex items-center justify-between text-white/80 text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Heart size={12} className="mr-1" />
                          {formatNumber(reel.likes)}
                        </span>
                        <span className="flex items-center">
                          <Eye size={12} className="mr-1" />
                          {formatNumber(reel.views)}
                        </span>
                      </div>
                      <span>{formatTime(reel.duration)}</span>
                    </div>
                  </div>
                  
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen view
  const currentReel = reels[currentReelIndex];
  if (!currentReel) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex" ref={containerRef}>
      {/* Main video area */}
      <div className="flex-1 relative flex items-center justify-center">
        <video
          ref={(el) => { videoRefs.current[currentReelIndex] = el; }}
          src={currentReel.videoUrl}
          className="max-h-full max-w-full object-contain"
          loop
          playsInline
          onClick={() => setIsPlaying(!isPlaying)}
        />
        
        {/* Video controls overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {!isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center text-white"
            >
              <Play size={24} />
            </button>
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prevReel}
          disabled={currentReelIndex === 0}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/50 transition-colors"
        >
          <ChevronUp size={20} />
        </button>
        
        <button
          onClick={nextReel}
          disabled={currentReelIndex === reels.length - 1}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/50 transition-colors"
        >
          <ChevronDown size={20} />
        </button>

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
          >
            <Minimize size={20} />
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="w-full h-1 bg-white/30 rounded-full">
            <div 
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / currentReel.duration) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right sidebar with info and actions */}
      <div className="w-80 bg-black/50 backdrop-blur-sm p-6 overflow-y-auto">
        {/* User info */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            {currentReel.userAvatar ? (
              <img src={currentReel.userAvatar} alt={currentReel.userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                {currentReel.userName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-semibold">{currentReel.userName}</h3>
              {currentReel.isVerified && (
                <Check size={16} className="text-blue-500" />
              )}
            </div>
            <p className="text-white/60 text-sm">{formatTimeAgo(currentReel.createdAt)}</p>
          </div>
          
          {currentReel.userId !== currentUser && (
            <button
              onClick={() => toggleFollow(currentReel.userId)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                currentReel.isFollowing
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentReel.isFollowing ? 'Відписатися' : 'Підписатися'}
            </button>
          )}
        </div>

        {/* Reel info */}
        <div className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-2">{currentReel.title}</h2>
          <p className="text-white/80 text-sm mb-3">{currentReel.description}</p>
          
          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {currentReel.hashtags.map((tag, index) => (
              <span key={index} className="text-blue-400 text-sm hover:text-blue-300 cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
          
          {/* Music */}
          {currentReel.music && (
            <div className="flex items-center space-x-2 text-white/60 text-sm mb-3">
              <Music size={14} />
              <span>{currentReel.music.artist} - {currentReel.music.title}</span>
            </div>
          )}
          
          {/* Location */}
          {currentReel.location && (
            <div className="flex items-center space-x-2 text-white/60 text-sm">
              <Globe size={14} />
              <span>{currentReel.location}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
          <div>
            <div className="text-white text-lg font-semibold">{formatNumber(currentReel.views)}</div>
            <div className="text-white/60 text-sm">Переглядів</div>
          </div>
          <div>
            <div className="text-white text-lg font-semibold">{formatNumber(currentReel.likes)}</div>
            <div className="text-white/60 text-sm">Вподобань</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => toggleLike(currentReel.id)}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
              currentReel.isLiked
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <Heart size={20} className={currentReel.isLiked ? 'fill-current' : ''} />
            <span>{currentReel.isLiked ? 'Не подобається' : 'Подобається'}</span>
          </button>
          
          <button
            onClick={() => {
              setShowComments(true);
              loadComments(currentReel.id);
            }}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <MessageCircle size={20} />
            <span>Коментарі ({formatNumber(currentReel.comments)})</span>
          </button>
          
          <button
            onClick={() => toggleBookmark(currentReel.id)}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
              currentReel.isBookmarked
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            {currentReel.isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            <span>{currentReel.isBookmarked ? 'В збережених' : 'Зберегти'}</span>
          </button>
          
          <button className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Share2 size={20} />
            <span>Поділитися</span>
          </button>
        </div>

        {/* Related reels preview */}
        <div>
          <h4 className="text-white font-semibold mb-3">Схожі рілс</h4>
          <div className="grid grid-cols-2 gap-2">
            {reels.slice(currentReelIndex + 1, currentReelIndex + 5).map((reel, index) => (
              <div
                key={reel.id}
                className="aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setCurrentReelIndex(currentReelIndex + 1 + index)}
              >
                <img
                  src={reel.thumbnailUrl}
                  alt={reel.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comments modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white text-lg font-semibold">
                Коментарі ({formatNumber(currentReel.comments)})
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {comment.userName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-medium text-sm">{comment.userName}</span>
                      <span className="text-gray-400 text-xs">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-white/80 text-sm mb-2">{comment.content}</p>
                    
                    <div className="flex items-center space-x-4 text-gray-400 text-xs">
                      <button className="hover:text-white flex items-center space-x-1">
                        <Heart size={12} className={comment.isLiked ? 'fill-current text-red-500' : ''} />
                        <span>{comment.likes}</span>
                      </button>
                      <button className="hover:text-white">Відповісти</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Додати коментар..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Надіслати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {uploadStep === 'select' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-2xl font-bold">Створити рел</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div
                  className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-gray-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">Завантажити відео</h3>
                  <p className="text-gray-400 mb-4">Перетягніть відео сюди або натисніть для вибору</p>
                  <p className="text-gray-500 text-sm">Підтримувані формати: MP4, MOV, AVI. Максимум 100MB</p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            )}

            {uploadStep === 'edit' && (
              <div className="flex h-[80vh]">
                <div className="flex-1 bg-black flex items-center justify-center p-6">
                  <video
                    ref={editVideoRef}
                    src={videoPreview}
                    className="max-h-full max-w-full object-contain"
                    controls
                    onLoadedMetadata={handleVideoLoad}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    style={{
                      filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%)`
                    }}
                  />
                </div>
                
                <div className="w-80 bg-gray-800 p-6 overflow-y-auto">
                  <h3 className="text-white text-lg font-semibold mb-4">Редагування відео</h3>
                  
                  {/* Trim controls */}
                  <div className="mb-6">
                    <h4 className="text-white font-medium mb-3">Обрізати відео</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">Початок: {formatTime(trimStart)}</label>
                        <input
                          type="range"
                          min={0}
                          max={videoDuration}
                          step={0.1}
                          value={trimStart}
                          onChange={(e) => setTrimStart(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">Кінець: {formatTime(trimEnd)}</label>
                        <input
                          type="range"
                          min={0}
                          max={videoDuration}
                          step={0.1}
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <p className="text-gray-400 text-sm">Тривалість: {formatTime(trimEnd - trimStart)}</p>
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="mb-6">
                    <h4 className="text-white font-medium mb-3">Фільтри</h4>
                    <div className="space-y-3">
                      {Object.entries(filters).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-gray-300 text-sm mb-1 capitalize">
                            {key}: {value}{key === 'blur' ? 'px' : '%'}
                          </label>
                          <input
                            type="range"
                            min={key === 'blur' ? 0 : key === 'brightness' || key === 'contrast' || key === 'saturation' ? 50 : 0}
                            max={key === 'blur' ? 10 : key === 'brightness' || key === 'contrast' || key === 'saturation' ? 150 : 100}
                            value={value}
                            onChange={(e) => setFilters(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setUploadStep('select')}
                      className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Назад
                    </button>
                    <button
                      onClick={() => setUploadStep('details')}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Далі
                    </button>
                  </div>
                </div>
              </div>
            )}

            {uploadStep === 'details' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-2xl font-bold">Деталі рілу</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Назва *</label>
                      <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Введіть назву рілу"
                        maxLength={100}
                      />
                      <p className="text-gray-400 text-sm mt-1">{videoTitle.length}/100</p>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Опис</label>
                      <textarea
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Розкажіть про ваш рел"
                        maxLength={500}
                      />
                      <p className="text-gray-400 text-sm mt-1">{videoDescription.length}/500</p>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Категорія</label>
                      <select
                        value={videoCategory}
                        onChange={(e) => setVideoCategory(e.target.value as Reel['category'])}
                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="other">Інше</option>
                        <option value="music">Музика</option>
                        <option value="comedy">Комедія</option>
                        <option value="dance">Танці</option>
                        <option value="food">Їжа</option>
                        <option value="travel">Подорожі</option>
                        <option value="sports">Спорт</option>
                        <option value="education">Освіта</option>
                        <option value="pets">Тварини</option>
                        <option value="art">Мистецтво</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Локація</label>
                      <input
                        type="text"
                        value={videoLocation}
                        onChange={(e) => setVideoLocation(e.target.value)}
                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Де було знято відео"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Хештеги</label>
                      <input
                        type="text"
                        placeholder="Додайте хештеги через кому"
                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value && !videoHashtags.includes(`#${value}`)) {
                              setVideoHashtags(prev => [...prev, `#${value}`]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {videoHashtags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => setVideoHashtags(prev => prev.filter((_, i) => i !== index))}
                              className="hover:text-red-300"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Попередній перегляд</h4>
                      <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                        <video
                          src={videoPreview}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setUploadStep('edit')}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Назад
                  </button>
                  <button
                    onClick={uploadReel}
                    disabled={!videoTitle.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Опублікувати
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'uploading' && (
              <div className="p-6 text-center">
                <div className="mb-6">
                  <h2 className="text-white text-2xl font-bold mb-2">Завантаження рілу</h2>
                  <p className="text-gray-400">Будь ласка, зачекайте...</p>
                </div>
                
                <div className="w-64 mx-auto">
                  <div className="bg-gray-700 rounded-full h-4 mb-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-white text-lg font-semibold">{uploadProgress}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <ErrorNotification />
    </div>
  );
}