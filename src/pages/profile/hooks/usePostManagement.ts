import { useState } from 'react';

export const usePostManagement = (createPost) => {
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);

  const MAX_CHARACTERS = 500;
  const characterCount = postContent.length;

  const addEmoji = (emoji) => {
    setPostContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !postMediaUrl) return;
    
    try {
      await createPost({
        content: postContent,
        media_url: postMediaUrl,
        media_type: postMediaType
      });
      
      setPostContent('');
      setPostMediaUrl('');
      setPostMediaType(null);
      setShowMediaInput(false);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Помилка створення поста:', error);
      // Тут можна додати логіку для відображення повідомлення про помилку користувачеві
    }
  };

  return {
    postContent,
    setPostContent,
    postMediaUrl,
    setPostMediaUrl,
    postMediaType,
    setPostMediaType,
    showEmojiPicker,
    setShowEmojiPicker,
    showMediaInput,
    setShowMediaInput,
    MAX_CHARACTERS,
    characterCount,
    addEmoji,
    handleCreatePost,
  };
};