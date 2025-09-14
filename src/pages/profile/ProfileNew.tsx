import React, { useState, useEffect } from 'react';
import { useProfile } from './hooks/useProfile';
import { ProfileImageUpload } from '../../components/ProfileImageUpload';
import { ProfileSidebar } from './components/ProfileSidebar';
import { ProfileTabs } from './components/ProfileTabs';
import { ErrorNotification } from '../../components/ErrorNotification';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';

export const ProfileNew = () => {
  const {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile
  } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Post creation states
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState('photo');
  const [creatingPost, setCreatingPost] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [friends, setFriends] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [personalInfo, setPersonalInfo] = useState(null);
  const [loadingPersonalInfo, setLoadingPersonalInfo] = useState(false);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [loadingSuggestedFriends, setLoadingSuggestedFriends] = useState(false);
  
  const characterCount = postContent.length;
  const MAX_CHARACTERS = 500;
  
  const EMOJIS = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '❤️', '🎉', '🔥'];

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (profile && showNotesModal) {
      loadNotes();
    }
  }, [profile, showNotesModal]);

  useEffect(() => {
    if (profile) {
      loadFriends();
      loadPhotos();
      loadVideos();
      loadPersonalInfo();
      loadSuggestedFriends();
      loadPosts();
    }
  }, [profile]);

  const loadPosts = async () => {
    if (!profile?.id) return;
    
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          likes_count,
          comments_count,
          author:profiles!posts_author_id_fkey(
            id,
            name,
            last_name,
            avatar_url,
            friends_count
          ),
          post_likes!left(
            user_id
          )
        `)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
        return;
      }

      // Process posts to include like status
      const processedPosts = data?.map(post => ({
        ...post,
        isLiked: post.post_likes?.some(like => like.user_id === currentUser?.id) || false,
        author: {
          id: post.author.id,
          name: post.author.name,
          last_name: post.author.last_name,
          avatar: post.author.avatar_url,
          friends_count: post.author.friends_count
        }
      })) || [];
      
      setUserPosts(processedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleAvatarChange = async (newAvatarUrl) => {
    try {
      setSaving(true);
      await updateProfile({ avatar: newAvatarUrl });
      setSuccessMessage('Аватар успішно оновлено!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating avatar:', error);
      setErrorMessage('Помилка оновлення аватара');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!editedProfile) return;
    
    try {
      setSaving(true);
      await updateProfile(editedProfile);
      setIsEditing(false);
      setSuccessMessage('Профіль успішно збережено!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Помилка збереження профілю');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const addEmoji = (emoji) => {
    setPostContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !currentUser) return;
    
    setCreatingPost(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: postContent.trim(),
          media_url: postMediaUrl || null,
          media_type: postMediaType || null,
          author_id: currentUser.id,
          profile_id: profile.id
        })
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          likes_count,
          comments_count,
          author:profiles!posts_author_id_fkey(
            id,
            name,
            last_name,
            avatar_url,
            friends_count
          )
        `)
        .single();

      if (error) {
        console.error('Error creating post:', error);
        setErrorMessage('Помилка при створенні поста');
        return;
      }

      // Add new post to the beginning of the list
      const newPost = {
        ...data,
        isLiked: false,
        author: {
          id: data.author.id,
          name: data.author.name,
          last_name: data.author.last_name,
          avatar: data.author.avatar_url,
          friends_count: data.author.friends_count
        }
      };
      
      setUserPosts(prev => [newPost, ...prev]);
      
      // Clear form
      setPostContent('');
      setPostMediaUrl('');
      setPostMediaType('photo');
      setShowMediaInput(false);
      setSuccessMessage('Пост успішно створено!');
      
    } catch (error) {
      console.error('Error creating post:', error);
      setErrorMessage('Помилка при створенні поста');
    } finally {
      setCreatingPost(false);
    }
  };

  const saveNotes = async () => {
    try {
      setSavingNotes(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_notes')
          .upsert({
            user_id: user.id,
            profile_id: profile.id,
            notes: notes
          });
        
        if (error) throw error;
        setSuccessMessage('Нотатки збережено!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowNotesModal(false);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      setErrorMessage('Помилка збереження нотаток');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingNotes(false);
    }
  };

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && profile) {
        const { data, error } = await supabase
          .from('user_notes')
          .select('notes')
          .eq('user_id', user.id)
          .eq('profile_id', profile.id)
          .single();
        
        if (data && !error) {
          setNotes(data.notes || '');
        }
      }
    } catch (error) {
      console.log('No notes found or error loading notes');
    }
  };

  const loadFriends = async () => {
    if (!profile?.id) return;
    
    setLoadingFriends(true);
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          friend:profiles!friendships_friend_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'accepted')
        .limit(6);
      
      if (error) {
        console.error('Error loading friends:', error);
        return;
      }
      
      setFriends(data?.map(item => item.friend) || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadPhotos = async () => {
    if (!profile?.id) return;
    
    setLoadingPhotos(true);
    try {
      const { data, error } = await supabase
        .from('user_photos')
        .select('id, photo_url, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) {
        console.error('Error loading photos:', error);
        return;
      }
      
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const loadVideos = async () => {
    if (!profile?.id) return;
    
    setLoadingVideos(true);
    try {
      const { data, error } = await supabase
        .from('user_videos')
        .select('id, video_url, thumbnail_url, title, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) {
        console.error('Error loading videos:', error);
        return;
      }
      
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadPersonalInfo = async () => {
    if (!profile?.id) return;
    
    setLoadingPersonalInfo(true);
    try {
      const { data, error } = await supabase
        .from('user_personal_info')
        .select(`
          education,
          work_place,
          work_position,
          languages,
          interests,
          phone,
          website,
          social_links,
          family_members,
          life_events
        `)
        .eq('user_id', profile.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading personal info:', error);
        return;
      }
      
      setPersonalInfo(data || {});
    } catch (error) {
      console.error('Error loading personal info:', error);
    } finally {
      setLoadingPersonalInfo(false);
    }
  };

  const loadSuggestedFriends = async () => {
    if (!profile?.id) return;
    
    setLoadingSuggestedFriends(true);
    try {
      // Get current user's friends to exclude them from suggestions
      const { data: currentFriends } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', profile.id)
        .eq('status', 'accepted');
      
      const friendIds = currentFriends?.map(f => f.friend_id) || [];
      
      // Get suggested friends based on mutual friends and similar interests
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          city,
          interests
        `)
        .neq('id', profile.id)
        .not('id', 'in', `(${friendIds.join(',') || 'null'})`)
        .limit(5);
      
      if (error) {
        console.error('Error loading suggested friends:', error);
        return;
      }
      
      // Calculate mutual friends count for each suggestion
      const suggestionsWithMutuals = await Promise.all(
        (data || []).map(async (suggestion) => {
          const { data: mutualFriends } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', suggestion.id)
            .eq('status', 'accepted')
            .in('friend_id', friendIds);
          
          return {
            ...suggestion,
            mutualFriendsCount: mutualFriends?.length || 0
          };
        })
      );
      
      setSuggestedFriends(suggestionsWithMutuals);
    } catch (error) {
      console.error('Error loading suggested friends:', error);
    } finally {
      setLoadingSuggestedFriends(false);
    }
  };

  const sendFriendRequest = async (friendId) => {
    if (!currentUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUser.id,
          friend_id: friendId,
          status: 'pending'
        });
      
      if (error) {
        console.error('Error sending friend request:', error);
        return;
      }
      
      // Remove the user from suggested friends after sending request
      setSuggestedFriends(prev => prev.filter(friend => friend.id !== friendId));
      
      // Show success message
      setSuccessMessage('Запит на дружбу відправлено!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending friend request:', error);
      setErrorMessage('Помилка при відправці запиту на дружбу');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Помилка завантаження профілю</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      {/* Success/Error Notifications */}
      {successMessage && (
        <ErrorNotification
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage('')}
        />
      )}
      {errorMessage && (
        <ErrorNotification
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage('')}
        />
      )}

      <div className="ml-64 max-w-6xl mx-auto px-4 py-6">
        {/* VK-style Two Column Layout */}
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="w-80 space-y-4">
            {/* Avatar Block */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                {isEditing ? (
                  <ProfileImageUpload
                    currentAvatar={profile.avatar}
                    onUpload={handleAvatarChange || (() => {})}
                    onCancel={() => {}}
                    className="w-32 h-32 mx-auto rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto rounded-lg shadow-md overflow-hidden bg-white">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {profile.name?.[0]?.toUpperCase() || 'U'}{profile.last_name?.[0]?.toUpperCase() || ''}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  {!isEditing ? (
                    <>
                      {/* Show edit button only for own profile */}
                      {currentUser?.id === profile?.id && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Редагувати
                        </button>
                      )}
                      
                      {/* First button - Notes (for own profile) or Add Friend (for other profiles) */}
                      {currentUser?.id === profile?.id ? (
                        <button 
                          onClick={() => setShowNotesModal(true)}
                          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          Нотатки
                        </button>
                      ) : (
                        <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                          Додати в друзі
                        </button>
                      )}
                      
                      {/* Second button - Statistics */}
                      <button 
                        onClick={() => window.location.href = '/statistics'}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Статистика
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        {saving ? 'Збереження...' : 'Зберегти'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Скасувати
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics Block */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Статистика</h3>
                <button 
                  onClick={() => window.location.href = '/statistics'}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Детальна
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Друзі</span>
                  <span className="text-blue-600 font-medium">245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Фото</span>
                  <span className="text-blue-600 font-medium">89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Відео</span>
                  <span className="text-blue-600 font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Пости</span>
                  <span className="text-blue-600 font-medium">156</span>
                </div>
              </div>
            </div>

            {/* Friends Block */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Друзі</h3>
                <span className="text-sm text-gray-500">{friends.length}</span>
              </div>
              {loadingFriends ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {friends.slice(0, 6).map(friend => (
                      <div key={friend.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group cursor-pointer">
                        {friend.avatar_url ? (
                          <img 
                            src={friend.avatar_url} 
                            alt={friend.full_name || friend.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {(friend.full_name || friend.username)?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-end">
                          <div className="text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                            {friend.full_name || friend.username}
                          </div>
                        </div>
                      </div>
                    ))}
                    {friends.length === 0 && (
                      <div className="col-span-3 text-center py-4 text-gray-500">
                        Немає друзів
                      </div>
                    )}
                  </div>
                  {friends.length > 0 && (
                    <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Показати всіх друзів ({friends.length})
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Photos Block */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Фото</h3>
                <span className="text-sm text-gray-500">{photos.length}</span>
              </div>
              {loadingPhotos ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(0, 6).map(photo => (
                      <div key={photo.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                        <img 
                          src={photo.photo_url} 
                          alt="User photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {photos.length === 0 && (
                      <div className="col-span-3 text-center py-4 text-gray-500">
                        Немає фото
                      </div>
                    )}
                  </div>
                  {photos.length > 0 && (
                    <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Показати всі фото ({photos.length})
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Videos Block */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Відео</h3>
                <span className="text-sm text-gray-500">{videos.length}</span>
              </div>
              {loadingVideos ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {videos.slice(0, 4).map(video => (
                      <div key={video.id} className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity">
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title || 'Video thumbnail'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-400 to-orange-400"></div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-4 border-l-gray-700 border-y-2 border-y-transparent ml-1"></div>
                          </div>
                        </div>
                        {video.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                            {video.title}
                          </div>
                        )}
                      </div>
                    ))}
                    {videos.length === 0 && (
                      <div className="col-span-2 text-center py-4 text-gray-500">
                        Немає відео
                      </div>
                    )}
                  </div>
                  {videos.length > 0 && (
                    <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Показати всі відео ({videos.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Right Column */}
          <div className="flex-1 space-y-4">
            {/* Name and Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.name} {profile.last_name}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                {profile.city && (
                  <span className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{profile.city}</span>
                  </span>
                )}
                {profile.age && (
                  <span>{profile.age} років</span>
                )}
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Онлайн</span>
                </span>
              </div>
              
              {/* Hobbies */}
              {profile.bio && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Хобі та інтереси</h3>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Особиста інформація</h3>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Редагувати
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                    <input
                      type="text"
                      value={editedProfile?.name || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                    <input
                      type="text"
                      value={editedProfile?.last_name || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Місто</label>
                    <input
                      type="text"
                      value={editedProfile?.city || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Вік</label>
                    <input
                      type="number"
                      value={editedProfile?.age || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, age: parseInt(e.target.value) || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Біографія/Хобі</label>
                    <textarea
                      value={editedProfile?.bio || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">День народження</label>
                    <input
                      type="date"
                      value={editedProfile?.birth_date || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, birth_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Сімейний стан</label>
                    <select
                      value={editedProfile?.relationship_status || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, relationship_status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="single">Не одружений/не заміжня</option>
                      <option value="married">Одружений/заміжня</option>
                      <option value="in_relationship">У стосунках</option>
                      <option value="complicated">Все складно</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Освіта</label>
                    <input
                      type="text"
                      value={editedProfile?.education || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, education: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">День народження:</span>
                    <span className="text-gray-900">{profile?.birth_date || 'Не вказано'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Сімейний стан:</span>
                    <span className="text-gray-900">
                      {profile?.relationship_status === 'single' ? 'Не одружений/не заміжня' :
                       profile?.relationship_status === 'married' ? 'Одружений/заміжня' :
                       profile?.relationship_status === 'in_relationship' ? 'У стосунках' :
                       profile?.relationship_status === 'complicated' ? 'Все складно' :
                       'Не вказано'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Освіта:</span>
                    <span className="text-gray-900">{profile?.education || 'Не вказано'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Місто:</span>
                    <span className="text-gray-900">{profile?.city || 'Не вказано'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Personal Information */}
            {personalInfo && Object.keys(personalInfo).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Детальна інформація</h3>
                {loadingPersonalInfo ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {personalInfo.work_place && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Робота</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Місце роботи:</span>
                            <span className="text-gray-900">{personalInfo.work_place}</span>
                          </div>
                          {personalInfo.work_position && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Посада:</span>
                              <span className="text-gray-900">{personalInfo.work_position}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {personalInfo.languages && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Мови</h4>
                        <div className="flex flex-wrap gap-2">
                          {personalInfo.languages.split(',').map((lang, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                              {lang.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {personalInfo.interests && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Інтереси</h4>
                        <div className="flex flex-wrap gap-2">
                          {personalInfo.interests.split(',').map((interest, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                              {interest.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {personalInfo.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Телефон:</span>
                        <span className="text-gray-900">{personalInfo.phone}</span>
                      </div>
                    )}
                    
                    {personalInfo.website && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Веб-сайт:</span>
                        <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                          {personalInfo.website}
                        </a>
                      </div>
                    )}
                    
                    {personalInfo.family_members && personalInfo.family_members.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Сім'я</h4>
                        <div className="space-y-1">
                          {personalInfo.family_members.map((member, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-gray-600">{member.relationship}:</span>
                              <span className="text-gray-900">{member.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {personalInfo.life_events && personalInfo.life_events.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Життєві події</h4>
                        <div className="space-y-2">
                          {personalInfo.life_events.map((event, index) => (
                            <div key={index} className="border-l-2 border-blue-200 pl-3">
                              <div className="font-medium text-gray-900">{event.title}</div>
                              <div className="text-sm text-gray-600">{event.date}</div>
                              {event.description && (
                                <div className="text-sm text-gray-700 mt-1">{event.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Statistics Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">245</div>
                  <div className="text-sm text-gray-600">друзів</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">89</div>
                  <div className="text-sm text-gray-600">фото</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-600">відео</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">156</div>
                  <div className="text-sm text-gray-600">постів</div>
                </div>
              </div>
            </div>

            {/* Suggested Friends */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Можливі знайомі</h3>
              {loadingSuggestedFriends ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedFriends.length > 0 ? (
                    suggestedFriends.map(friend => (
                      <div key={friend.id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          {friend.avatar_url ? (
                            <img 
                              src={friend.avatar_url} 
                              alt={friend.full_name || friend.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {(friend.full_name || friend.username)?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {friend.full_name || friend.username}
                          </div>
                          <div className="text-sm text-gray-600">
                            {friend.mutualFriendsCount > 0 
                              ? `${friend.mutualFriendsCount} спільних друзів`
                              : friend.city 
                                ? `з ${friend.city}`
                                : 'Можливий знайомий'
                            }
                          </div>
                        </div>
                        <button 
                          onClick={() => sendFriendRequest(friend.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Додати
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Немає пропозицій знайомих
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Posts Section */}
            {profile && (
              <ProfileTabs
                profile={profile}
                postContent={postContent}
                setPostContent={setPostContent}
                postMediaUrl={postMediaUrl}
                setPostMediaUrl={setPostMediaUrl}
                postMediaType={postMediaType}
                setPostMediaType={setPostMediaType}
                creatingPost={creatingPost}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                showMediaInput={showMediaInput}
                setShowMediaInput={setShowMediaInput}
                characterCount={characterCount}
                MAX_CHARACTERS={MAX_CHARACTERS}
                EMOJIS={EMOJIS}
                addEmoji={addEmoji}
                handleCreatePost={handleCreatePost}
                loadingPosts={loadingPosts}
                userPosts={userPosts}
                currentUser={currentUser}
                setUserPosts={setUserPosts}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Нотатки</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Додайте свої нотатки про цього користувача..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Скасувати
              </button>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingNotes ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileNew;
