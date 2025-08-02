import { useState, useEffect } from 'react';
import { createPost, getUserPosts } from '../../../lib/postService';
import { UserProfile } from '../types';

export const usePosts = (currentUser: any, profile: UserProfile | null) => {
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const MAX_CHARACTERS = 280;
  const EMOJIS = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '😭', '😎', '🥳', '💪', '✨', '🌟', '💯'];

  useEffect(() => {
    console.log('🔄 Posts useEffect triggered:', { currentUser: !!currentUser, profile: !!profile, profileId: profile?.id });
    if (currentUser && profile) {
      loadUserPosts();
    }
  }, [currentUser, profile]);

  useEffect(() => {
    setCharacterCount(postContent.length);
  }, [postContent]);

  const addEmoji = (emoji: string) => {
    if (characterCount + emoji.length <= MAX_CHARACTERS) {
      setPostContent(prev => prev + emoji);
    }
  };

  const handleCreatePost = async (e: any) => {
    e.preventDefault();
    if (!postContent.trim() || !currentUser || characterCount > MAX_CHARACTERS) return;
    
    console.log('🔍 Creating post:', { content: postContent, media_url: postMediaUrl, media_type: postMediaType });
    console.log('🔍 Current user:', currentUser?.email);
    console.log('🔍 Current profile:', profile?.id);
    setCreatingPost(true);
    try {
      const { data, error } = await createPost({
        content: postContent,
        media_url: postMediaUrl || undefined,
        media_type: postMediaType || undefined,
      });
      
      if (error) {
        console.error('❌ Error creating post:', error);
        throw error;
      }
      
      console.log('✅ Post created successfully:', data);
      console.log('✅ Post data structure:', JSON.stringify(data, null, 2));
      
      if (data && data[0]) {
        const newPost = data[0];
        console.log('✅ New post from database:', newPost);
        
        const processedPost = {
          ...newPost,
          likes_count: 0,
          comments_count: 0,
          isLiked: false,
          author: {
            id: profile?.id || '',
            name: profile?.name || '',
            last_name: profile?.last_name || '',
            avatar: profile?.avatar || '',
            friends_count: 0
          }
        };
        console.log('✅ Processed post for UI:', processedPost);
        
        setUserPosts(prev => {
          const newPosts = [processedPost, ...prev];
          console.log('✅ Updated posts state:', newPosts.length, 'posts');
          return newPosts;
        });
      } else {
        console.warn('⚠️ No post data returned from createPost');
      }
      
      setPostContent('');
      setPostMediaUrl('');
      setPostMediaType('');
      setShowMediaInput(false);
      setShowEmojiPicker(false);
      
      setTimeout(() => {
        console.log('🔄 Reloading posts to verify persistence...');
        loadUserPosts();
      }, 1000);
      
    } catch (e: any) {
      console.error('❌ Error creating post:', e);
      throw new Error('Не вдалося створити пост');
    } finally {
      setCreatingPost(false);
    }
  };

  const loadUserPosts = async () => {
    if (!currentUser || !profile) {
      console.log('❌ Cannot load posts: currentUser or profile is missing', { currentUser: !!currentUser, profile: !!profile });
      return;
    }
    
    console.log('🔍 Loading user posts for profile:', profile.id);
    console.log('🔍 Profile details:', { id: profile.id, name: profile.name, auth_user_id: profile.auth_user_id });
    setLoadingPosts(true);
    try {
      const { data, error } = await getUserPosts(profile.id);
      console.log('🔍 getUserPosts result:', { data: data?.length || 0, error: error?.message });
      
      if (error) {
        console.error('Error fetching posts:', error);
        setUserPosts([]);
        return;
      }
      
      console.log('✅ Posts loaded:', data?.length || 0, 'posts');
      if (data && data.length > 0) {
        console.log('📄 First post sample:', data[0]);
      }
      setUserPosts(data || []);
    } catch (error) {
      console.error('Error loading user posts:', error);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'щойно';
    } else if (diffInHours < 24) {
      return `${diffInHours}г тому`;
    } else {
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return {
    postContent,
    setPostContent,
    postMediaUrl,
    setPostMediaUrl,
    postMediaType,
    setPostMediaType,
    creatingPost,
    showEmojiPicker,
    setShowEmojiPicker,
    showMediaInput,
    setShowMediaInput,
    characterCount,
    userPosts,
    setUserPosts,
    loadingPosts,
    MAX_CHARACTERS,
    EMOJIS,
    addEmoji,
    handleCreatePost,
    loadUserPosts,
    formatPostDate
  };
}; 